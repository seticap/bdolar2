"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as LWC from "lightweight-charts";
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
    vertLines: { color: THEME.gridLite, style: LWC.LineStyle.Dotted },
    horzLines: { color: THEME.grid, style: LWC.LineStyle.Dotted },
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
    mode: LWC.CrosshairMode.Normal,
    vertLine: {
      color: "rgba(255,255,255,.30)",
      style: LWC.LineStyle.Dotted,
      width: 1,
    },
    horzLine: {
      color: "rgba(255,255,255,.30)",
      style: LWC.LineStyle.Dotted,
      width: 1,
    },
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

/* ====== helpers de parseo ====== */
const tryJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};
function parseWeird(s) {
  if (typeof s !== "string") return null;
  let t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  )
    t = t.slice(1, -1);
  t = t.replace(/\\"/g, '"').replace(/\\n|\\r/g, "");
  const j = tryJson(t);
  if (j) return j;
  let fixed = t;
  if (/^\s*(data|labels|datasets|prices)\s*:/.test(fixed)) fixed = `{${fixed}}`;
  fixed = fixed
    .replace(/'/g, '"')
    .replace(/([\s{,])([a-zA-Z_][\w]*)\s*:/g, '$1"$2":')
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}");
  return tryJson(fixed);
}
const numbersFromString = (s) =>
  typeof s === "string"
    ? (s.match(/-?\d+(\.\d+)?/g) || [])
        .map(Number)
        .filter((n) => !Number.isNaN(n))
    : null;
function labelsFromString(s) {
  if (typeof s !== "string") return null;
  const j = tryJson(s);
  if (Array.isArray(j)) return j;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
function firstChartLike(obj) {
  if (!obj || typeof obj !== "object") return null;
  const isChart = (o) =>
    o &&
    ((Array.isArray(o.datasets) &&
      (Array.isArray(o.datasets?.[0]?.data) ||
        typeof o.datasets?.[0]?.data === "string")) ||
      Array.isArray(o.prices) ||
      typeof o.prices === "string");
  const seeds = [
    obj,
    obj?.data,
    obj?.data?.data,
    obj?.data?.data?.data,
    obj?.result?.[0],
    obj?.result?.[0]?.data,
  ];
  for (const s of seeds) if (isChart(s)) return s;
  const q = seeds.filter(Boolean);
  const seen = new Set();
  while (q.length) {
    const cur = q.shift();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    if (isChart(cur)) return cur;
    for (const k of Object.keys(cur)) {
      const v = cur[k];
      if (v && typeof v === "object") q.push(v);
      if (typeof v === "string") {
        const p = parseWeird(v);
        if (p) q.push(p);
      }
    }
  }
  return null;
}

/* ====== tiempo + parser ====== */
function toEpochSeconds(t) {
  if (t == null) return null;
  if (typeof t === "number") return t > 1e12 ? Math.floor(t / 1000) : t;
  if (typeof t === "object" && "timestamp" in t) return Math.floor(t.timestamp);
  return null;
}
function labelToTsSec(label, index, { baseMidnightMs, range }) {
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
/* decimación */
const MAX_POINTS_BY_RANGE = {
  "1d": 3000,
  "5d": 8000,
  "1m": 9000,
  "6m": 12000,
  "1a": 15000,
};
function decimatePoints(pts, range) {
  const cap = MAX_POINTS_BY_RANGE[range] ?? 12000;
  if (!pts?.length || pts.length <= cap) return pts;
  const step = Math.ceil(pts.length / cap);
  const out = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
  if (out[out.length - 1]?.time !== pts[pts.length - 1].time)
    out.push(pts[pts.length - 1]);
  return out;
}
function parseApiPayloadToLineData(payload, range) {
  if (!payload) return [];
  let root =
    typeof payload === "string" ? parseWeird(payload) ?? payload : payload;
  if (typeof root === "string")
    root = parseWeird(root) ?? tryJson(root) ?? root;
  const chart = firstChartLike(root) || root;

  let labels = Array.isArray(chart?.labels)
    ? chart.labels
    : typeof chart?.labels === "string"
    ? labelsFromString(chart.labels)
    : [];

  let raw = [];
  if (Array.isArray(chart?.datasets)) {
    const d0 = chart.datasets[0]?.data;
    raw = Array.isArray(d0)
      ? d0
      : typeof d0 === "string"
      ? numbersFromString(d0) ?? []
      : [];
  } else if (Array.isArray(chart?.prices)) raw = chart.prices;
  else if (typeof chart?.prices === "string")
    raw = numbersFromString(chart.prices) ?? [];

  if (!raw?.length) {
    const stack = [chart];
    const seen = new Set();
    while (stack.length && !raw.length) {
      const cur = stack.pop();
      if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
      seen.add(cur);
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (typeof v === "string") {
          const nums = numbersFromString(v);
          if (nums && nums.length >= 5) {
            raw = nums;
            break;
          }
        } else if (v && typeof v === "object") stack.push(v);
      }
    }
  }

  const prices = (raw || []).map(Number).filter((n) => !Number.isNaN(n));
  if ((!labels || !labels.length) && prices.length)
    labels = Array.from({ length: prices.length }, (_, i) => i);
  if (!labels.length || !prices.length) return [];

  const now = new Date();
  const baseMidnightMs = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  ).getTime();

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
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].time <= pts[i - 1].time) pts[i].time = pts[i - 1].time + 1;
  }
  return decimatePoints(pts, range);
}

