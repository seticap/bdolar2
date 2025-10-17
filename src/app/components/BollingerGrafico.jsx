// app/components/BollingerGrafico.jsx
"use client";
import { useEffect, useRef } from "react";
import { createChart, LineSeries, CrosshairMode } from "lightweight-charts";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";

// CAMBIAR ESTO:
const THEME = {
  bg: 'transparent', // ← CAMBIAR de '#000' a 'transparent'
  text: '#9aa4b2',
  grid: 'rgba(255,255,255,.06)',
  cross: 'rgba(255,255,255,.18)',
  price: '#ef4444',
  sma8:  '#22c55e',
  band:  'rgba(255,255,255,.35)',
};

const COMMON_SERIES_OPTS = { lastValueVisible:false, priceLineVisible:false };


/* ---------- helpers ---------- */
function getBlock(input){
  const p = input ?? {};
  const a = p?.data?.data?.data ?? p?.data?.data ?? p?.data ?? p;
  if (a?.labels && a?.datasets) return a;
  if (a?.data?.labels && a?.data?.datasets) return a.data;
  return null;
}

function labelsToTimes(labels = [], baseDay = '2025-09-16') {
  const base00 = Math.floor(Date.parse(`${baseDay}T00:00:00Z`) / 1000);
  const seen = new Map();
  return labels.map((lab, i) => {
    if (typeof lab === 'number') return lab > 1e12 ? Math.floor(lab / 1000) : lab;
    if (typeof lab !== 'string') return base00 + i * 60;

    const s = lab.trim();
    if (/^\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)$/.test(s)) {
      const iso = s.replace(' ', 'T');
      return Math.floor(new Date((iso.length === 16 ? iso + ':00' : iso) + 'Z').getTime() / 1000);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return Math.floor(new Date(s + 'T00:00:00Z').getTime() / 1000);
    }
    if (/^\d{2}:\d{2}(?::\d{2})?$/.test(s)) {
      const hhmmss = s.length === 5 ? s + ':00' : s;
      const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
      const key = hhmmss;
      const dup = (seen.get(key) || 0) + 1; seen.set(key, dup);
      return Math.floor(new Date(`${day}T${hhmmss}Z`).getTime() / 1000) + (dup - 1);
    }
    const t = Math.floor(new Date(s).getTime() / 1000);
    return Number.isFinite(t) ? t : base00 + i * 60;
  });
}

