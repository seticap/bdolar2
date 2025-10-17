// app/components/PromedioGrafico.jsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CrosshairMode,
} from "lightweight-charts";

const THEME = {
 bg: "transparent", // ← CAMBIAR de "#000" a "transparent"
  text: "#9aa4b2", // ← CAMBIAR de "#e7e7ea" a "#9aa4b2"
  grid: "rgba(255,255,255,.06)", // ← CAMBIAR de ".08" a ".06"
  cross: "rgba(255,255,255,.18)", // ← CAMBIAR de ".25" a ".18"
  primary: "#22c55e", // ← CAMBIAR de "#ef4444" a "#22c55e"
  primaryTop: "rgba(34,197,94,.28)", // ← AJUSTAR para nuevo color
  primaryBottom: "rgba(34,197,94,.06)", // ← AJUSTAR para nuevo color
  line8: "#22c55e",
  line13: "#f59e0b",
};

const COMMON_SERIES_OPTS = {
  lastValueVisible: false,
  priceLineVisible: false,
};

/* ---------- utils ---------- */
function getBlock(input){
  console.log("🔍 [GET_BLOCK] Input recibido:", {
    tieneInput: !!input,
    inputKeys: input ? Object.keys(input) : 'NO_INPUT'
  });

  const p = input ?? {};
  
  console.log("📋 [GET_BLOCK] Estructura completa:", {
    data: p?.data,
    dataData: p?.data?.data,
    dataDataData: p?.data?.data?.data,
    labels: p?.labels,
    datasets: p?.datasets
  });

  const a = p?.data?.data?.data ?? p?.data?.data ?? p?.data ?? p;
  
  if (a?.labels && a?.datasets) {
    console.log("✅ [GET_BLOCK] Estructura encontrada en data.data.data");
    return a;
  }
  if (a?.data?.labels && a?.data?.datasets) {
    console.log("✅ [GET_BLOCK] Estructura encontrada en data.data");
    return a.data;
  }
  if (p?.labels && p?.datasets) {
    console.log("✅ [GET_BLOCK] Estructura encontrada en root");
    return p;
  }

  console.log("❌ [GET_BLOCK] No se pudo encontrar estructura válida");
  return null;
}

const isYmd = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

function makeTimes(labels = []) {
  if (!labels.length) return [];

  return labels.map((l, i) => {
    if (typeof l === "number") {
      return l > 1e12 ? Math.floor(l / 1000) : l;
    }a
    if (typeof l === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(l)) {
        // Para fechas YYYY-MM-DD, usar mediodía en Bogotá
        return fullDateToUnixBogota(l + ' 12:00');
      }
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(l)) {
        // Para horas HH:mm, usar hoy en Bogotá
        return hhmmToUnixTodayBogota(l);
      }
      // Intentar parsear otros formatos
      const timestamp = fullDateToUnixBogota(l);
      return timestamp || i;
    }
    return i;
  });
}

const zip = (times, values) => {
  const n = Math.min(times.length, values.length);
  const out = [];
  for (let i = 0; i < n; i++) {
    const v = Number(values[i]);
    const t = times[i];
    if (Number.isFinite(t) && Number.isFinite(v)) {
      out.push({ time: t, value: v });
    }
  }
  return out;
};

const fmtTime = (t) => {
  if (typeof t === "string") return t;
  
  // Crear fecha en zona horaria de Bogotá
  const d = new Date(t * 1000);
  
  // Formatear en hora de Bogotá
  return d.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const sma = (arr, period) => {
  const out = Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= period) sum -= arr[i - period];
    if (i >= period - 1) out[i] = +(sum / period).toFixed(2);
  }
  return out;
};

function filterSeriesByRange(points = [], range = '1D') {
  if (!points.length) return points;

  const toSec = (t) =>
    typeof t === 'number'
      ? t
      : /^\d{4}-\d{2}-\d{2}$/.test(t)
      ? Math.floor(new Date(t + 'T00:00:00Z').getTime() / 1000)
      : NaN;

  const lastSec = toSec(points[points.length - 1].time);
  if (!Number.isFinite(lastSec)) return points;

  const days = { '1D': 1, '5D': 5, '1M': 30, '6M': 182, '1A': 365 }[range] ?? 365;
  const fromSec = lastSec - days * 24 * 3600;

  const seen = new Set();
  return points
    .filter((p) => {
      const ts = toSec(p.time);
      const shouldKeep = Number.isFinite(ts) ? ts >= fromSec : true;
      
      if (shouldKeep) {
        if (seen.has(ts)) {
          return false;
        }
        seen.add(ts);
        return true;
      }
      return false;
    })
    .sort((a, b) => toSec(a.time) - toSec(b.time));
}

