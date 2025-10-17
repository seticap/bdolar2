// app/components/VelasGrafico.jsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
} from "lightweight-charts";

const THEME = {
  bg: "transparent", // ← CAMBIAR de "#000" a "transparent"
  text: "#9aa4b2", // ← CAMBIAR de "#e7e7ea" a "#9aa4b2"
  grid: "rgba(255,255,255,.06)", // ← CAMBIAR de ".08" a ".06"
  cross: "rgba(255,255,255,.18)", // ← CAMBIAR de ".25" a ".18"
  up: "#22c55e",
  down: "#ef4444",
  wickUp: "#22c55e",
  wickDown: "#ef4444",
  borderUp: "#22c55e",
  borderDown: "#ef4444",
};

const COMMON_SERIES_OPTS = {
  lastValueVisible: false,
  priceLineVisible: false,
};

// Función corregida para filtrar datos SOLO por hoy
const filterDataByDate = (data, range = "1D") => {
  if (range !== "1D" || !Array.isArray(data)) return data;
  
  try {
    // Obtener la fecha actual EN BOGOTÁ
    const nowBogota = new Date(new Date().toLocaleString("en-US", { 
      timeZone: "America/Bogota" 
    }));
    
    // Calcular inicio del día actual en Bogotá (00:00:00)
    const startOfToday = new Date(nowBogota);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTimestamp = Math.floor(startOfToday.getTime() / 1000);
    
    // Calcular fin del día actual en Bogotá (23:59:59)
    const endOfToday = new Date(nowBogota);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayTimestamp = Math.floor(endOfToday.getTime() / 1000);
    
    console.log(`📅 [FILTER_BY_DATE_VELAS] Filtrando para HOY: ${startOfToday.toLocaleDateString("es-CO")}`);

    // Filtrar datos que estén dentro del día de HOY
    const filteredData = data.filter(item => {
      const itemTime = item.time;
      return itemTime >= startOfTodayTimestamp && itemTime <= endOfTodayTimestamp;
    });
    
    console.log(`✅ [FILTER_BY_DATE_VELAS] De ${data.length} a ${filteredData.length} velas de HOY`);
    
    return filteredData;
  } catch (error) {
    console.error("💥 [FILTER_BY_DATE_VELAS] Error filtrando datos:", error);
    return data;
  }
};
// Función para generar datos de velas de prueba (fallback)
const generateFallbackVelasData = (range) => {
  console.log("🔄 [FALLBACK_VELAS] Generando datos de prueba para", range);

  const now = Math.floor(Date.now() / 1000);
  let interval, count;

  switch (range) {
    case "1D":
      interval = 300;
      count = 288;
      break;
    case "5D":
      interval = 1800;
      count = 240;
      break;
    case "1M":
      interval = 3600;
      count = 720;
      break;
    case "6M":
      interval = 86400;
      count = 180;
      break;
    case "1A":
      interval = 86400;
      count = 365;
      break;
    default:
      interval = 300;
      count = 100;
  }

  const velas = [];
  let basePrice = 3800;

  for (let i = 0; i < count; i++) {
    const time = now - (count - i - 1) * interval;
    const variation = (Math.random() - 0.5) * 20;
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * 10;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    velas.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    basePrice = close;
  }

  console.log(`✅ [FALLBACK_VELAS] ${velas.length} velas de prueba generadas`);
  return velas;
};