// 🔥 FUNCIÓN MEJORADA: Muestra hora exacta en Bogotá
const fmtTime = (t) => {
  if (typeof t === 'string') return t;
  
  const d = new Date((Number(t) || 0) * 1000);
  if (Number.isNaN(d.getTime())) return '';
  
  // Formatear en hora de Bogotá con minutos y segundos exactos
  return d.toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

function filterByRange(points = [], range = '1D'){
  if(!points.length) return points;
  const toSec = (t) =>
    typeof t === 'number' ? t
    : /^\d{4}-\d{2}-\d{2}$/.test(t)
    ? Math.floor(new Date(t + 'T00:00:00Z').getTime()/1000)
    : NaN;

  const lastSec = toSec(points[points.length - 1].time);
  if (!Number.isFinite(lastSec)) return points;

  const days = { '1D':1, '5D':5, '1M':30, '6M':182, '1A':365 }[range] ?? 365;
  const fromSec = lastSec - days*24*3600;

  return points.filter(p => {
    const ts = toSec(p.time);
    return Number.isFinite(ts) ? ts >= fromSec : true;
  });
}

function sma(series, period) {
  if (!series.length || period < 1) return [];
  const out = []; let sum = 0; const q = [];
  for (let i = 0; i < series.length; i++) {
    sum += series[i].value; q.push(series[i].value);
    if (q.length > period) sum -= q.shift();
    if (q.length === period) out.push({ time: series[i].time, value: +(sum/period).toFixed(2) });
  }
  return out;
}

function genSim(baseDay = "2025-09-16", points = 60) {
  const base = Math.floor(Date.parse(`${baseDay}T08:00:00Z`) / 1000);
  const times = Array.from({ length: points }, (_, i) => base + i * 300);
  let p = 3895;
  const price = times.map((t, i) => {
    p += Math.sin(i/7)*0.9 + (Math.random()-0.5)*1.4;
    return { time: t, value: +p.toFixed(2) };
  });
  const sma20 = sma(price, 20);
  const lower = [], upper = [];
  for (let i = 19; i < price.length; i++) {
    const window = price.slice(i - 19, i + 1).map(x => x.value);
    const avg = sma20[i - 19].value;
    const variance = window.reduce((a,v)=>a+(v-avg)**2,0)/20;
    const std = Math.sqrt(variance);
    lower.push({ time: price[i].time, value: +(avg - 2*std).toFixed(2) });
    upper.push({ time: price[i].time, value: +(avg + 2*std).toFixed(2) });
  }
  return { price, sma20, lower, upper };
}

function removeDuplicatesAndSort(points = []) {
  if (!points.length) return points;
  const uniqueMap = new Map();
  points.forEach(point => {
    if (Number.isFinite(point?.time) && Number.isFinite(point?.value)) {
      uniqueMap.set(point.time, point);
    }
  });
  const uniquePoints = Array.from(uniqueMap.values());
  return uniquePoints.sort((a, b) => a.time - b.time);
}

/* ---------- component ---------- */
export default function BollingerGrafico({
  range = '1D',
  height = 360,
  baseDay = '2025-09-16',
  maxPoints = null,
  simPoints = 60,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceRef = useRef(null);
  const sma20Ref = useRef(null);
  const upperRef = useRef(null);
  const lowerRef = useRef(null);
  const tipRef = useRef(null);

  // Usar el contexto de gráficos
  const context = useWebSocketDataGrafico();
  const { useChartPayload } = context || {};

  const bollingerData = useChartPayload ? useChartPayload(1004, range) : null;

  // init
  useEffect(() => {
    const el = containerRef.current;
    const chart = createChart(el, {
      width: el?.clientWidth || 640,
      height,
      layout: { background: { color: THEME.bg }, textColor: THEME.text },
      grid: { vertLines: { color: THEME.grid }, horzLines: { color: THEME.grid } },
      rightPriceScale: { borderVisible: false },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: false, 
        borderVisible: false,
        // 🔥 MEJORA: Ajustar la visualización del tiempo
        tickMarkFormatter: (time) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: THEME.cross, width: 1, style: 3 },
        horzLine: { color: THEME.cross, width: 1, style: 3 },
      },
    });

    const addLine =
      typeof chart.addLineSeries === "function"
        ? (opts) => chart.addLineSeries(opts)
        : (opts) => chart.addSeries(LineSeries, opts);

    const price = addLine({ color: THEME.price, lineWidth: 2, ...COMMON_SERIES_OPTS });
    const sma20 = addLine({ color: THEME.sma8, lineWidth: 2, ...COMMON_SERIES_OPTS });
    const lower = addLine({ color: THEME.band, lineWidth: 1, ...COMMON_SERIES_OPTS });
    const upper = addLine({ color: THEME.band, lineWidth: 1, ...COMMON_SERIES_OPTS });

    // tooltip
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute", pointerEvents: "none", zIndex: 10, display: "none",
      background: "rgba(15,17,24,.85)", backdropFilter: "blur(6px)", color: "#e7e7ea",
      padding: "8px 10px", borderRadius: "8px", fontSize: "12px",
      border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 6px 18px rgba(0,0,0,.25)",
      // 🔥 MEJORA: Ancho mínimo para tooltip
      minWidth: "200px",
    });
    el.style.position = "relative"; el.appendChild(tip);

    const row = (color, label, v) =>
      v == null ? "" :
      `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
         <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
         <span>${label}: <b>${Number(v).toLocaleString("es-CO")}</b></span>
       </div>`;

    const onMove = (param) => {
      if (!param?.time || !param.point) return (tip.style.display = "none");
      const p  = param.seriesData.get(price)?.value;
      const s  = param.seriesData.get(sma20)?.value;
      const lo = param.seriesData.get(lower)?.value;
      const up = param.seriesData.get(upper)?.value;
      if (p == null && s == null && lo == null && up == null) return (tip.style.display = "none");
      
      // 🔥 MEJORA: Formatear hora exacta para el tooltip
      const exactTime = fmtTime(param.time);
      
      tip.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;color:#fff;">${exactTime}</div>
        ${row("#0bbbf7","Cotización USD/COP", p)}
        ${row(THEME.sma8,"Media móvil (20)", s)}
        ${row(THEME.band,"Banda inferior (20, 2σ)", lo)}
        ${row(THEME.band,"Banda superior (20, 2σ)", up)}
      `;
      tip.style.display = "block";
      tip.style.left = `${Math.min(param.point.x + 12, el.clientWidth - 260)}px`;
      tip.style.top  = `${param.point.y + 12}px`;
    };
    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    chartRef.current   = chart;
    priceRef.current   = price;
    sma20Ref.current   = sma20;
    upperRef.current   = upper;
    lowerRef.current   = lower;
    tipRef.current     = tip;

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el.contains(tipRef.current)) el.removeChild(tipRef.current);
      chart.remove();
      chartRef.current = priceRef.current = sma20Ref.current =
        upperRef.current = lowerRef.current = tipRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions({ height });
  }, [height]);

  // set data from WebSocket context
  useEffect(() => {
    if (!chartRef.current) return;

    let price = [], sma20 = [], lower = [], upper = [];

    if (bollingerData) {
      console.log("📊 [BOLLINGER] Datos recibidos del contexto:", bollingerData);
      
      const { labels, datasets } = bollingerData;
      
      if (datasets && datasets.length >= 4) {
        price = datasets[0]?.data?.map((value, index) => ({
          time: labels[index],
          value: value
        })) || [];

        sma20 = datasets[1]?.data?.map((value, index) => ({
          time: labels[index],
          value: value
        })) || [];

        lower = datasets[2]?.data?.map((value, index) => ({
          time: labels[index],
          value: value
        })) || [];

        upper = datasets[3]?.data?.map((value, index) => ({
          time: labels[index],
          value: value
        })) || [];
      }
    }

    if (!price.length) {
      console.log("🔄 [BOLLINGER] Usando datos de simulación");
      const sim = genSim(baseDay, simPoints);
      price = sim.price;
      sma20 = sim.sma20;
      lower = sim.lower;
      upper = sim.upper;
    }

    const applyRangeAndLimit = (arr) => {
      let filtered = filterByRange(arr, range);
      if (maxPoints && filtered.length > maxPoints) {
        filtered = filtered.slice(-maxPoints);
      }
      return removeDuplicatesAndSort(filtered);
    };

    const finalPrice = applyRangeAndLimit(price);
    const finalSma20 = applyRangeAndLimit(sma20);
    const finalLower = applyRangeAndLimit(lower);
    const finalUpper = applyRangeAndLimit(upper);

    console.log('📊 [BOLLINGER] Datos finales para gráfico:', {
      price: finalPrice.length,
      sma20: finalSma20.length,
      lower: finalLower.length,
      upper: finalUpper.length
    });

    try {
      priceRef.current.setData(finalPrice);
      sma20Ref.current.setData(finalSma20);
      lowerRef.current.setData(finalLower);
      upperRef.current.setData(finalUpper);

      if (finalPrice.length > 0) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      console.error('💥 [BOLLINGER] Error estableciendo datos:', e);
    }
  }, [bollingerData, range, maxPoints, baseDay, simPoints]);

 return (
  <div 
    ref={containerRef} 
    className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
    style={{ height }} 
  />
);
}