function sma(data, period) {
  if (!data?.length || period <= 1) return [];
  let sum = 0;
  const out = [];
  for (let i = 0; i < data.length; i++) {
    sum += data[i].value;
    if (i >= period) sum -= data[i - period].value;
    if (i >= period - 1) {
      out.push({ time: data[i].time, value: sum / period });
    }
  }
  return out;
}

/* ===== compat series ===== */
const normalizeSeriesReturn = (s) => s?.series || s?.api || s || null;
const hasSetData = (api) => !!api && typeof api.setData === "function";
function createAreaSeriesCompat(chart) {
  const opts = {
    lineColor: THEME.accentG,
    topColor: THEME.accentGTop,
    bottomColor: THEME.accentGBottom,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: true,
    crosshairMarkerRadius: 3.5,
    crosshairMarkerBorderColor: "#0b1020",
    crosshairMarkerBackgroundColor: THEME.accentG,
  };
  if (typeof chart.addAreaSeries === "function") {
    const s = chart.addAreaSeries(opts);
    const api = normalizeSeriesReturn(s);
    if (hasSetData(api)) return api;
  }
  if (typeof chart.addSeries === "function") {
    try {
      const sA = chart.addSeries("Area", opts);
      const a = normalizeSeriesReturn(sA);
      if (hasSetData(a)) return a;
    } catch {}
    try {
      const sB = chart.addSeries({ type: "Area", ...opts });
      const b = normalizeSeriesReturn(sB);
      if (hasSetData(b)) return b;
    } catch {}
    try {
      const C = LWC.AreaSeries || LWC.SeriesArea || LWC.DefaultAreaSeries;
      if (C) {
        const sC = chart.addSeries(C, opts);
        const c = normalizeSeriesReturn(sC);
        if (hasSetData(c)) return c;
      }
    } catch {}
  }
  const s = chart.addLineSeries?.({
    color: THEME.accentG,
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: true,
  });
  return normalizeSeriesReturn(s);
}

function createLineSeriesCompat(chart, opts = {}) {
  if (typeof chart.addLineSeries === "function") {
    const s = chart.addLineSeries(opts);
    return normalizeSeriesReturn(s);
  }
  if (typeof chart.addSeries === "function") {
    try {
      const sA = chart.addSeries("Line", opts);
      const a = normalizeSeriesReturn(sA);
      if (hasSetData(a)) return a;
    } catch {}
    try {
      const sB = chart.addSeries({ type: "Line", ...opts });
      const b = normalizeSeriesReturn(sB);
      if (hasSetData(b)) return b;
    } catch {}
    try {
      const C = LWC.LineSeries || LWC.SeriesLine || LWC.DefaultLineSeries;
      if (C) {
        const sC = chart.addSeries(C, opts);
        const c = normalizeSeriesReturn(sC);
        if (hasSetData(c)) return c;
      }
    } catch {}
  }
  const s = chart.addAreaSeries?.({
    lineColor: opts.color ?? "#fff",
    lineWidth: opts.lineWidth ?? 2,
    topColor: "rgba(0,0,0,0)",
    bottomColor: "rgba(0,0,0,0)",
    priceLineVisible: opts.priceLineVisible ?? false,
    lastValueVisible: opts.lastValueVisible ?? false,
  });
  return normalizeSeriesReturn(s);
}

