"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode, LineStyle } from "lightweight-charts";
import { useWebSocketData } from "../services/WebSocketDataProvider";

/* ---------- tema ---------- */
const THEME = {
  text: "#e5e7eb",
  textDim: "rgba(229,231,235,.75)",
  grid: "rgba(255,255,255,.06)",
  gridLite: "rgba(255,255,255,.04)",
  border: "rgba(255,255,255,.10)",
  font: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  accentG: "#22c55e",
  accentGTop: "rgba(34,197,94,.08)",
  accentGBottom: "rgba(34,197,94,.02)",
};

const TIME_ZONE = "America/Bogota";

const BASE_OPTS = {
  layout: {
    background: { type: "solid", color: "transparent" },
    textColor: THEME.textDim,
    fontFamily: THEME.font,
  },
  grid: {
    vertLines: { color: THEME.gridLite, style: LineStyle.Dotted },
    horzLines: { color: THEME.grid, style: LineStyle.Dotted },
  },
  watermark: {
    visible: true,
    color: "rgba(255,255,255,.04)",
    text: "USD/COP",
    fontSize: 24,
    horzAlign: "left",
    vertAlign: "bottom",
  },
  leftPriceScale: {
    visible: true,
    borderColor: THEME.border,
    scaleMargins: { top: 0.12, bottom: 0.18 },
    entireTextOnly: true,
    borderVisible: true,
  },
  rightPriceScale: { visible: false },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "rgba(255,255,255,.30)", style: LineStyle.Dotted, width: 1 },
    horzLine: { color: "rgba(255,255,255,.30)", style: LineStyle.Dotted, width: 1 },
    },
  timeScale: {
    borderColor: THEME.border,
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 12,
    barSpacing: 7,
    lockVisibleTimeRangeOnResize: true,
  },
};

/* ===== helpers de parseo/reuso ===== */
const tryJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
function parseWeird(s) {
  if (typeof s !== "string") return null;
  let t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) t = t.slice(1, -1);
  t = t.replace(/\\"/g, '"').replace(/\\n|\\r/g, "");
  const j = tryJson(t); if (j) return j;
  let fixed = t;
  if (/^\s*(data|labels|datasets|prices|open|high|low|close)\s*:/.test(fixed)) fixed = `{${fixed}}`;
  fixed = fixed.replace(/'/g, '"')
               .replace(/([\s{,])([a-zA-Z_][\w]*)\s*:/g, '$1"$2":')
               .replace(/,\s*]/g, "]")
               .replace(/,\s*}/g, "}");
  return tryJson(fixed);
}
const numbersFromString = (s) =>
  typeof s === "string"
    ? (s.match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((n) => !Number.isNaN(n))
    : null;

function labelsFromString(s) {
  if (typeof s !== "string") return null;
  const j = tryJson(s);
  if (Array.isArray(j)) return j;
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
function firstChartLike(obj) {
  if (!obj || typeof obj !== "object") return null;
  const isChart = (o) =>
    o &&
    ((Array.isArray(o.datasets) &&
      (Array.isArray(o.datasets?.[0]?.data) || typeof o.datasets?.[0]?.data === "string")) ||
      Array.isArray(o.prices) ||
      typeof o.prices === "string" ||
      Array.isArray(o.candles) ||
      Array.isArray(o.ohlc));
  const seeds = [obj, obj?.data, obj?.result?.[0], obj?.data?.data, obj?.result?.[0]?.data];
  for (const s of seeds) if (isChart(s)) return s;
  const q = seeds.filter(Boolean); const seen = new Set();
  while (q.length) {
    const cur = q.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    if (isChart(cur)) return cur;
    for (const k of Object.keys(cur)) {
      const v = cur[k];
      if (typeof v === "string") {
        const p = parseWeird(v);
        if (p) q.push(p);
      } else if (v && typeof v === "object") q.push(v);
    }
  }
  return null;
}


function toEpochSeconds(t) {
  if (t == null) return null;
  if (typeof t === "number") return t > 1e12 ? Math.floor(t / 1000) : t;
  if (typeof t === "object" && "timestamp" in t) return Math.floor(t.timestamp);
  return null;
}

function labelToTsSec(label, index, { baseMidnightMs, range}) {
  if (typeof label === "number") return toEpochSeconds(label);
  if (typeof label === "string") {
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(label)) {
      const d = Date.parse(label.replace(" ", "T"));
      if (!Number.isNaN(d)) return Math.floor(d / 1000);
  }
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      const d = Date.parse(label);
      if (!Number.isNaN(d)) return Math.floor(d / 1000);
    }
    if (/^\d{2}:\d{2}:\d{2}$/.test(label)) {
      const [ H, M, S] = label.split(":").map(Number);
      return Math.floor((baseMidnightMs + ((H * 60 + M) * 60 + S)* 1000)/ 1000)
    }
    if (/^\d{2}:\d{2}$/.test(label)) {
      const [H, M] = label.split(":").map(Number);
      return Math.floor((baseMidnightMs + (H * 60 + M) * 60 * 1000) / 1000);
    }
    const p = Date.parse(label);
    if (!Number.isNaN(p)) return Math.floor(p / 1000);
  }
  const isIntra = range === "1d" || range === "5d";
  const stepMs = isIntra ? 60 * 1000 : 24 * 60 * 60 * 1000;
  return Math.floor((baseMidnightMs + index * stepMs) / 1000);
}

