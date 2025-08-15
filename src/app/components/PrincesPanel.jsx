"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  CrosshairMode,
  LineStyle,
  AreaSeries,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";

/* ---------- Skin / helpers de estilo ---------- */
const THEME = {
  bg: "#0b0f17",
  panel: "#0d1119",
  text: "#e5e7eb",
  textDim: "rgba(229,231,235,.75)",
  grid: "rgba(255,255,255,.06)",
  gridLite: "rgba(255,255,255,.04)",
  border: "rgba(255,255,255,.10)",
  shadow: "0 12px 30px rgba(0,0,0,.35)",
  font: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
  // colores del look de la imagen
  // -> rojo como color principal del precio
  accent: "#dc2626", // rojo
  accentTop: "rgba(220,38,38,.28)", // degradado superior rojo
  accentBottom: "rgba(220,38,38,.06)", // degradado inferior rojo

  // velas alcistas (verde) + auxiliares
  up: "#16a34a", // verde vela alcista
  blue: "#22d3ee", // para MA(8)
  red: "#dc2626", // reutilizado para banda -2σ
  gray: "#94a3b8", // banda +2σ / líneas neutras

  // ...lo que ya tienes
  // --- NUEVO: paleta verde para el precio ---
  accentG: "#22c55e",
  accentGTop: "rgba(34,197,94,.22)",
  accentGBottom: "rgba(34,197,94,.06)",

  // --- NUEVO: turquesa que combina con el tema ---
  turquoise: "#2dd4bf",
};
const numberFmt = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const formatPrice = (v) => (v == null ? "--" : numberFmt.format(v));

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
    scaleMargins: { top: 0.07, bottom: 0.12 },
    entireTextOnly: true,
    borderVisible: true,
  },
  rightPriceScale: { visible: false },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: {
      color: "rgba(255,255,255,.30)",
      style: LineStyle.Dotted,
      width: 1,
    },
    horzLine: {
      color: "rgba(255,255,255,.30)",
      style: LineStyle.Dotted,
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

// Mini-leyenda flotante (añade esto a tus utils)
function makeLegend(container) {
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "absolute",
    left: "12px",
    bottom: "10px",
    background: "rgba(9,13,22,.72)",
    backdropFilter: "blur(4px)",
    color: THEME.text,
    border: `1px solid ${THEME.border}`,
    borderRadius: "10px",
    padding: "6px 8px",
    fontSize: "12px",
    lineHeight: "1.35",
    boxShadow: THEME.shadow,
    display: "flex",
    gap: "12px",
    zIndex: 2,
  });
  container.appendChild(box);
  return {
    el: box,
    set(items) {
      box.innerHTML = items
        .map(
          (i) =>
            `<span>${dot(i.color)}<span style="opacity:.8">${
              i.label
            }:</span> <strong>${i.value}</strong></span>`
        )
        .join("");
    },
    remove() {
      box.remove();
    },
  };
}

function makeTooltip() {
  const t = document.createElement("div");
  Object.assign(t.style, {
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
    whiteSpace: "nowrap",
    boxShadow: THEME.shadow,
    minWidth: "180px",
  });
  return t;
}

const dot = (c) =>
  `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:6px;vertical-align:middle"></span>`;
/* --------------------------- Datos simulados --------------------------- */
function genPriceSeries(days, stepMin = 10) {
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  let v = 4020 + Math.random() * 30;
  const out = [];
  for (let t = start; t <= Date.now(); t += stepMin * 60 * 1000) {
    v += Math.sin(out.length / 12) * 0.6 + (Math.random() - 0.5) * 0.9;
    out.push({ time: Math.floor(t / 1000), value: Number(v.toFixed(2)) });
  }
  return out;
}

function mockOhlcData(line) {
  if (!line || !line.length) return [];
  const ohlc = [];
  for (let i = 0; i < line.length; i += 5) {
    const chunk = line.slice(i, i + 5);
    const open = ohlc.length ? ohlc[ohlc.length - 1].close : chunk[0].value;
    const close = chunk[chunk.length - 1]?.value ?? open;
    const high = Math.max(...chunk.map((p) => p.value), open, close);
    const low = Math.min(...chunk.map((p) => p.value), open, close);
    ohlc.push({
      time: chunk[chunk.length - 1]?.time ?? line[i].time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });
  }
  return ohlc;
}