function genSimPromedios({
  baseDay = "2025-09-16",
  points = 3000,
  intervalSec = 5,
  start = 3899,
  vol = 1.2,
  wave = 0.7,
  trend = 0.0006,
} = {}) {
  const seed = Number((baseDay || "").replace(/-/g, "")) || 123456;
  const rnd = mulberry32(seed);
  const base = Math.floor(Date.parse(`${baseDay}T00:00:00Z`) / 1000);
  const times = Array.from(
    { length: points },
    (_, i) => base + i * intervalSec
  );
  const prices = [];
  let p = start;
  for (let i = 0; i < points; i++) {
    p += (rnd() - 0.5) * vol * 2;
    p += Math.sin(i / 120) * wave;
    p += trend;
    p = Math.max(3700, Math.min(4050, p));
    prices.push(+p.toFixed(2));
  }
  const s8 = sma(prices, 8);
  const s13 = sma(prices, 13);
  return {
    price: zip(times, prices),
    sma8: zip(times, s8),
    sma13: zip(times, s13),
  };
}

/* ---------- component ---------- */
export default function PromedioGrafico({
  data,
  fallbackDay = "2025-09-16",
  height = 360,
  forceSimulated = false,
  simPoints = 3000,
  simIntervalSec = 5,
  simStart = 3899,
  simVol = 1.2,
  simWave = 0.7,
  simTrend = 0.0006,
  range = '1D',
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const areaRef = useRef(null);
  const sma8Ref = useRef(null);
  const sma13Ref = useRef(null);
  const tipRef = useRef(null);

  const simOpts = useMemo(
    () => ({
      baseDay: fallbackDay,
      points: simPoints,
      intervalSec: simIntervalSec,
      start: simStart,
      vol: simVol,
      wave: simWave,
      trend: simTrend,
      force: forceSimulated,
    }),
    [
      fallbackDay,
      simPoints,
      simIntervalSec,
      simStart,
      simVol,
      simWave,
      simTrend,
      forceSimulated,
    ]
  );

  // init chart
  useEffect(() => {
    const el = containerRef.current;
    const chart = createChart(el, {
      width: el?.clientWidth || 640,
      height,
      layout: { background: { color: THEME.bg }, textColor: THEME.text },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: THEME.cross, width: 1, style: 3 },
        horzLine: { color: THEME.cross, width: 1, style: 3 },
      },
    });

    const areaOpts = { topColor: THEME.primaryTop, bottomColor: THEME.primaryBottom, lineColor: THEME.primary, lineWidth: 2};
    const line80pts = { color: THEME.line8, lineWidth: 2 };
    const line130pts = { color: THEME.line13, lineWidth: 2};

    let area, sma8, sma13;
    if (typeof chart.addAreaSeries === "function") {
      area = chart.addAreaSeries(areaOpts);
      sma8 = chart.addLineSeries(line80pts);
      sma13 = chart.addLineSeries(line130pts);
    } else {
      area = chart.addSeries(AreaSeries, areaOpts);
      sma8 = chart.addSeries(LineSeries, line80pts);
      sma13 = chart.addSeries(LineSeries, line130pts);
    }

    // tooltip
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: 10,
      display: "none",
      background: "rgba(15,17,24,.85)",
      backdropFilter: "blur(6px)",
      color: "#e7e7ea",
      padding: "8px 10px",
      borderRadius: "8px",
      fontSize: "12px",
      border: "1px solid rgba(255,255,255,.08)",
      boxShadow: "0 6px 18px rgba(0,0,0,.25)",
    });
    el.style.position = "relative";
    el.appendChild(tip);

    const onMove = (param) => {
      if (!param?.time || !param.point) {
        tip.style.display = "none";
        return;
      }
      const p = param.seriesData.get(area);
      const s8 = param.seriesData.get(sma8);
      const s13 = param.seriesData.get(sma13);
      const price = p?.value ?? p?.close;
      const v8 = s8?.value ?? s8?.close;
      const v13 = s13?.value ?? s13?.close;
      if (price == null && v8 == null && v13 == null) {
        tip.style.display = "none";
        return;
      }

      tip.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px;">${fmtTime(
          param.time
        )}</div>
        <div><span style="display:inline-block;width:10px;height:10px;;background:${
          THEME.primary
        };border-radius:2px;margin-right:6px;"></span>
          Cotización USD/COP: <b>${
            price != null ? Number(price).toLocaleString("es-CO") : "-"
          }</b>
        </div>
        <div><span style="display:inline-block;width:10px;height:10px;background:${
          THEME.line8
        };border-radius:2px;margin-right:6px;"></span>
          Media móvil (8): <b>${
            v8 != null ? Number(v8).toLocaleString("es-CO") : "-"
          }</b>
        </div>
        <div><span style="display:inline-block;width:10px;height:10px;background:${
          THEME.line13
        };border-radius:2px;margin-right:6px;"></span>
          Media móvil (13): <b>${
            v13 != null ? Number(v13).toLocaleString("es-CO") : "-"
          }</b>
        </div>`;
      const left = Math.min(param.point.x + 12, el.clientWidth - 240);
      tip.style.left = `${left}px`;
      tip.style.top = `${param.point.y + 12}px`;
      tip.style.display = "block";
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    chartRef.current = chart;
    areaRef.current = area;
    sma8Ref.current = sma8;
    sma13Ref.current = sma13;
    tipRef.current = tip;

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el && el.contains(tipRef.current)) {
        el.removeChild(tipRef.current);
      }
      chart.remove();
      chartRef.current =
        areaRef.current =
        sma8Ref.current =
        sma13Ref.current =
        tipRef.current =
          null;
    };
  }, []);

  // adjust height
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  // set data (payload o simulación)
  useEffect(() => {
    if (!chartRef.current) return;

    console.log("📊 [PROMEDIO_GRAFICO] Actualizando datos:", {
      tieneData: !!data,
      dataStructure: data ? Object.keys(data) : 'NO_DATA',
      labelsLength: data?.labels?.length,
      datasetsLength: data?.datasets?.length,
      forceSimulated,
      range
    });

    const block = getBlock(data || {});
    console.log("🔍 [PROMEDIO_GRAFICO] Block extraído:", {
      tieneBlock: !!block,
      blockLabels: block?.labels?.length,
      blockDatasets: block?.datasets?.length
    });

    let price = [], s8 = [], s13 = [];

    if (!simOpts.force && block) {
      console.log("🎯 [PROMEDIO_GRAFICO] Usando datos reales del block");
      const times = makeTimes(block.labels || []);
      
      console.log("⏰ [PROMEDIO_GRAFICO] Times generados:", {
        timesLength: times.length,
        sampleTimes: times.slice(0, 5)
      });

      block.datasets?.forEach((dataset, index) => {
        console.log(`📈 [PROMEDIO_GRAFICO] Dataset ${index}:`, {
          label: dataset.label,
          dataLength: dataset.data?.length,
          sampleData: dataset.data?.slice(0, 5)
        });
      });

      price = zip(times, block.datasets?.[0]?.data || []);
      s8    = zip(times, block.datasets?.[1]?.data || []);
      s13   = zip(times, block.datasets?.[2]?.data || []);

      console.log("📦 [PROMEDIO_GRAFICO] Datasets procesados:", {
        priceLength: price.length,
        s8Length: s8.length,
        s13Length: s13.length
      });
    }

    if (simOpts.force || !price.length) {
      console.log("🔄 [PROMEDIO_GRAFICO] Usando datos simulados");
      const sim = genSimPromedios(simOpts);
      price = sim.price;
      s8 = sim.sma8;
      s13 = sim.sma13;
    }

    // Apply range filtering
    if (typeof range === 'string') {
      price = filterSeriesByRange(price, range);
      s8 = filterSeriesByRange(s8, range);
      s13 = filterSeriesByRange(s13, range);
    }

    // Final sanitization
    const sanitize = (arr) => {
      const seen = new Set();
      return arr
        .filter(p => Number.isFinite(p?.time) && Number.isFinite(p?.value))
        .sort((a, b) => a.time - b.time)
        .filter(p => {
          if (seen.has(p.time)) return false;
          seen.add(p.time);
          return true;
        });
    };

    price = sanitize(price);
    s8 = sanitize(s8);
    s13 = sanitize(s13);

    console.log("✅ [PROMEDIO_GRAFICO] Datos finales listos para gráfico:", {
      price: price.length,
      s8: s8.length, 
      s13: s13.length
    });

    // Set the data
    areaRef.current.setData(price);
    sma8Ref.current.setData(s8);
    sma13Ref.current.setData(s13);

    // Ajustar la escala de tiempo
    if (price.length >= 2) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, simOpts, range]);

return (
  <div
    ref={containerRef}
    className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
    style={{ height }}
  />
);
}