/* ===== parseo → LINEA ===== */
function parseApiPayloadToLineData(payload, range) {
  if (!payload) return [];
  let root = typeof payload === "string" ? parseWeird(payload) ?? payload : payload;
  if (typeof root === "string") root = parseWeird(root) ?? tryJson(root) ?? root;
  const chart = firstChartLike(root) || root;

  let labels = Array.isArray(chart?.labels)
    ? chart.labels
    : typeof chart?.labels === "string"
    ? labelsFromString(chart.labels)
    : [];

  let raw = [];
  if (Array.isArray(chart?.datasets)) {
    const d0 = chart.datasets[0]?.data;
    raw = Array.isArray(d0) ? d0 : typeof d0 === "string" ? numbersFromString(d0) ?? [] : [];
  } else if (Array.isArray(chart?.prices)) raw = chart.prices;
  else if (typeof chart?.prices === "string") raw = numbersFromString(chart.prices) ?? [];

  if (!raw?.length) {
    const stack = [chart]; const seen = new Set();
    while (stack.length && !raw.length) {
      const cur = stack.pop();
      if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
      seen.add(cur);
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (typeof v === "string") {
          const nums = numbersFromString(v);
          if (nums && nums.length >= 5) { raw = nums; break; }
        } else if (v && typeof v === "object") stack.push(v);
      }
    }
  }

  const prices = (raw || []).map(toNumNormalized).filter((n) => !Number.isNaN(n));
  if ((!labels || !labels.length) && prices.length) labels = Array.from({ length: prices.length }, (_, i) => i);
  if (!labels.length || !prices.length) return [];

  const now = new Date();
  const baseMidnightMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

  const dup = new Map();
  const pts = [];
  const len = Math.min(labels.length, prices.length);

  for (let i = 0; i < len; i++) {
    const L = labels[i];
    let ts = labelToTsSec(L, i, { baseMidnightMs, range });
    if (typeof L === "string" && /^\d{2}:\d{2}$/.test(L)) {
      const count = (dup.get(L) ?? 0) + 1;
      dup.set(L, count);
      ts = Math.max(ts, ts + (count - 1));
    }
    pts.push({ time: ts, value: prices[i] });
  }

  pts.sort((a, b) => a.time - b.time);
  for (let i = 1; i < pts.length; i++) if (pts[i].time <= pts[i - 1].time) pts[i].time = pts[i - 1].time + 1;
  return pts;
}