function sma(lineData, period) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < lineData.length; i++) {
    sum += lineData[i].value;
    if (i >= period) sum -= lineData[i - period].value;
    if (i >= period - 1) {
      out.push({
        time: lineData[i].time,
        value: Number((sum / period).toFixed(2)),
      });
    }
  }
  return out;
}

/* ------------------------------- Precios ------------------------------- */
function mountPreciosChart(el, size, dataByRange, selectedRange, chartRef) {
  el.style.background = "#0c0c14";
  el.style.position = "relative";

  const mainDiv = document.createElement("div");
  Object.assign(mainDiv.style, { width: "100%", height: "430px" });
  el.appendChild(mainDiv);

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

  const mainChart = createChart(mainDiv, {
    width: mainDiv.clientWidth || size.width,
    height: mainDiv.clientHeight || 430,
    ...BASE_OPTS,
  });

  const areaMain = mainChart.addSeries(AreaSeries, {
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
  });

  const setDataFor = (r) => {
    const data = dataByRange[r] || [];
    areaMain.setData(data);
    mainChart.timeScale().fitContent();
  };
  setDataFor(selectedRange);

  const tooltip = makeTooltip();
  el.appendChild(tooltip);

  mainChart.subscribeCrosshairMove((param) => {
    if (!param?.time || !param.seriesData) {
      tooltip.style.display = "none";
      return;
    }
    const d = new Date(param.time * 1000);
    const dd = d.toISOString().slice(0, 10);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const v = param.seriesData.get(areaMain)?.value;

    tooltip.innerHTML = `
      <div><strong>${dd} ${hh}:${mm}</strong></div>
      <div style="color:#34d399">Cotización USD/COP: ${
        v?.toFixed(2) ?? "--"
      }</div>
    `;

    const rect = el.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let left = param.point.x + 10;
    let top = param.point.y + 10;
    if (left + tw > rect.width) left = param.point.x - tw - 10;
    if (top + th > rect.height) top = param.point.y - th - 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  });

  const ro = new ResizeObserver(() => {
    chartRef.current?.applyOptions?.({
      width: mainDiv.clientWidth,
      height: mainDiv.clientHeight,
    });
  });
  ro.observe(mainDiv);

  const api = {
    setRange(r) {
      setDataFor(r);
    },
    applyOptions(opts) {
      mainChart.applyOptions(
        opts || { width: mainDiv.clientWidth, height: mainDiv.clientHeight }
      );
    },
    remove() {
      ro.disconnect();
      try {
        mainChart.remove();
      } catch {}
      title.remove();
      tooltip.remove();
    },
    timeScale() {
      return mainChart.timeScale();
    },
  };
  api.__composite = true;
  return api;
}

/* ----------------------------- Promedio ---------------------------- */
function mountPromedioChart(el, size, lineData) {
  const chart = createChart(el, {
    width: size.width,
    height: size.height,
    ...BASE_OPTS,
  });

  const area = chart.addSeries(AreaSeries, {
    lineColor: THEME.accentG,
    topColor: THEME.accentGTop,
    bottomColor: THEME.accentGBottom,
    lineWidth: 2,
    lastValueVisible: false,
    priceLineVisible: false,
  });
  area.setData(lineData);

  const ma8 = chart.addSeries(LineSeries, {
    color: THEME.turquoise,
    lineWidth: 2.2,
  });
  const ma13 = chart.addSeries(LineSeries, {
    color: THEME.gray,
    lineWidth: 2.2,
  });
  ma8.setData(sma(lineData, 8));
  ma13.setData(sma(lineData, 13));

  chart.timeScale().fitContent();

  const tooltip = makeTooltip();
  el.appendChild(tooltip);

  chart.subscribeCrosshairMove((param) => {
    if (!param?.time || !param.seriesData) {
      tooltip.style.display = "none";
      return;
    }
    const date = new Date(param.time * 1000);
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");

    const areaValue = param.seriesData.get(area)?.value;
    const ma8Value = param.seriesData.get(ma8)?.value;
    const ma13Value = param.seriesData.get(ma13)?.value;

    tooltip.innerHTML = `
  <div style="opacity:.85;margin-bottom:6px">${hours}:${minutes}</div>
  <div style="color:${THEME.accentG}">Cotización USD/COP:&nbsp;<strong>${
      areaValue?.toFixed(2) ?? "--"
    }</strong></div>
  <div>${dot(THEME.turquoise)}Media móvil (8):&nbsp;<strong>${
      ma8Value?.toFixed(2) ?? "--"
    }</strong></div>
  <div>${dot(THEME.gray)}Media móvil (13):&nbsp;<strong>${
      ma13Value?.toFixed(2) ?? "--"
    }</strong></div>
`;

    const rect = el.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let left = param.point.x + 10;
    let top = param.point.y + 10;
    if (left + tw > rect.width) left = param.point.x - tw - 10;
    if (top + th > rect.height) top = param.point.y - th - 10;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  });

  return chart;
}

