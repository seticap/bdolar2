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
  accentGTop: "rgba(34,197,94,.22)",
  accentGBottom: "rgba(34,197,94,.06)",
};




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
    scaleMargins: { top: 0.07, bottom: 0.12 },
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


/* ================= Parser robusto + helpers ================= */
function tryJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
function parseWeird(str) {
  if (typeof str !== "string") return null;
  let s = str.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  )
    s = s.slice(1, -1);
  s = s.replace(/\\"/g, '"').replace(/\\n|\\r/g, "");
  let j = tryJson(s);
  if (j) return j;
  let fixed = s;
  if (/^\s*(data|labels|datasets|prices)\s*:/.test(fixed)) fixed = `{${fixed}}`;
  fixed = fixed
    .replace(/'/g, '"')
    .replace(/([\s{,])([a-zA-Z_][\w]*)\s*:/g, '$1"$2":')
    .replace(/,\s*]/g, "]")
    .replace(/,\s*}/g, "}");
  return tryJson(fixed);
}
function numbersFromString(s) {
  if (typeof s !== "string") return null;
  const m = s.match(/-?\d+(\.\d+)?/g);
  return m ? m.map(Number).filter((n) => !Number.isNaN(n)) : null;
}
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
  const candidates = [
    obj,
    obj?.data,
    obj?.data?.data,
    obj?.data?.data?.data,
    obj?.result?.[0],
    obj?.result?.[0]?.data,
  ];
  for (const c of candidates) if (isChart(c)) return c;
  const q = candidates.filter(Boolean);
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
function parseApiPayloadToLineData(payload) {
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
  let rawPrices = [];
  if (Array.isArray(chart?.datasets)) {
    const d0 = chart.datasets[0]?.data;
    if (Array.isArray(d0)) rawPrices = d0;
    else if (typeof d0 === "string") rawPrices = numbersFromString(d0) ?? [];
  } else if (Array.isArray(chart?.prices)) {
    rawPrices = chart.prices;
  } else if (typeof chart?.prices === "string") {
    rawPrices = numbersFromString(chart.prices) ?? [];
  }
  if (!rawPrices?.length) {
    const stack = [chart];
    const seen = new Set();
    let found = null;
    while (stack.length && !found) {
      const cur = stack.pop();
      if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
      seen.add(cur);
      for (const k of Object.keys(cur)) {
        const v = cur[k];
        if (typeof v === "string") {
          const nums = numbersFromString(v);
          if (nums && nums.length >= 5) {
            found = nums;
            break;
          }
        } else if (v && typeof v === "object") {
          stack.push(v);
        }
      }
    }
    if (found) rawPrices = found;
  }
  const prices = (rawPrices || []).map(Number).filter((n) => !Number.isNaN(n));
  if ((!labels || !labels.length) && prices.length)
    labels = Array.from({ length: prices.length }, (_, i) => i);
  if (!labels.length || !prices.length) return [];
  const len = Math.min(labels.length, prices.length);
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  ).getTime();
  const dup = new Map();
  const out = [];
  for (let i = 0; i < len; i++) {
    const label = labels[i];
    let tsSec = null;
    if (typeof label === "string") {
      const parts = label.split(":").map(Number);
      const H = parts[0];
      const M = parts[1] ?? 0;
      if (!Number.isNaN(H) && !Number.isNaN(M)) {
        const key = `${H}:${M}`;
        const minuteTs = midnight + (H * 60 + M) * 60 * 1000;
        const count = (dup.get(key) ?? 0) + 1;
        dup.set(key, count);
        tsSec = Math.floor((minuteTs + (count - 1) * 1000) / 1000);
      }
    }
    if (tsSec == null) tsSec = Math.floor((midnight + i * 60 * 1000) / 1000);
    out.push({ time: tsSec, value: prices[i] });
  }
  if (process.env.NODE_ENV !== "production") {
    console.log("[Grafica] points:", out.length);
  }
  return out;
}