function toNumNormalized(v){
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const s = String(v).trim();

  if (/^-?\d{1,3}(\.\d{3})*(,\d+)?$/.test(s)) {
    const t = s.replace(/\./g, "").replace(",", ".");
    return parseFloat(t);
  }

  if (/^-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(s)) {
    const t = s.replace(/,/g, "");
    return parseFloat(t);
  }
  const n = Number(s);

  if (!Number.isNaN(n)) return n;
  const m = (s.match(/-?\d+(\.\d+)?/g) || []).map(Number).filter((x) => !Number.isNaN(x));
  return m.length ? m[0] : NaN;
}
/* ===== parseo → VELAS (OHLC) ===== */
function parseCandlesFromPayload(payload, range) {
  if (!payload) return [];
  let root = typeof payload === "string" ? parseWeird(payload) ?? payload : payload;
  if (typeof root === "string") root = parseWeird(root) ?? tryJson(root) ?? root;
  const chart = firstChartLike(root) || root;

  // Posibles estructuras: {candles:[{t,o,h,l,c}]}, {ohlc:[...]}, arrays sueltos open/high/low/close + labels
  const list = chart?.candles || chart?.ohlc || chart?.data?.candles || chart?.data?.ohlc;
  if (Array.isArray(list) && list.length) {
    return list
      .map((c, i) => {
        const t = toEpochSeconds(c.t ?? c.time) ?? (i + 1);
        const o = Number(c.o ?? c.open);
        const h = Number(c.h ?? c.high);
        const l = Number(c.l ?? c.low);
        const c0 = Number(c.c ?? c.close);
        if ([o, h, l, c0].some((x) => Number.isNaN(x))) return null;
        return { time: t, open: o, high: h, low: l, close: c0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);
  }

  const open = chart.open ?? chart.o ?? chart?.datasets?.[0]?.open;
  const high = chart.high ?? chart.h ?? chart?.datasets?.[0]?.high;
  const low = chart.low ?? chart.l ?? chart?.datasets?.[0]?.low;
  const close = chart.close ?? chart.c ?? chart?.datasets?.[0]?.close;
  const labels =
    Array.isArray(chart.labels) ? chart.labels :
    typeof chart.labels === "string" ? labelsFromString(chart.labels) : [];

const O = Array.isArray(open) ? open.map(toNumNormalized)  : (numbersFromString(open)  ?? []).map(toNumNormalized);
const H = Array.isArray(high) ? high.map(toNumNormalized)  : (numbersFromString(high)  ?? []).map(toNumNormalized);
const L = Array.isArray(low)  ? low.map(toNumNormalized)   : (numbersFromString(low)   ?? []).map(toNumNormalized);
const C = Array.isArray(close)? close.map(toNumNormalized) : (numbersFromString(close) ?? []).map(toNumNormalized);


  if (![O.length, H.length, L.length, C.length].every((n) => n > 0)) return [];

  const now = new Date();
  const baseMidnightMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const len = Math.min(O.length, H.length, L.length, C.length, labels.length || Infinity);
  const out = [];
  for (let i = 0; i < len; i++) {
    const ts = labels.length ? labelToTsSec(labels[i], i, { baseMidnightMs, range }) : i + 1;
    out.push({ time: ts, open: +O[i], high: +H[i], low: +L[i], close: +C[i] });
  }
  return out.sort((a, b) => a.time - b.time);
}

/* ===== indicadores ===== */
function sma(data, period) {
  if (!data?.length || period <= 1) return [];
  let sum = 0;
  const out = [];
  for (let i = 0; i < data.length; i++) {
    sum += data[i].value;
    if (i >= period) sum -= data[i - period].value;
    if (i >= period - 1) out.push({ time: data[i].time, value: sum / period });
  }
  return out;
}

function bollinger(data, period = 20, mult = 2) {
  if (!data?.length || period < 2) return { mid: [], upper: [], lower: [] };
  const mid = sma(data, period);
  const upper = [];
  const lower = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1).map((d) => d.value);
    const avg = mid[i - (period - 1)].value;
    const variance = slice.reduce((a, v) => a + (v - avg) * (v - avg), 0) / period;
    const dev = Math.sqrt(variance);
    const time = data[i].time;
    upper.push({ time, value: avg + mult * dev });
    lower.push({ time, value: avg - mult * dev });
  }
  return { mid, upper, lower };
}


/* ===== compat series ===== */
const normalizeSeriesReturn = (s) => s?.series || s?.api || s || null;
const hasSetData = (api) => !!api && typeof api.setData === "function";

