/**
 * app/components/VelasGrafico.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */

"use client";

/**
 * Gráfico de velas (candlesticks) basado en `lightweight-charts`.
 * Muestra datos en tiempo real provenientes del WebSocket.
 * No altera la funcionalidad existente; únicamente añade documentación.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * EXPECTATIVAS DE DATA
 * Cada vela debe tener la forma:
 * {
 *   time:  number (epoch seconds),
 *   open:  number,
 *   high:  number,
 *   low:   number,
 *   close: number
 * }
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PROPS
 * @typedef {Object} VelasGraficoProps
 * @property {Array<Candle>|undefined} payload     - Arreglo de velas proveniente de WS.
 * @property {number}                  [height=360]- Alto del chart en px.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'} [range='1D'] - Rango temporal usado para filtrar/ajustar.
 * @property {string}                  [title]     - Título visual/interno (no se renderiza aquí).
 *
 * @typedef {Object} Candle
 * @property {number} time
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
} from "lightweight-charts";

/**
 * Paleta de colores/estilos para el chart y la UI del tooltip.
 * (Solo estilos; no modifica la lógica del gráfico)
 */

const THEME = {
  bg: "transparent", // fondo del canvas
  text: "#9aa4b2", // color de texto general
  grid: "rgba(255,255,255,.06)",  // líneas de grilla
  cross: "rgba(255,255,255,.18)", // líneas del crosshair
  up: "#22c55e", // vela alcista
  down: "#ef4444", // vela bajista
  wickUp: "#22c55e", // mecha alcista
  wickDown: "#ef4444", // mecha bajista
  borderUp: "#22c55e", // borde alcista
  borderDown: "#ef4444", // borde bajista
};

/**
 * Opciones comunes a la serie de velas para simplificar la configuración.
 */

const COMMON_SERIES_OPTS = {
  lastValueVisible: false,
  priceLineVisible: false,
};

  /**
 * Filtra datos SOLO del día actual en zona horaria de Bogotá cuando `range` es "1D".
 * Para otros rangos, retorna la colección original sin cambios.
 *
 * @param {Array<Candle>} data
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 * @returns {Array<Candle>}
 */

const filterDataByDate = (data, range = "1D") => {
  if (range !== "1D" || !Array.isArray(data)) return data;
  
  try {
    // Fecha actual en Bogotá
    const nowBogota = new Date(new Date().toLocaleString("en-US", { 
      timeZone: "America/Bogota" 
    }));
    
    // Inicio del día (00:00:00) y fin del día (23:59:59) en Bogotá
    const startOfToday = new Date(nowBogota);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTimestamp = Math.floor(startOfToday.getTime() / 1000);
    
    // Calcular fin del día actual en Bogotá (23:59:59)
    const endOfToday = new Date(nowBogota);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayTimestamp = Math.floor(endOfToday.getTime() / 1000);
    
    console.log(`📅 [FILTER_BY_DATE_VELAS] Filtrando para HOY: ${startOfToday.toLocaleDateString("es-CO")}`);

    // Solo velas dentro del día actual (zona Bogotá)
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

  /**
 * Formatea un timestamp (epoch seconds) a fecha local de Bogotá legible.
 * Si recibe string, lo retorna tal cual.
 * @param {number|string} t
 * @returns {string}
 */

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

/* ───────────────────────────────── component ───────────────────────────────── */
export default function VelasGrafico({
  payload,
  height = 360,
  range = '1D',
  title = "Gráfico de Velas USD/COP",
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickRef = useRef(null);
  const tipRef = useRef(null);

   /**
   * Inicializa el chart una sola vez:
   * - crea el canvas
   * - agrega la serie de velas
   * - configura tooltip custom y listeners
   * - limpia recursos al desmontar
   */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    console.log("🚀 [VELAS] Inicializando gráfico de velas...");

    // Crear chart base
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

    // Crear serie de velas (mantiene la implementación existente)
    let candlestickSeries;
    try {
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

    // Tooltip flotante personalizado (DOM)
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

    // Listener para mover el tooltip con el crosshair
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
    
    // ResizeObserver para responsividad horizontal
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
    });
    ro.observe(el);

    chartRef.current = chart;
    candlestickRef.current = candlestickSeries;
    tipRef.current = tip;

    console.log("✅ [VELAS] Gráfico inicializado correctamente");

    // Limpieza de listeners, observer y DOM extra
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

  /**
   * Ajusta la altura del chart cuando cambia la prop `height`.
   */
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  /**
 * Inyecta datos en la serie:
 * - Usa `payload` (datos reales del WebSocket) y aplica filtro de "hoy" para 1D.
 * - Sanitiza y ordena por `time` ascendente antes de setear.
 * - Ajusta la escala de tiempo para encajar el contenido.
   */
useEffect(() => {
  if (!chartRef.current || !candlestickRef.current) {
    console.log("⏳ [VELAS_GRAFICO] Esperando inicialización del gráfico...");
    return;
  }

  console.log("📊 [VELAS_GRAFICO] Actualizando datos:", {
    tienePayload: !!payload,
    esArray: Array.isArray(payload),
    arrayLength: Array.isArray(payload) ? payload.length : 'N/A',
    range
  });

  // Solo procesar si hay datos reales disponibles
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    console.log("⏳ [VELAS_GRAFICO] Esperando datos reales...");
    return;
  }

  console.log("✅ [VELAS_GRAFICO] Usando datos reales del payload:", payload.length, "velas");
  
  // Filtro de "hoy" cuando el rango es 1D
  const todayPayload = filterDataByDate(payload, range);
  console.log(`📅 [VELAS_GRAFICO_FILTERED] ${payload.length} -> ${todayPayload.length} velas de hoy`);
  
  // Normalización/validación de estructura
  const velasData = todayPayload.map(item => {
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

  // Sanitizar y ordenar datos finales
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

  // Establecer datos en la serie y ajustar la escala
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
}, [payload, range]);
  // Contenedor del chart (canvas se monta dentro por lightweight-charts)
return (
  <div
    ref={containerRef}
    className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
    style={{ height }}
  />
);
}