// Función para formatear fecha completa
const fmtDate = (t) => {
  if (typeof t === "string") return t;
  
  const d = new Date(t * 1000);
  return d.toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ---------- component ---------- */
export default function VelasGrafico({
  payload,
  height = 360,
  range = '1D',
  title = "Gráfico de Velas USD/COP",
  forceSimulated = false,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickRef = useRef(null);
  const tipRef = useRef(null);

  // init chart - VERSIÓN CORREGIDA
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    console.log("🚀 [VELAS] Inicializando gráfico de velas...");

    const chart = createChart(el, {
      width: el?.clientWidth || 640,
      height,
      layout: { 
        background: { color: THEME.bg }, 
        textColor: THEME.text 
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: { 
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
        barSpacing: 8,
        minBarSpacing: 4,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { 
          color: THEME.cross, 
          width: 1, 
          style: 3,
          labelBackgroundColor: THEME.bg,
        },
        horzLine: { 
          color: THEME.cross, 
          width: 1, 
          style: 3,
          labelBackgroundColor: THEME.bg,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // CREAR SERIE DE VELAS - VERSIÓN CORREGIDA
    let candlestickSeries;
    try {
      // Método CORRECTO para versiones recientes de lightweight-charts
      candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: THEME.up,
        downColor: THEME.down,
        borderUpColor: THEME.borderUp,
        borderDownColor: THEME.borderDown,
        wickUpColor: THEME.wickUp,
        wickDownColor: THEME.wickDown,
        ...COMMON_SERIES_OPTS,
      });
      console.log("✅ [VELAS] Serie de velas creada con addSeries + CandlestickSeries");
    } catch (error) {
      console.error("💥 [VELAS] Error crítico creando serie de velas:", error);
      return;
    }

    // tooltip
    const tip = document.createElement("div");
    Object.assign(tip.style, {
      position: "absolute",
      pointerEvents: "none",
      zIndex: 10,
      display: "none",
      background: "rgba(15,17,24,.95)",
      backdropFilter: "blur(6px)",
      color: "#e7e7ea",
      padding: "8px 10px",
      borderRadius: "8px",
      fontSize: "12px",
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "0 6px 18px rgba(0,0,0,.35)",
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minWidth: '180px',
    });
    el.style.position = "relative";
    el.appendChild(tip);

    const onMove = (param) => {
      if (!param?.time || !param.point) {
        tip.style.display = "none";
        return;
      }

      if (!candlestickSeries) return;

      const candle = param.seriesData.get(candlestickSeries);
      
      if (!candle) {
        tip.style.display = "none";
        return;
      }

      const { open, high, low, close } = candle;
      const isUp = close >= open;
      const color = isUp ? THEME.up : THEME.down;

      tip.innerHTML = `
        <div style="font-weight:600;margin-bottom:6px;color:#fff;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px;">
          ${fmtDate(param.time)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;font-size:11px;">
          <div style="color:${THEME.text}">Apertura:</div>
          <div style="color:#fff;font-weight:500;text-align:right">$${Number(open).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Máximo:</div>
          <div style="color:${THEME.up};font-weight:500;text-align:right">$${Number(high).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Mínimo:</div>
          <div style="color:${THEME.down};font-weight:500;text-align:right">$${Number(low).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Cierre:</div>
          <div style="color:${color};font-weight:500;text-align:right">$${Number(close).toLocaleString("es-CO")}</div>
        </div>
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,.1);font-size:10px;color:${THEME.text}">
          Variación: <span style="color:${color};font-weight:500">${((close - open) / open * 100).toFixed(2)}%</span>
        </div>
      `;

      const rect = el.getBoundingClientRect();
      const left = Math.min(param.point.x + 12, rect.width - 200);
      const top = Math.min(param.point.y + 12, rect.height - 150);

      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
      tip.style.display = "block";
    };

    chart.subscribeCrosshairMove(onMove);

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
    });
    ro.observe(el);

    chartRef.current = chart;
    candlestickRef.current = candlestickSeries;
    tipRef.current = tip;

    console.log("✅ [VELAS] Gráfico inicializado correctamente");

    return () => {
      console.log("🧹 [VELAS] Limpiando gráfico...");
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el && el.contains(tipRef.current)) {
        el.removeChild(tipRef.current);
      }
      chart.remove();
      chartRef.current = candlestickRef.current = tipRef.current = null;
    };
  }, []);

  // adjust height
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  // set data (payload o simulación) - VERSIÓN MEJORADA
  useEffect(() => {
    if (!chartRef.current || !candlestickRef.current) {
      console.log("⏳ [VELAS_GRAFICO] Esperando inicialización del gráfico...");
      return;
    }

    console.log("📊 [VELAS_GRAFICO] Actualizando datos:", {
      tienePayload: !!payload,
      esArray: Array.isArray(payload),
      arrayLength: Array.isArray(payload) ? payload.length : 'N/A',
      forceSimulated,
      range
    });

    let velasData = [];

    // Intentar obtener datos del payload primero
    if (!forceSimulated && payload && Array.isArray(payload)) {
      console.log("✅ [VELAS_GRAFICO] Usando datos reales del payload:", payload.length, "velas");
      
      // ==== AGREGAR ESTAS LÍNEAS ====
      // Aplicar filtro para hoy
      const todayPayload = filterDataByDate (payload, range);
      console.log(`📅 [VELAS_GRAFICO_FILTERED] ${payload.length} -> ${todayPayload.length} velas de hoy`);
      
      // Procesar los datos de velas
      velasData = todayPayload.map(item => {
        // Validar que tenga la estructura esperada
        if (item && 
            typeof item.time === 'number' && 
            typeof item.open === 'number' && 
            typeof item.high === 'number' && 
            typeof item.low === 'number' && 
            typeof item.close === 'number') {
          return {
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          };
        }
        console.warn("⚠️ [VELAS_GRAFICO] Vela inválida encontrada:", item);
        return null;
      }).filter(Boolean);

      console.log("✅ [VELAS_GRAFICO] Datos procesados:", velasData.length, "velas válidas");
    }

    // Si no hay datos reales, usar datos simulados
    if (velasData.length === 0) {
      console.log("🔄 [VELAS_GRAFICO] Usando datos simulados");
      velasData = generateFallbackVelasData(range);
    }

    // Sanitizar datos finales
    const sanitizedData = velasData
      .filter(candle => 
        candle && 
        Number.isFinite(candle.time) && 
        Number.isFinite(candle.open) && 
        Number.isFinite(candle.high) && 
        Number.isFinite(candle.low) && 
        Number.isFinite(candle.close)
      )
      .sort((a, b) => a.time - b.time);

    console.log("✅ [VELAS_GRAFICO] Datos finales listos:", sanitizedData.length, "velas");

    // Establecer los datos en el gráfico
    if (sanitizedData.length > 0) {
      try {
        console.log("🔄 [VELAS_GRAFICO] Estableciendo datos en el gráfico...");
        candlestickRef.current.setData(sanitizedData);
        
        // Ajustar la escala de tiempo para mostrar todos los datos
        if (sanitizedData.length >= 2) {
          console.log("🔄 [VELAS_GRAFICO] Ajustando escala de tiempo...");
          chartRef.current.timeScale().fitContent();
        }
        console.log("✅ [VELAS_GRAFICO] Datos establecidos en el gráfico correctamente");
      } catch (error) {
        console.error("💥 [VELAS_GRAFICO] Error estableciendo datos:", error);
      }
    } else {
      console.warn("⚠️ [VELAS_GRAFICO] No hay datos válidos para mostrar");
    }
  }, [payload, range, forceSimulated]);

return (
  <div
    ref={containerRef}
    className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
    style={{ height }}
  />
);
}