function createCandleSeriesCompat(chart, opts = {}){
  const common = {
    priceScaleId: 'left',
    upColor: THEME.accentG,
    downColor: '#f43f5e',
    borderUpColor: THEME.accentG,
    borderDownColor: '#f43f5e',
    wickUpColor: THEME.accentG,
    wickDownColor: '#f43f5e',
    ...opts,
  };

  let s = null;

  if(typeof chart.addCandlestickSeries === 'function'){
    try { s = normalizeSeriesReturn(chart.addCandlestickSeries(common)); } catch{}
    if (hasSetData(s)) return s;
  }
  if (typeof chart.addSeries === 'function') {
    try { s = normalizeSeriesReturn(chart.addSeries('Candlestick', common)); } catch{}
    if (hasSetData(s)) return s;
    try { s = normalizeSeriesReturn(chart.addSeries({type: 'Candlestick', ...common})); } catch{}
  if (hasSetData(s)) return s;
  }
  return null;
}

function createAreaSeriesCompat(chart){
  const opts = {
    priceScaleId: 'left',
    lineColor: THEME.accentG,
    topColor: THEME.accentGTop,
    bottomColor: THEME.accentGBottom,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
  };
  try {
    const s = normalizeSeriesReturn(chart.addAreaSeries(opts));
    if (hasSetData(s)) return s;
  } catch {}
  try {
    const s = normalizeSeriesReturn(
      chart.addLineSeries({
        priceScaleId: 'left',
        color: opts.lineColor,
        lineWidth: opts.lineWidth,
        priceLineVisible: false,
        lastValueVisible: false,
      }),
    );
    if (hasSetData(s)) return s;
  } catch {}
  return null;
}

function createLineSeriesCompat(chart, opts = {}) {
  try {
    const s = normalizeSeriesReturn(chart.addLineSeries({priceScaleId: 'left', ...opts}));
    if (hasSetData(s)) return s;
  } catch {}

  // fallback: área “transparente”
  try {
    const s = normalizeSeriesReturn(
      chart.addAreaSeries({
        priceScaleId: 'left',
        lineColor: opts.color ?? "#fff",
        lineWidth: opts.lineWidth ?? 2,
        topColor: "rgba(0,0,0,0)",
        bottomColor: "rgba(0,0,0,0)",
        priceLineVisible: false,
        lastValueVisible: false,
      }),
    );
    if (hasSetData(s)) return s;
  } catch {}

  return null;
}

function createPrimarySeries(chart, tab) {
  if (tab === 'velas') {
    const s1 = createCandleSeriesCompat(chart);
    if (s1 && typeof s1.setData === 'function') return s1;

    if (typeof chart.addBarSeries === 'function'){
      try {
        const s2 = normalizeSeriesReturn(
          chart.addBarSeries({
            priceScaleId: 'left',
            upColor: THEME.accentG,
            downColor: '#f43f5e',
            borderUpColor: THEME.accentG,
            borderDownColor: '#f43f5e', 
          }),
        );
        if (s2 && typeof s2.setData === 'function') return s2;
      } catch {}
    }
    const s3 = createLineSeriesCompat(chart, { color: THEME.text });
    if (s3 && typeof s3.setData === 'function') return s3;
    return null;
  }
  return createAreaSeriesCompat(chart) || createLineSeriesCompat(chart, {color: THEME.accentG});
}

// --- NUEVO: derivar velas a partir de lineData si 1003 no trae OHLC
function deriveCandlesFromLine(line, frame = 5) {
  if (!line?.length) return [];
  const out = [];
  for (let i = 0; i < line.length; ) {
    const start = i;
    const end = Math.min(i + frame, line.length) - 1;
    const slice = line.slice(start, end + 1);

    const open  = slice[0].value;
    const close = slice[slice.length - 1].value;
    let high = -Infinity, low = Infinity;
    for (const p of slice) {
      if (p.value > high) high = p.value;
      if (p.value < low)  low  = p.value;
    }
    // usamos el time del último punto del bloque
    out.push({ time: slice[slice.length - 1].time, open, high, low, close });
    i = end + 1;
  }
  return out;
}