/* === Helper compatibilidad serie (v5.0.8) === */
function normalizeSeriesReturn(s) {
  // algunos builds devuelven { series }, otros { api }, u objetos directos
  if (!s) return null;
  if (s.series) return s.series;
  if (s.api) return s.api;
  return s;
}
function hasSetData(api) {
  return !!api && typeof api.setData === "function";
}
function createAreaSeriesCompat(chart) {
  const areaOpts = {
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


  // 1) API clásica
  if (typeof chart.addAreaSeries === "function") {
    const s = chart.addAreaSeries(areaOpts);
    const api = normalizeSeriesReturn(s);
    if (hasSetData(api)) return api;
  }


  // 2) addSeries con string
  if (typeof chart.addSeries === "function") {
    try {
      const sA = chart.addSeries("Area", areaOpts);
      const apiA = normalizeSeriesReturn(sA);
      if (hasSetData(apiA)) return apiA;
    } catch {}


    // 3) addSeries con objeto { type }
    try {
      const sB = chart.addSeries({ type: "Area", ...areaOpts });
      const apiB = normalizeSeriesReturn(sB);
      if (hasSetData(apiB)) return apiB;
    } catch {}


    // 4) addSeries con clase exportada (algunos bundles de v5)
    try {
      const AreaCtor =
        LWC.AreaSeries || LWC.SeriesArea || LWC.DefaultAreaSeries;
      if (AreaCtor) {
        const sC = chart.addSeries(AreaCtor, areaOpts);
        const apiC = normalizeSeriesReturn(sC);
        if (hasSetData(apiC)) return apiC;
      }
    } catch {}
  }


  // 5) último recurso visible: línea
  if (typeof chart.addLineSeries === "function") {
    const s = chart.addLineSeries({
      color: THEME.accentG,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
    });
    const api = normalizeSeriesReturn(s);
    if (hasSetData(api)) return api;
  }


  console.error(
    "[Grafica] No encontré una forma compatible de crear la serie. Métodos:",
    Object.keys(chart || {})
  );
  return null;
}


/* === Extrae labels + precios de payload normalizado === */
function extractLineFromNormalized(payload) {
  const d =
    payload?.data?.data?.data?.data ??
    payload?.data?.data?.data ??
    payload?.data?.data ??
    null;


  if (!d?.labels || !d?.datasets?.[0]?.data) return null;


  const labels = d.labels;
  const prices = d.datasets[0].data.map(Number).filter((n) => !Number.isNaN(n));
  return { labels, prices };
}


/* ======================== UI (solo PRECIOS activo) ======================== */
export default function Grafica({ className = "", height = 520 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);


  const [tab, setTab] = useState("precios");
  const [range, setRange] = useState("1d");


  const { dataById, loadChart } = useWebSocketData();
  const [lastValidPayload, setLastValidPayload] = useState(null);


  const lastGoodLineDataRef = useRef([]);
  const chartPayload = useMemo(() => {
    if (!dataById) return null;
    const preferred = [1006, 1005, 1001, 1000];
    for (const id of preferred) if (dataById[id]) return dataById[id];
    for (const v of Object.values(dataById)) {
      const obj = typeof v === "string" ? parseWeird(v) ?? v : v;
      if (firstChartLike(obj)) return v;
    }
    return null;
  }, [dataById]);


useEffect(() => {
   if (chartPayload) setLastValidPayload(chartPayload);
 }, [chartPayload]);
const lineData = useMemo(() => {
   return parseApiPayloadToLineData(lastValidPayload);
 }, [lastValidPayload]);

  useEffect(() => {
    loadChart?.(range);
  }, [range, loadChart]);


  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;


    el.innerHTML = "";
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch {}
      chartRef.current = null;
    }
    seriesRef.current = null;


    if (tab !== "precios") {
      const placeholder = document.createElement("div");
      Object.assign(placeholder.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: `${height}px`,
        color: THEME.textDim,
        fontSize: "14px",
        background: "#0c0c14",
        borderRadius: "8px",
      });
      placeholder.textContent = "Esta vista estará disponible pronto.";
      el.appendChild(placeholder);
      return;
    }


    if (!lineData.length) {
  // Verifica si antes teníamos datos válidos
  if (lastGoodLineDataRef.current.length > 0) {
    console.warn("[Grafica] Datos actuales vacíos, manteniendo gráfico anterior.");
    return; // No desmontamos el gráfico si antes había datos válidos
  }


  // Primera carga sin datos válidos
  const empty = document.createElement("div");
  Object.assign(empty.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: `${height}px`,
    color: THEME.textDim,
    fontSize: "14px",
    background: "#0c0c14",
    borderRadius: "8px",
  });
  empty.textContent = "Esperando datos del gráfico…";
  el.appendChild(empty);
  return;
}




    el.style.background = "#0c0c14";
    el.style.position = "relative";


    const canvas = document.createElement("div");
    Object.assign(canvas.style, { width: "100%", height: `${height}px` });
    el.appendChild(canvas);


    const title = document.createElement("div");
    Object.assign(title.style, {
      position: "absolute",
      top: "8px",
      left: 0,
      right: 0,
      textAlign: "center",
      color: THEME.text,
      fontSize: "14px",
      fontWeight: "600",
      pointerEvents: "none",
      zIndex: 3,
    });
    title.textContent = "Cotización USD/COP";
    el.appendChild(title);


    const chart = LWC.createChart(canvas, {
      width: el.clientWidth || 1200,
      height,
      ...BASE_OPTS,
    });


    // --- diagnóstico corto (confirma firma del bundle) ---
    if (process.env.NODE_ENV !== "production") {
      console.groupCollapsed("[Diag LWC]");
      console.log("LWC.version:", LWC.version);
      console.log("chart own keys:", Object.keys(chart));
      const proto = Object.getPrototypeOf(chart);
      console.log("typeof addAreaSeries:", typeof chart.addAreaSeries);
      console.log("typeof addLineSeries:", typeof chart.addLineSeries);
      console.log("typeof addSeries:", typeof chart.addSeries);
      console.groupEnd();
    }


    chartRef.current = chart;


    // crear serie con helper
    const series = createAreaSeriesCompat(chart);
    seriesRef.current = series;


    if (hasSetData(series)) {
      series.setData(lineData);
      chart.timeScale().fitContent();
      lastGoodLineDataRef.current = lineData;
    } else {
      console.error("[Grafica] No pude crear la serie con este bundle");
    }


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
      zIndex: 100,
      boxShadow: "0 12px 30px rgba(0,0,0,.35)",
    });
    el.appendChild(tooltip);


    chart.subscribeCrosshairMove((param) => {
      if (!param?.time || !param.seriesData) {
        tooltip.style.display = "none";
        return;
      }
      const d = new Date(param.time * 1000);
      const dd = d.toISOString().slice(0, 10);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      const v = series ? param.seriesData.get(series)?.value : undefined;


      tooltip.innerHTML = `
        <div><strong>${dd} ${hh}:${mm}</strong></div>
        <div style="color:#34d399">Cotización USD/COP: ${
          v?.toFixed?.(2) ?? "--"
        }</div>
      `;


      const rect = el.getBoundingClientRect();
      const tw = tooltip.offsetWidth || 180;
      const th = tooltip.offsetHeight || 60;
      let left = (param.point?.x ?? 0) + 10;
      let top = (param.point?.y ?? 0) + 10;
      if (left + tw > rect.width) left = (param.point?.x ?? 0) - tw - 10;
      if (top + th > rect.height) top = (param.point?.y ?? 0) - th - 10;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.display = "block";
    });


    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 1200, height });
    });
    ro.observe(el);


    return () => {
      ro.disconnect();
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
      Array.from(el.querySelectorAll("div")).forEach((n, i) => {
        if (i > 0) n.remove();
      });
    };
  }, [tab, lineData, height]);


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
                className={`px-3 py-1.5 text-sm rounded-full font-medium transition-all duration-150
        ${
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