/* ======================== UI ======================== */
export default function PrincesPanel({ className = "", height = 520 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLineRef = useRef(null);
  const overlayRef = useRef(null); // overlay
  const legendRef = useRef(null); // leyenda MM
  const ma8Ref = useRef(null);
  const ma13Ref = useRef(null);

  const [tab, setTab] = useState("precios");
  const [range, setRange] = useState("1d");

  const { dataById } = useWebSocketData();

  const nf0 = useMemo(() => new Intl.NumberFormat("es-CO"), []);
  const nf2 = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const lineDataRef = useRef([]);
  const [lastGoodByRange, setLastGoodByRange] = useState({});
  const [lastGoodAvgByRange, setLastGoodAvgByRange] = useState({});

// usa estos dos valores en el resto del componente
const rawPayload = useMemo(() => {
  if (tab === "promedio") {
    // ✅ SOLO 1002 o cache de 1002
    return dataById?.[1002] ?? lastGoodAvgByRange[range] ?? null;
  }
  // ✅ Tab "precios": SOLO 1001 o cache de 1001
  return dataById?.[1001] ?? lastGoodByRange[range] ?? null;
}, [tab, range, dataById, lastGoodByRange, lastGoodAvgByRange]);

  const lineData = useMemo(() => {
    const parsed = parseApiPayloadToLineData(rawPayload, range);
    if (!rawPayload)
      console.warn("[PrincesPanel] rawPayload=null para rango:", range);
    if (!parsed?.length)
      console.warn(
        "[PrincesPanel] sin puntos tras parseo. rango:",
        range,
        "payload:",
        rawPayload
      );
    return parsed;
  }, [rawPayload, range]);

  const ma8 = useMemo(() => sma(lineData, 8), [lineData]);
  const ma13 = useMemo(() => sma(lineData, 13), [lineData]);

  // cache del último payload válido
  useEffect(() => {
    if (!rawPayload || lineData.length <= 1) return;
    if (tab === "promedio") {
      setLastGoodAvgByRange((prev) =>
        prev[range] ? prev : { ...prev, [range]: rawPayload }
      );
    } else {
      setLastGoodByRange((prev) =>
        prev[range] ? prev : { ...prev, [range]: rawPayload }
      );
    }
  }, [rawPayload, lineData.length, range, tab]);

  // mantener ref de datos para tooltip/autoscale
  useEffect(() => {
    lineDataRef.current = lineData;
  }, [lineData]);

  /* crear chart 1 vez */
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const isChartTab = tab === "precios" || tab === "promedio";
    if (!isChartTab) {
      el.innerHTML = "";
      const ph = document.createElement("div");
      Object.assign(ph.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: `${height}px`,
        color: THEME.textDim,
        fontSize: "14px",
        background: "#0c0c14",
        borderRadius: "8px",
      });
      ph.textContent = "Esta vista estará disponible pronto.";
      el.appendChild(ph);
      return;
    }

    // contenedor limpio
    el.innerHTML = "";
    el.style.background = "#0c0c14";
    el.style.position = "relative";

    // overlay
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: THEME.textDim,
      fontSize: "14px",
      zIndex: 5,
      pointerEvents: "none",
    });
    overlay.textContent = "Cargando gráfico…";
    el.appendChild(overlay);
    overlayRef.current = overlay;

    const pane = document.createElement("div");
    Object.assign(pane.style, { width: "100%", height: `${height}px` });
    el.appendChild(pane);

    const chart = LWC.createChart(pane, {
      width: el.clientWidth || 1200,
      height,
      ...BASE_OPTS,
    });
    chart.applyOptions({
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: true,
        pinch: true,
      },
    });
    chartRef.current = chart;

    const series = createAreaSeriesCompat(chart);
    seriesRef.current = series;

    series?.applyOptions?.({
      priceFormat: {
        type: "custom",
        minMove: 1,
        precision: 0,
        formatter: (p) => nf0.format(p),
      },
      autoscaleInfoProvider: (original) => {
        const info = original();
        const data = lineDataRef.current;
        if (!info?.priceRange || !data?.length) return info;
        const vals = data
          .map((d) => d.value)
          .slice()
          .sort((a, b) => a - b);
        const lo = vals[Math.floor(vals.length * 0.01)];
        const hi = vals[Math.ceil(vals.length * 0.99)];
        const pad = (hi - lo) * 0.07;
        return {
          ...info,
          priceRange: { minValue: lo - pad, maxValue: hi + pad },
        };
      },
    });

    // tooltip
    const tooltip = document.createElement("div");
    Object.assign(tooltip.style, {
      position: "absolute",
      display: "none",
      background: "linear-gradient(180deg,#0f172a,#0b1220)",
      color: THEME.text,
      border: `1px solid ${THEME.border}`,
      borderRadius: "12px",
      fontSize: "12px",
      lineHeight: "1.35",
      padding: "10px 12px",
      pointerEvents: "none",
      zIndex: 10,
      boxShadow: "0 12px 30px rgba(0,0,0,.35)",
      transform: "translate(-60%,-110%)",
      whiteSpace: "nowrap",
    });
    el.appendChild(tooltip);

    const onMove = (param) => {
      if (!param?.time || !param.seriesData) {
        tooltip.style.display = "none";
        return;
      }
      const ts =
        typeof param.time === "number"
          ? param.time
          : param.time?.timestamp ?? param.time;
      const sec = ts > 1e12 ? Math.floor(ts / 1000) : ts;
      const d = new Date(sec * 1000);
      const isIntra = range === "1d" || range === "5d";
      const fecha = d.toLocaleDateString("es-CO", { timeZone: TIME_ZONE });
      const hora = d.toLocaleTimeString("es-CO", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TIME_ZONE,
      });
      const v = series ? param.seriesData.get(series)?.value : undefined;
      if (v == null) {
        tooltip.style.display = "none";
        return;
      }

      const data = lineDataRef.current || [];
      let prevIdx = -1;
      for (let i = data.length - 1; i >= 0; i--) {
        if (data[i].time < sec) {
          prevIdx = i;
          break;
        }
      }
      const prev = prevIdx >= 0 ? data[prevIdx].value : null;
      const delta = prev != null ? v - prev : null;
      const pct = prev != null && prev !== 0 ? (delta / prev) * 100 : null;

      let extra = "";
      if (tab === "promedio") {
        const v8 = ma8Ref.current
          ? param.seriesData.get(ma8Ref.current)?.value
          : undefined;
        const v13 = ma13Ref.current
          ? param.seriesData.get(ma13Ref.current)?.value
          : undefined;
        extra = `
          <div style="color:#2C83FB">MM (8): ${
            v8 != null
              ? v8.toLocaleString("es-CO", { maximumFractionDigits: 2 })
              : "--"
          }</div>
          <div style="color:#EF4444">MM (13): ${
            v13 != null
              ? v13.toLocaleString("es-CO", { maximumFractionDigits: 2 })
              : "--"
          }</div>
        `;
      }

      tooltip.innerHTML = `
        <div><strong>${isIntra ? `${fecha} ${hora}` : `${fecha}`}</strong></div>
        <div style="color:#34d399">Cotización USD/COP: ${nf2.format(v)}</div>
        ${
          delta != null
            ? `<div style="opacity:.85;color:${
                delta >= 0 ? "#22c55e" : "#f43f5e"
              }">
          ${delta >= 0 ? "+" : ""}${nf2.format(delta)} (${
                pct != null && pct >= 0 ? "+" : ""
              }${pct?.toFixed(2)}%)
        </div>`
            : ""
        }
        ${extra}
      `;

      const xRaw = param.point?.x ?? 0;
      const y = series.priceToCoordinate(v);
      if (y == null) {
        tooltip.style.display = "none";
        return;
      }

      const rect = el.getBoundingClientRect();
      const tw = tooltip.offsetWidth || 200;
      const th = tooltip.offsetHeight || 60;
      const margin = 8;
      const x = Math.min(
        Math.max(xRaw, margin + tw / 2),
        rect.width - margin - tw / 2
      );
      const yClamped = Math.min(Math.max(y, margin + th), rect.height - margin);

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${yClamped}px`;
      tooltip.style.display = "block";
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 1200, height });
    });
    ro.observe(el);

    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      ro.disconnect();
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;

      // quitar leyenda si existe
      if (legendRef.current && el.contains(legendRef.current)) {
        el.removeChild(legendRef.current);
      }
      legendRef.current = null;

      overlayRef.current = null;
      el.innerHTML = "";
    };
  }, [tab, height, nf0, nf2, range]);

  /* actualizar datos + overlay */
  useEffect(() => {
    const el = canvasRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;
    const overlay = overlayRef.current;
    if (!chart || !series) return;

    if (!lineData.length) {
      series.setData([]);
      if (overlay) {
        overlay.textContent = `Sin datos para ${range.toUpperCase()} (WS/API)`;
        overlay.style.display = "flex";
      }
      // si no hay datos, también quitar series MM si estaban
      const s8 = ma8Ref.current;
      const s13 = ma13Ref.current;

      if (s8 && typeof chart.removeSeries === "function") {
        try {
          chart.removeSeries(s8);
        } catch {}
        ma8Ref.current = null;
      }
      if (s13 && typeof chart.removeSeries === "function") {
        try {
          chart.removeSeries(s13);
        } catch {}
        ma13Ref.current = null;
      }
      if (legendRef.current) legendRef.current.style.display = "none";
      return;
    }

    if (overlay) overlay.style.display = "none";
    series.setData(lineData);
    chart.timeScale().fitContent();

    // --- PROMEDIO: crear/actualizar MM(8) y MM(13)
    if (tab === "promedio") {
      // crear solo una vez
      let s8 = ma8Ref.current;
      if (!s8) {
        s8 = createLineSeriesCompat(chart, {
          color: "#2C83FB",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ma8Ref.current = s8;
      }
      let s13 = ma13Ref.current;
      if (!s13) {
        s13 = createLineSeriesCompat(chart, {
          color: "#EF4444",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        ma13Ref.current = s13;
      }

      if (s8 && hasSetData(s8)) s8.setData(ma8.length ? ma8 : []);
      if (s13 && hasSetData(s13)) s13.setData(ma13.length ? ma13 : []);

      // leyenda
      if (el) {
        if (!legendRef.current) {
          const legend = document.createElement("div");
          Object.assign(legend.style, {
            position: "absolute",
            bottom: "10px",
            left: "12px",
            color: "#cbd5e1",
            fontSize: "12px",
            background: "rgba(0,0,0,.25)",
            padding: "6px 8px",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 6,
          });
          legendRef.current = legend;
          el.appendChild(legend);
        }
        legendRef.current.style.display = "block";
        legendRef.current.innerHTML = `
          <span style="color:#2C83FB">●</span> Media móvil (8)
          &nbsp;&nbsp;
          <span style="color:#EF4444">●</span> Media móvil (13)
        `;
      }
    } else {
      // salir de "promedio" → limpiar series y ocultar leyenda
      if (ma8Ref.current) {
        chart.removeSeries?.(ma8Ref.current);
        ma8Ref.current = null;
      }
      if (ma13Ref.current) {
        chart.removeSeries?.(ma13Ref.current);
        ma13Ref.current = null;
      }
      if (legendRef.current) legendRef.current.style.display = "none";
    }

    // marcadores máx/mín
    const maxP = lineData.reduce(
      (a, b) => (b.value > a.value ? b : a),
      lineData[0]
    );
    const minP = lineData.reduce(
      (a, b) => (b.value < a.value ? b : a),
      lineData[0]
    );
    series.setMarkers?.([
      {
        time: maxP.time,
        position: "aboveBar",
        color: "#22c55e",
        shape: "arrowUp",
        text: `Máx ${nf2.format(maxP.value)}`,
      },
      {
        time: minP.time,
        position: "belowBar",
        color: "#f43f5e",
        shape: "arrowDown",
        text: `Mín ${nf2.format(minP.value)}`,
      },
    ]);

    // línea “Último”
    const last = lineData[lineData.length - 1]?.value;
    if (last != null) {
      if (!priceLineRef.current) {
        priceLineRef.current = series.createPriceLine?.({
          price: last,
          color: "#22c55e",
          lineWidth: 1,
          lineStyle: LWC.LineStyle.Dashed,
          axisLabelVisible: true,
          title: "Último",
        });
      } else {
        priceLineRef.current.applyOptions?.({ price: last });
      }
    }
  }, [lineData, nf2, range, tab, ma8.length, ma13.length]);

  /* opciones por rango */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
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
            ? d.toLocaleTimeString("es-CO", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                timeZone: TIME_ZONE,
              })
            : d.toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
                timeZone: TIME_ZONE,
              });
        },
      },
    });
  }, [range]);

  useEffect(() => {
    if (tab !== 'promedio') return;
    const src = dataById?.[1002]
    ? 'WS:1002'
    : lastGoodAvgByRange[range]
    ? 'CACHE: 1002'
    : 'NONE';
    console.log( '[UI] Promedio source =>', src);
  }, [tab, range, dataById, lastGoodAvgByRange])

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
                  range === r
                    ? "bg-green-500 text-black shadow-md"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
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
                  tab === t.key
                    ? "bg-white text-slate-900"
                    : "text-slate-200 hover:bg-slate-700/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div
            ref={canvasRef}
            className="relative w-full rounded-lg mt-3 bg-[#0c0c14]"
            style={{ height }}
          />
        </div>
      </div>
    </section>
  );
}