/* ======================== UI ======================== */
export default function PrincesPanel({ className = "", height = 520 }) {

  
  const canvasRef = useRef(null);
  const chartRef   = useRef(null);
  const seriesRef  = useRef(null);          // principal (línea o velas)
  const priceLineRef = useRef(null);
  const [chartReady, setChartReady] = useState(0);

  const overlayRef = useRef(null);
  const legendRef  = useRef(null);

  // overlays
  const ma8Ref   = useRef(null); // para promedio/bollinger
  const bbUpRef  = useRef(null);
  const bbLowRef = useRef(null);

  const [tab, setTab] = useState("precios");
  const [range, setRange] = useState("1d");

  const lapse = useMemo(() => {
    const m = { "1d": "1D", "5d": "5D", "1m": "1M", "6m": "6M", "1a": "1A" };
    return m[range] || "1D";
  }, [range]);

  const { dataById, chartById, request } = useWebSocketData();
  const isLineTab = tab !== "velas";

  const payloadId = useMemo(() => (isLineTab ? 1001 : 1003), [isLineTab]);

  const nf0 = useMemo(() => new Intl.NumberFormat("es-CO"), []);
  const nf2 = useMemo(
    () => new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [],
  );

  // datos base del WS
const rawPayload = useMemo(() => {
  const fromCharts =
  chartById?.[payloadId]?.[lapse] ??
  chartById?.[payloadId]?.[lapse?.toUpperCase?.()] ??
  chartById?.[payloadId]?.[lapse?.toLowerCase?.()];
  const fallback = payloadId === 1001 ? dataById?.[1000] : null;
  return fromCharts ?? fallback ?? null;
}, [chartById, dataById, payloadId, lapse]);



  // line (close) + velas
  const lineData   = useMemo(() => parseApiPayloadToLineData(rawPayload, range), [rawPayload, range]);
  const candleData = useMemo(() => parseCandlesFromPayload(rawPayload, range), [rawPayload, range]);

  // indicadores
  const ma8  = useMemo(() => sma(lineData, 8), [lineData]);
  const b20  = useMemo(() => bollinger(lineData, 20, 2), [lineData]);

useEffect(() => {
  // expositor de depuración
  window.__pp = {
    payloadId, lapse, rawPayload,
    lineLen: lineData.length,
    candleLen: candleData.length,
    hasChart: !!chartRef.current,
    hasSeries: !!seriesRef.current,
    keys1001: Object.keys((chartById?.[1001]||{})),
    keys1003: Object.keys((chartById?.[1003]||{})),
  };
  console.log('[PP]', window.__pp);
}, [payloadId, lapse, rawPayload, lineData.length, candleData.length, chartById]);
  // para autoscale/tooltip de línea
  const lineDataRef = useRef([]);
useEffect(() => {
  lineDataRef.current = lineData;
}, [lineData]);
useEffect(() => {
  console.log('payloadId', payloadId, 'lapse', lapse);
  console.log('rawPayload', rawPayload);
  console.log('line pts', lineData.length, 'candle pts', candleData.length);
}, [payloadId, lapse, rawPayload, lineData.length, candleData.length]);


  // pedir datos al cambiar id/lapse
  useEffect(() => { request?.({ id: payloadId, lapse }); }, [payloadId, lapse, request]);

  /* crear chart 1 vez o cuando cambia tipo principal (línea/velas) */
  useEffect(() => {
    const el = canvasRef.current; if (!el) return;

    // contenedor limpio/overlay
    el.innerHTML = ""; el.style.background = "#0c0c14"; el.style.position = "relative";
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center",
      color: THEME.textDim, fontSize: "14px", zIndex: 5, pointerEvents: "none",
    });
    overlay.textContent = "Cargando gráfico…"; el.appendChild(overlay); overlayRef.current = overlay;

    const pane = document.createElement("div");
    Object.assign(pane.style, { width: "100%", height: `${height}px` }); el.appendChild(pane);

    const chart = createChart(pane, { width: el.clientWidth || 1200, height, ...BASE_OPTS});
    chart.applyOptions({
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: false, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;

    // serie principal: línea/área o velas según tab
const series = createPrimarySeries(chart, tab);
seriesRef.current = series;

if (!seriesRef.current || !hasSetData(seriesRef.current)) {
  overlay.textContent = "No se pudo crear la serie";
  return;
}

console.log('LC métodos chart:', Object.keys(chart || {}));
console.log('addCandlestickSeries?', typeof chart?.addCandlestickSeries);

     // avisa que ya existen chart+series para que el otro effect haga setData
   setChartReady(x => x + 1);

    // formateo + autoscale (solo línea)
    if (tab !== "velas") {
      series?.applyOptions?.({
        priceFormat: { type: "custom", minMove: 1, precision: 0, formatter: (p) => nf0.format(p) },
        autoscaleInfoProvider: (original) => {
          const info = original();
          const data = lineDataRef.current;
          if (!info?.priceRange || !data?.length) return info;
          const vals = data.map((d) => d.value).slice().sort((a, b) => a - b);
          const lo = vals[Math.floor(vals.length * 0.01)];
          const hi = vals[Math.ceil(vals.length * 0.99)];
          const pad = (hi - lo) * 0.07;
          return { ...info, priceRange: { minValue: lo - pad, maxValue: hi + pad } };
        },
      });
    }

    // tooltip
    const tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
      position: "absolute", display: "none",
      background: "linear-gradient(180deg,#0f172a,#0b1220)", color: THEME.text,
      border: `1px solid ${THEME.border}`, borderRadius: "12px",
      fontSize: "12px", lineHeight: "1.35", padding: "10px 12px",
      pointerEvents: "none", zIndex: 10, boxShadow: "0 12px 30px rgba(0,0,0,.35)",
      transform: "translate(-60%,-110%)", whiteSpace: "nowrap",
    });
    el.appendChild(tooltip);

    const onMove = (param) => {
      if (!param?.time || !param.seriesData) { tooltip.style.display = "none"; return; }

      const ts = typeof param.time === "number" ? param.time : param.time?.timestamp ?? param.time;
      const sec = ts > 1e12 ? Math.floor(ts / 1000) : ts;
      const d = new Date(sec * 1000);
      const isIntra = range === "1d" || range === "5d";
      const fecha = d.toLocaleDateString("es-CO", { timeZone: TIME_ZONE });
      const hora  = d.toLocaleTimeString("es-CO", { hour12: false, hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });

      const sData = series ? param.seriesData.get(series) : undefined;

      if (tab === "velas") {
        if (!sData || sData.open == null) { tooltip.style.display = "none"; return; }
        tooltip.innerHTML = `
          <div><strong>${isIntra ? `${fecha} ${hora}` : `${fecha}`}</strong></div>
          <div>Open: ${nf2.format(sData.open)}</div>
          <div>High: ${nf2.format(sData.high)}</div>
          <div>Low: ${nf2.format(sData.low)}</div>
          <div>Close: ${nf2.format(sData.close)}</div>
        `;
        const y = series.priceToCoordinate(sData.close);
        if (y == null) { tooltip.style.display = "none"; return; }
        tooltip.style.left = `${param.point?.x ?? 0}px`;
        tooltip.style.top  = `${Math.min(Math.max(y, 40), (el.getBoundingClientRect().height - 10))}px`;
        tooltip.style.display = "block";
      } else {
        const v = sData?.value;
        if (v == null) { tooltip.style.display = "none"; return; }

        // delta % vs punto previo
        const data = lineDataRef.current || [];
        let prevIdx = -1;
        for (let i = data.length - 1; i >= 0; i--) { if (data[i].time < sec) { prevIdx = i; break; } }
        const prev  = prevIdx >= 0 ? data[prevIdx].value : null;
        const delta = prev != null ? v - prev : null;
        const pct   = prev != null && prev !== 0 ? (delta / prev) * 100 : null;

        let extra = "";
        if (tab === "promedio" || tab === "bollinger") {
          const v8 = ma8Ref.current ? param.seriesData.get(ma8Ref.current)?.value : undefined;
          const u  = bbUpRef.current ? param.seriesData.get(bbUpRef.current)?.value : undefined;
          const l  = bbLowRef.current ? param.seriesData.get(bbLowRef.current)?.value : undefined;
          if (tab === "promedio") {
            extra = `<div style="color:#2C83FB">MM (8): ${v8 != null ? v8.toLocaleString("es-CO",{maximumFractionDigits:2}) : "--"}</div>`;
          } else {
            extra = `
              <div style="color:#2C83FB">MM (8): ${v8 != null ? v8.toLocaleString("es-CO",{maximumFractionDigits:2}) : "--"}</div>
              <div>BB Upper: ${u != null ? nf2.format(u) : "--"}</div>
              <div style="color:#EF4444">BB Lower: ${l != null ? nf2.format(l) : "--"}</div>
            `;
          }
        }

        tooltip.innerHTML = `
          <div><strong>${isIntra ? `${fecha} ${hora}` : `${fecha}`}</strong></div>
          <div style="color:#34d399">Cotización USD/COP: ${nf2.format(v)}</div>
          ${
            delta != null
              ? `<div style="opacity:.85;color:${delta >= 0 ? "#22c55e" : "#f43f5e"}">
                  ${delta >= 0 ? "+" : ""}${nf2.format(delta)} (${pct != null && pct >= 0 ? "+" : ""}${pct?.toFixed(2)}%)
                </div>`
              : ""
          }
          ${extra}
        `;
        const y = series.priceToCoordinate(v);
        if (y == null) { tooltip.style.display = "none"; return; }
        const rect = el.getBoundingClientRect(); const tw = tooltip.offsetWidth || 200; const th = tooltip.offsetHeight || 60; const margin = 8;
        const x = Math.min(Math.max(param.point?.x ?? 0, margin + tw / 2), rect.width - margin - tw / 2);
        const yClamped = Math.min(Math.max(y, margin + th), rect.height - margin);
        tooltip.style.left = `${x}px`; tooltip.style.top = `${yClamped}px`; tooltip.style.display = "block";
      }
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => { chart.applyOptions({ width: el.clientWidth || 1200, height }); });
    ro.observe(el);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      ro.disconnect();
      try { chart.remove(); } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;
      ma8Ref.current = null; bbUpRef.current = null; bbLowRef.current = null;
      if (legendRef.current && el.contains(legendRef.current)) el.removeChild(legendRef.current);
      legendRef.current = null;
    
      overlayRef.current = null;
      el.innerHTML = "";
    };
  }, [tab, height, nf0, nf2, range]);

  /* set data + overlays según tab */
 useEffect(() => {
  const chart   = chartRef.current;
  const series  = seriesRef.current;
  const overlay = overlayRef.current;

  // --- Mostrar/ocultar overlay SIEMPRE según haya datos para el tab activo
  const hasLine    = lineData.length > 0;
  const hasCandles = candleData.length > 0;
  const noData = tab === "velas" ? !(hasCandles || hasLine) : !hasLine;
  if (overlay) overlay.style.display = noData ? "flex" : "none";
  if (noData) { if (series) series.setData([]); return; }

  if(!chart || !series)return;

  const clearOverlays = () => {
    for (const ref of [ma8Ref, bbUpRef, bbLowRef]){
      if (ref.current) { try {chart.removeSeries(ref.current);} catch {} }
      ref.current = null;
    }
    if (legendRef.current) legendRef.current.style.display = "none";
  };

  if (tab === "velas") {
    const frameByRange = { '1d': 5, '5d': 10, '1m': 20, '6m': 60, '1a': 100 };
    const frame = frameByRane[range] ?? 20;

    const usingNative = hasCandles;
    const cd = usingNative ? candleData : deriveCandlesFromLine(lineData, frame);
    
    if(!cd.length){
      series.setData([]);
      clearOverlays();
        if (overlay) {
          overlay.textContent = "Sin datos de velas";
          overlay.style.display = "flex";
        }
        return;
    }
    if (!usingNative && lineData.length && overlay){
      overlay.textContent = "Derivando velas desde precios...";
      overlay.style.display = "flex";
      setTimeout(() => overlay && (overlay.style.display = "none"), 1000);
    }else if (overlay){
      overlay.style.display = "none";
    }
    series.setData(cd);
    chart.timeScale().fitContent();
    clearOverlays();
    return;
  }

  // === LINEA: precios / promedio / bollinger (igual que ya tenías) ===
  series.setData(lineData);
  chart.timeScale().fitContent();
  // Línea “Último”
const last = lineData.at(-1)?.value;
if (last != null) {
  if (!priceLineRef.current) {
    priceLineRef.current = series.createPriceLine?.({
      price: last,
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "Último",
    });
  } else {
    priceLineRef.current.applyOptions?.({ price: last });
  }
}

// overlays por tab
const ensureMa8 = () => {
  if (!ma8Ref.current) {
    ma8Ref.current = createLineSeriesCompat(chart, {
      color: "#2C83FB",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
  }
  ma8Ref.current.setData(ma8.length ? ma8 : []);
};

if (tab === "promedio") {
  ensureMa8();

  if (!legendRef.current) {
    const legend = document.createElement("div");
    Object.assign(legend.style, {
      position: "absolute", bottom: "10px", left: "12px", color: "#cbd5e1",
      fontSize: "12px", background: "rgba(0,0,0,.25)", padding: "6px 8px",
      borderRadius: "8px", pointerEvents: "none", zIndex: 6,
    });
    legendRef.current = legend;
    canvasRef.current?.appendChild(legend);
  }
  legendRef.current.style.display = "block";
  legendRef.current.innerHTML = `<span style="color:#2C83FB">●</span> Media móvil (8)`;

  // quitar bandas si estaban
  for (const ref of [bbUpRef, bbLowRef]) {
    if (ref.current) { try { chart.removeSeries(ref.current); } catch {} }
    ref.current = null;
  }
} else if (tab === "bollinger") {
  ensureMa8();

  if (!bbUpRef.current)  bbUpRef.current  = createLineSeriesCompat(chart, { color: THEME.text, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
  if (!bbLowRef.current) bbLowRef.current = createLineSeriesCompat(chart, { color: "#EF4444",     lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
  bbUpRef.current.setData(b20.upper);
  bbLowRef.current.setData(b20.lower);

  if (!legendRef.current) {
    const legend = document.createElement("div");
    Object.assign(legend.style, {
      position: "absolute", bottom: "10px", left: "12px", color: "#cbd5e1",
      fontSize: "12px", background: "rgba(0,0,0,.25)", padding: "6px 8px",
      borderRadius: "8px", pointerEvents: "none", zIndex: 6,
    });
    legendRef.current = legend;
    canvasRef.current?.appendChild(legend);
  }
  legendRef.current.style.display = "block";
  legendRef.current.innerHTML = `
    <span style="color:#2C83FB">●</span> MM(8)
    &nbsp;&nbsp;<span>●</span> BB Upper
    &nbsp;&nbsp;<span style="color:#EF4444">●</span> BB Lower
  `;
} else {
  // tab === "precios"
  clearOverlays();
}
  // ... (resto igual: price line, ensureMa8, leyendas, bandas, etc.)
}, [tab, range, lineData, candleData, ma8, b20.upper, b20.lower, chartReady]);

  /* opciones por rango (formato ticks) */
  useEffect(() => {
    const chart = chartRef.current; if (!chart) return;
    const series = seriesRef.current;
  console.log('SETDATA', { tab, linePts: lineData.length, candlePts: candleData.length, hasChart: !!chart, hasSeries: !!series });
    const isIntra = range === "1d" || range === "5d";
    chart.applyOptions({
      timeScale: {
        ...BASE_OPTS.timeScale,
        timeVisible: isIntra,
        secondsVisible: false,
        barSpacing: isIntra ? 7 : 6,
        rightOffset: isIntra ? 12 : 20,
        tickMarkFormatter: (t) => {
          const ts = typeof t === "number" ? t : t?.timestamp ?? t;
          const sec = ts > 1e12 ? Math.floor(ts / 1000) : ts;
          const d = new Date(sec * 1000);
          return isIntra
            ? d.toLocaleTimeString("es-CO", { hour12: false, hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })
            : d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: TIME_ZONE });
        },
      },
    });
  }, [range]);


  return (
    <section className={`w-full p-4 text-white ${className}`}>
      <div className="max-w-[1400px] mx-auto rounded-xl border border-slate-700 overflow-hidden bg-[#0d0f16]">
        <div className="flex items-center justify-between bg-[#0a2b3e] px-4 py-3">
          <h3 className="text-slate-100 font-semibold">Precios</h3>
          <div className="flex gap-1.5">
            {["1d", "5d", "1m", "6m", "1a"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-150 ${
                  range === r ? "bg-green-500 text-black shadow-md" : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="inline-flex gap-1 bg-slate-800/40 rounded-lg p-1">
            {[
              { key: "precios", label: "Precios" },
              { key: "promedio", label: "Promedio" },
              { key: "velas", label: "Velas" },
              { key: "bollinger", label: "Bollinger" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  tab === t.key ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-700/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div ref={canvasRef} className="relative w-full rounded-lg mt-3 bg-[#0c0c14]" style={{ height }} />
        </div>
      </div>
    </section>
  );
}