/* ----------------------------- Velas ---------------------------- */
function mountVelasChart(el, size, ohlcData) {
  const chart = createChart(el, {
    width: size.width,
    height: size.height,
    ...BASE_OPTS,
  });

  const candle = chart.addSeries(CandlestickSeries, {
    upColor: THEME.up,
    wickUpColor: THEME.up,
    borderUpColor: THEME.up,

    downColor: THEME.red,
    wickDownColor: THEME.red,
    borderDownColor: THEME.red,

    borderVisible: true,
  });
  candle.setData(ohlcData);
  chart.timeScale().fitContent();

  const tooltip = makeTooltip();
  el.appendChild(tooltip);

  chart.subscribeCrosshairMove((param) => {
    if (!param?.time || !param.point || !param.seriesData) {
      tooltip.style.display = "none";
      return;
    }
    const v = param.seriesData.get(candle);
    if (!v) {
      tooltip.style.display = "none";
      return;
    }
    const d = new Date(param.time * 1000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const fmt = (n) => Number(n).toFixed(2);

    tooltip.innerHTML = `
      <div style="opacity:.85;margin-bottom:6px">${hh}:${mm}</div>
      <div>Open:&nbsp;<strong>${fmt(v.open)}</strong></div>
      <div>High:&nbsp;<strong>${fmt(v.high)}</strong></div>
      <div>Low:&nbsp;&nbsp;<strong>${fmt(v.low)}</strong></div>
      <div>Close:<strong>${fmt(v.close)}</strong></div>
    `;

    const rect = el.getBoundingClientRect();
    const tw = tooltip.offsetWidth || 160;
    const th = tooltip.offsetHeight || 90;
    let left = param.point.x + 12;
    let top = param.point.y + 12;
    if (left + tw > rect.width) left = param.point.x - tw - 12;
    if (top + th > rect.height) top = param.point.y - th - 12;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  });

  return {
    applyOptions(opts) {
      chart.applyOptions(
        opts || {
          width: el.clientWidth || size.width,
          height: el.clientHeight || size.height,
        }
      );
    },
    remove() {
      try {
        chart.remove();
      } catch {}
      tooltip.remove();
    },
    timeScale() {
      return chart.timeScale();
    },
  };
}

/* ----------------------------- Bollinger ---------------------------- */
function mountBollingerChart(el, size, lineData) {
  const chart = createChart(el, {
    width: size.width,
    height: size.height,
    ...BASE_OPTS,
  });

  // Serie de precio (área + “glow” ligero)
  const price = chart.addSeries(AreaSeries, {
    lineColor: THEME.accentG,
    topColor: THEME.accentGTop,
    bottomColor: THEME.accentGBottom,
    lineWidth: 2.5,
    lastValueVisible: true,
    priceLineVisible: true,
    priceLineColor: "rgba(34,197,94,.45)",
  });
  price.setData(lineData);

  // Medias y bandas
  const ma8Data = sma(lineData, 8);
  const ma8 = chart.addSeries(LineSeries, {
    color: THEME.turquoise,
    lineWidth: 2.2,
  });
  ma8.setData(ma8Data);

  const ma20 = sma(lineData, 20);
  const base = chart.addSeries(LineSeries, {
    color: THEME.textDim,
    lineWidth: 2,
  });
  base.setData(ma20);

  const upper = chart.addSeries(LineSeries, {
    color: THEME.gray,
    lineWidth: 1.6,
    lineStyle: LineStyle.Dotted,
  });
  const lower = chart.addSeries(LineSeries, {
    color: THEME.red,
    lineWidth: 1.6,
    lineStyle: LineStyle.Dotted,
  });

  const band = ma20.map((p, i) => {
    const slice = lineData.slice(Math.max(0, i + 1 - 20), i + 1);
    const mean = p.value;
    const sd =
      Math.sqrt(
        slice.reduce((acc, x) => acc + Math.pow(x.value - mean, 2), 0) /
          Math.max(1, slice.length)
      ) || 0.5;
    return { time: p.time, up: mean + 2 * sd, dn: mean - 2 * sd };
  });

  upper.setData(
    band.map((b) => ({ time: b.time, value: Number(b.up.toFixed(2)) }))
  );
  lower.setData(
    band.map((b) => ({ time: b.time, value: Number(b.dn.toFixed(2)) }))
  );

  // Marca el último punto (compatible con distintas versiones)
  const last = lineData[lineData.length - 1];
  if (last) {
    if (typeof price.setMarkers === "function") {
      price.setMarkers([
        {
          time: last.time,
          position: "inBar",
          color: THEME.accent,
          shape: "circle",
          size: 1,
        },
      ]);
    } else if (typeof price.createPriceLine === "function") {
      // Fallback: línea de precio en el último valor
      price.createPriceLine({
        price: last.value,
        color: "rgba(34,197,94,.45)",
        lineStyle: LineStyle.Solid,
        lineWidth: 1,
        axisLabelVisible: false,
        title: "",
      });
    }
  }

  chart.timeScale().fitContent();

  // Tooltip + Leyenda
  const tooltip = makeTooltip();
  el.appendChild(tooltip);
  const legend = makeLegend(el);

  const updateUI = (param) => {
    const p = param.seriesData.get(price)?.value;
    const m8 = param.seriesData.get(ma8)?.value;
    const up = param.seriesData.get(upper)?.value;
    const dn = param.seriesData.get(lower)?.value;

    legend.set([
      { color: THEME.accentG, label: "Precio", value: formatPrice(p) },
      { color: THEME.turquoise, label: "MA(8)", value: formatPrice(m8) },
      { color: THEME.red, label: "BB -2σ", value: formatPrice(dn) },
      { color: THEME.gray, label: "BB +2σ", value: formatPrice(up) },
    ]);

    if (!param.time || !param.point) {
      tooltip.style.display = "none";
      return;
    }
    const d = new Date(param.time * 1000);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");

    tooltip.innerHTML = `
  <div style="opacity:.85;margin-bottom:6px">${hh}:${mm}</div>
  <div>${dot(THEME.accentG)}Cotización:&nbsp;<strong>${formatPrice(
      p
    )}</strong></div>
  <div>${dot(THEME.turquoise)}Media móvil (8):&nbsp;<strong>${formatPrice(
      m8
    )}</strong></div>
  <div>${dot(THEME.red)}Band -2σ:&nbsp;<strong>${formatPrice(dn)}</strong></div>
  <div>${dot(THEME.gray)}Band +2σ:&nbsp;<strong>${formatPrice(
      up
    )}</strong></div>
`;

    const rect = el.getBoundingClientRect();
    const tw = tooltip.offsetWidth || 200;
    const th = tooltip.offsetHeight || 110;
    let left = param.point.x + 12;
    let top = param.point.y + 12;
    if (left + tw > rect.width) left = param.point.x - tw - 12;
    if (top + th > rect.height) top = param.point.y - th - 12;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = "block";
  };

  chart.subscribeCrosshairMove(updateUI);

  return {
    applyOptions(opts) {
      chart.applyOptions(
        opts || {
          width: el.clientWidth || size.width,
          height: el.clientHeight || size.height,
        }
      );
    },
    remove() {
      try {
        chart.remove();
      } catch {}
      tooltip.remove();
      legend.remove();
    },
    timeScale() {
      return chart.timeScale();
    },
  };
}

/* --------------------------- Componente UI --------------------------- */
export default function Grafica() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const [tab, setTab] = useState("precios");
  const [range, setRange] = useState("1d");

  const dataByRange = useMemo(
    () => ({
      "1d": genPriceSeries(1, 5),
      "5d": genPriceSeries(5, 10),
      "1m": genPriceSeries(30, 30),
      "6m": genPriceSeries(180, 60),
      "1a": genPriceSeries(365, 120),
    }),
    []
  );

  const lineData = useMemo(
    () => dataByRange[range] ?? dataByRange["1d"],
    [dataByRange, range]
  );
  const ohlcData = useMemo(() => mockOhlcData(lineData), [lineData]);
  const size = useMemo(() => ({ width: 1100, height: 520 }), []);

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

    if (tab === "precios") {
      chartRef.current = mountPreciosChart(
        el,
        size,
        dataByRange,
        range,
        chartRef
      );
    } else if (tab === "promedio") {
      chartRef.current = mountPromedioChart(el, size, lineData);
    } else if (tab === "velas") {
      chartRef.current = mountVelasChart(el, size, ohlcData);
    } else if (tab === "bollinger") {
      chartRef.current = mountBollingerChart(el, size, lineData);
    }

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth || size.width;
      const h = el.clientHeight || size.height;
      const cur = chartRef.current;
      if (!cur) return;
      cur.applyOptions?.({
        width: w,
        height: h,
        layout: {
          background: { type: "solid", color: "#0c0c14" },
          textColor: THEME.text,
        },
      });
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      chartRef.current?.remove?.();
      chartRef.current = null;
    };
  }, [tab, lineData, ohlcData, size, range, dataByRange]);

  function zoomLogical(ts, factor) {
    // factor < 1  -> zoom IN (acerca)
    // factor > 1  -> zoom OUT (aleja)
    const r = ts.getVisibleLogicalRange?.();
    if (!r) return;
    const span = r.to - r.from;
    const newSpan = span * factor;
    const delta = (newSpan - span) / 2;
    ts.setVisibleLogicalRange({
      from: r.from - delta,
      to: r.to + delta,
    });
  }
  const zoomIn = () => {
    const ts = chartRef.current?.timeScale?.();
    if (!ts) return;
    zoomLogical(ts, 0.8); // 20% más cerca
  };

  const zoomOut = () => {
    const ts = chartRef.current?.timeScale?.();
    if (!ts) return;
    zoomLogical(ts, 1.25); // 25% más lejos
  };

  const resetHome = () => chartRef.current?.timeScale?.().fitContent();
  return (
    <section
      ref={wrapRef}
      className="w-full max-w-[1200px] mx-auto p-4 text-white"
    >
      <div className="rounded-xl border border-slate-700 overflow-hidden bg-[#0d0f16]">
        <div className="flex items-center justify-between bg-[#0a2b3e] px-4 py-3">
          <h3 className="text-slate-100 font-semibold">Precios</h3>
          <div className="flex items-center gap-2 text-slate-100">
            <span className="text-sm opacity-80 mr-2">Acciones</span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded bg-[#114861] hover:bg-[#0e3a4d]"
            >
              ＋
            </button>
            <button
              onClick={zoomOut}
              className="p-1.5 rounded bg-[#114861] hover:bg-[#0e3a4d]"
            >
              －
            </button>
            <button
              onClick={resetHome}
              className="p-1.5 rounded bg-[#114861] hover:bg-[#0e3a4d]"
            >
              🏠
            </button>
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

        <div className="px-4 pb-2">
          <div
            ref={canvasRef}
            className="relative w-full h-[520px] rounded-lg mt-3 bg-[#0c0c14]"
          />
        </div>

        <div className="flex items-center gap-2 px-4 pb-4">
          {["1d", "5d", "1m", "6m", "1a"].map((r) => (
            <button
              key={r}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                range === r
                  ? "bg-[#0a2b3e] text-white border-transparent"
                  : "bg-slate-800/40 text-slate-100 border-slate-700 hover:bg-slate-700/40"
              }`}
              onClick={() => {
                setRange(r);
                chartRef.current?.setRange?.(r);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
