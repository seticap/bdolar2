// app/components/BollingerGrafico.jsx - VERSIÓN CORREGIDA
"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, CrosshairMode } from "lightweight-charts";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";

const THEME = {
  bg: "transparent",
  text: "#9aa4b2",
  grid: "rgba(255,255,255,.06)",
  cross: "rgba(255,255,255,.18)",
  price: "#ef4444",
  sma: "#22c55e",
  upperBand: "rgba(59, 130, 246, 0.6)",
  lowerBand: "rgba(59, 130, 246, 0.6)",
};

const COMMON_SERIES_OPTS = { lastValueVisible: false, priceLineVisible: false };

// Función para ordenar y eliminar datos duplicados por timestamp
const sortAndDeduplicateData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  // Ordenar por tiempo (ascendente)
  const sorted = [...data].sort((a, b) => a.time - b.time);
  
  // Eliminar duplicados por timestamp
  const uniqueData = [];
  const seenTimestamps = new Set();
  
  for (const item of sorted) {
    if (!seenTimestamps.has(item.time)) {
      seenTimestamps.add(item.time);
      uniqueData.push(item);
    } else {
      console.warn(`⚠️ [DEDUPE] Eliminando timestamp duplicado: ${item.time}`);
    }
  }
  
  console.log(`✅ [DEDUPE] De ${data.length} a ${uniqueData.length} puntos únicos`);
  return uniqueData;
};

// Función para diagnosticar problemas de orden en los datos
const diagnoseDataOrder = (data, seriesName = "unknown") => {
  if (!Array.isArray(data)) {
    console.warn(`❌ [DIAGNOSE_${seriesName}] Datos no son un array`);
    return;
  }

  let issues = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].time < data[i - 1].time) {
      console.warn(`⚠️ [DIAGNOSE_${seriesName}] Datos desordenados en índice ${i}: ${data[i].time} < ${data[i - 1].time}`);
      issues++;
    }
    if (data[i].time === data[i - 1].time) {
      console.warn(`⚠️ [DIAGNOSE_${seriesName}] Timestamp duplicado en índice ${i}: ${data[i].time}`);
      issues++;
    }
  }

  if (issues === 0) {
    console.log(`✅ [DIAGNOSE_${seriesName}] Datos correctamente ordenados`);
  } else {
    console.warn(`❌ [DIAGNOSE_${seriesName}] Se encontraron ${issues} problemas de orden`);
  }
};

// Función para convertir HH:mm a timestamp de hoy en Bogotá
const hhmmToUnixTodayBogota = (hhmm) => {
  try {
    const [hh, mm] = String(hhmm).split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      return null;
    }

    // Obtener la fecha actual en Bogotá
    const now = new Date();
    const todayBogota = new Date(
      now.toLocaleString("en-US", {
        timeZone: "America/Bogota",
      })
    );

    // Establecer la hora específica
    todayBogota.setHours(hh, mm, 0, 0);

    // Convertir a timestamp Unix
    return Math.floor(todayBogota.getTime() / 1000);
  } catch (error) {
    console.error(`💥 Error convirtiendo hora ${hhmm}:`, error);
    return null;
  }
};

// Función para convertir labels a timestamps
const convertLabelsToTimestamps = (labels) => {
  return labels.map(label => {
    // Si ya es un timestamp numérico, usarlo directamente
    if (typeof label === 'number' && label > 1000000000) {
      return label;
    }
    
    // Si es string en formato HH:mm, convertirlo
    if (typeof label === 'string' && label.includes(':')) {
      const timestamp = hhmmToUnixTodayBogota(label);
      return timestamp || Date.now() / 1000; // Fallback si la conversión falla
    }
    
    // Si es string en formato de fecha, intentar parsearlo
    if (typeof label === 'string') {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000);
      }
    }
    
    // Fallback: usar timestamp actual
    console.warn(`⚠️ No se pudo convertir label: ${label}`);
    return Math.floor(Date.now() / 1000);
  });
};

export default function BollingerGrafico({
  range = "1D",
  height = 360,
  maxPoints = null,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceRef = useRef(null);
  const sma20Ref = useRef(null);
  const upperRef = useRef(null);
  const lowerRef = useRef(null);
  const tipRef = useRef(null);

  const context = useWebSocketDataGrafico();
  const { useChartPayload } = context || {};
  const bollingerData = useChartPayload ? useChartPayload(1004, range) : null;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
        secondsVisible: false,
        borderVisible: false,
        tickMarkFormatter: (time) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString("es-CO", {
            timeZone: "America/Bogota",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
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

    // Crear series en el orden correcto
    const price = addLine({
      color: THEME.price,
      lineWidth: 2,
      ...COMMON_SERIES_OPTS,
    });
    const sma20 = addLine({
      color: THEME.sma,
      lineWidth: 2,
      ...COMMON_SERIES_OPTS,
    });
    const upper = addLine({
      color: THEME.upperBand,
      lineWidth: 1,
      lineStyle: 2, // Dashed line
      ...COMMON_SERIES_OPTS,
    });
    const lower = addLine({
      color: THEME.lowerBand,
      lineWidth: 1,
      lineStyle: 2, // Dashed line
      ...COMMON_SERIES_OPTS,
    });

    // Tooltip
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
      minWidth: "200px",
    });
    el.style.position = "relative";
    el.appendChild(tip);

    const row = (color, label, v) =>
      v == null
        ? ""
        : `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
         <span style="width:10px;height:10px;border-radius:2px;background:${color};display:inline-block;"></span>
         <span>${label}: <b>${Number(v).toLocaleString("es-CO")}</b></span>
       </div>`;

    const onMove = (param) => {
      if (!param?.time || !param.point) return (tip.style.display = "none");
      
      const p = param.seriesData.get(price)?.value;
      const s = param.seriesData.get(sma20)?.value;
      const up = param.seriesData.get(upper)?.value;
      const lo = param.seriesData.get(lower)?.value;
      
      if (p == null && s == null && up == null && lo == null)
        return (tip.style.display = "none");

      const exactTime = new Date(param.time * 1000).toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      tip.innerHTML = `
        <div style="font-weight:600;margin-bottom:2px;color:#fff;">${exactTime}</div>
        ${row(THEME.price, "Precio", p)}
        ${row(THEME.sma, "SMA 20", s)}
        ${row(THEME.upperBand, "Banda Superior", up)}
        ${row(THEME.lowerBand, "Banda Inferior", lo)}
      `;
      tip.style.display = "block";
      tip.style.left = `${Math.min(
        param.point.x + 12,
        el.clientWidth - 260
      )}px`;
      tip.style.top = `${param.point.y + 12}px`;
    };
    chart.subscribeCrosshairMove(onMove);

    // Responsividad
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    // Guardar referencias
    chartRef.current = chart;
    priceRef.current = price;
    sma20Ref.current = sma20;
    upperRef.current = upper;
    lowerRef.current = lower;
    tipRef.current = tip;

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el.contains(tipRef.current))
        el.removeChild(tipRef.current);
      chart.remove();
      chartRef.current =
        priceRef.current =
        sma20Ref.current =
        upperRef.current =
        lowerRef.current =
        tipRef.current =
          null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions({ height });
  }, [height]);

// EFECTO PRINCIPAL CORREGIDO - Procesamiento de datos
useEffect(() => {
  if (!chartRef.current || !bollingerData) return;

  console.log("📊 [BOLLINGER] Procesando datos:", bollingerData);

  const { labels, datasets } = bollingerData;

  if (!labels || !datasets || datasets.length < 4) {
    console.warn("❌ [BOLLINGER] Estructura de datos incompleta");
    return;
  }

  // EXTRAER DATOS EN EL ORDEN CORRECTO según la nueva estructura
  const priceData = datasets[0]?.data || [];
  const smaData = datasets[1]?.data || [];
  const upperData = datasets[2]?.data || [];
  const lowerData = datasets[3]?.data || [];

  console.log("📊 [BOLLINGER] Datasets encontrados:", {
    precio: priceData.length,
    sma: smaData.length,
    superior: upperData.length,
    inferior: lowerData.length,
    labels: labels.length
  });

  // CORRECCIÓN: Convertir labels a timestamps
  const timestampLabels = convertLabelsToTimestamps(labels);
  console.log("🕒 [BOLLINGER] Labels convertidos a timestamps:", timestampLabels.slice(0, 5));

  // Convertir a formato de series CON TIMESTAMPS
  const priceSeries = timestampLabels
    .map((timestamp, index) => ({
      time: timestamp,
      value: priceData[index]
    }))
    .filter(point => point.value != null && point.value !== 0);

  const smaSeries = timestampLabels
    .map((timestamp, index) => ({
      time: timestamp,
      value: smaData[index]
    }))
    .filter(point => point.value != null && point.value !== 0);

  const upperSeries = timestampLabels
    .map((timestamp, index) => ({
      time: timestamp,
      value: upperData[index]
    }))
    .filter(point => point.value != null && point.value !== 0);

  const lowerSeries = timestampLabels
    .map((timestamp, index) => ({
      time: timestamp,
      value: lowerData[index]
    }))
    .filter(point => point.value != null && point.value !== 0);

  console.log("📊 [BOLLINGER] Series procesadas:", {
    precio: priceSeries.length,
    sma: smaSeries.length,
    superior: upperSeries.length,
    inferior: lowerSeries.length
  });

  // VERIFICAR ORDEN Y DUPLICADOS
  console.log("🔍 [BOLLINGER] Verificando orden de datos...");
  
  // Verificar si hay timestamps duplicados en priceSeries
  const priceTimestamps = priceSeries.map(p => p.time);
  const uniquePriceTimestamps = [...new Set(priceTimestamps)];
  
  if (priceTimestamps.length !== uniquePriceTimestamps.length) {
    console.warn(`⚠️ [BOLLINGER] Se encontraron ${priceTimestamps.length - uniquePriceTimestamps.length} timestamps duplicados en priceSeries`);
  }

  // Verificar si los datos están ordenados
  const isPriceSorted = priceSeries.every((point, index, array) => 
    index === 0 || point.time >= array[index - 1].time
  );
  
  if (!isPriceSorted) {
    console.warn("⚠️ [BOLLINGER] Los datos de precio no están ordenados, ordenando...");
  }

  try {
    // Limpiar datos existentes
    priceRef.current.setData([]);
    sma20Ref.current.setData([]);
    upperRef.current.setData([]);
    lowerRef.current.setData([]);

    // APLICAR ORDENAMIENTO Y ELIMINAR DUPLICADOS
    const sortedPriceSeries = sortAndDeduplicateData(priceSeries);
    const sortedSmaSeries = sortAndDeduplicateData(smaSeries);
    const sortedUpperSeries = sortAndDeduplicateData(upperSeries);
    const sortedLowerSeries = sortAndDeduplicateData(lowerSeries);

    // Diagnóstico de datos
    diagnoseDataOrder(sortedPriceSeries, "PRICE");

    // Establecer nuevos datos SOLO si hay datos válidos
    if (sortedPriceSeries.length > 0) {
      priceRef.current.setData(sortedPriceSeries);
      console.log(`✅ [BOLLINGER] ${sortedPriceSeries.length} puntos de precio establecidos`);
    } else {
      console.warn("⚠️ [BOLLINGER] No hay datos válidos para la serie de precio");
    }

    if (sortedSmaSeries.length > 0) {
      sma20Ref.current.setData(sortedSmaSeries);
    }

    if (sortedUpperSeries.length > 0) {
      upperRef.current.setData(sortedUpperSeries);
    }

    if (sortedLowerSeries.length > 0) {
      lowerRef.current.setData(sortedLowerSeries);
    }

    // Ajustar la escala de tiempo solo si hay datos
    if (sortedPriceSeries.length > 0) {
      chartRef.current.timeScale().fitContent();
      console.log("✅ [BOLLINGER] Gráfico actualizado correctamente");
    } else {
      console.warn("⚠️ [BOLLINGER] No hay datos para mostrar en el gráfico");
    }
  } catch (error) {
    console.error("💥 [BOLLINGER] Error actualizando gráfico:", error);
    
    // Diagnóstico adicional del error
    if (error.message.includes("asc ordered")) {
      console.error("🔍 [BOLLINGER_DIAGNOSTIC] Diagnóstico de datos problemáticos:");
      priceSeries.forEach((point, index) => {
        if (index > 0 && point.time < priceSeries[index - 1].time) {
          console.error(`   Índice ${index}: tiempo=${point.time}, anterior=${priceSeries[index - 1].time} - NO ORDENADO`);
        } else if (index > 0 && point.time === priceSeries[index - 1].time) {
          console.error(`   Índice ${index}: tiempo=${point.time}, anterior=${priceSeries[index - 1].time} - DUPLICADO`);
        }
      });
    }
  }
}, [bollingerData, range, maxPoints]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
      style={{ height }}
    />
  );
}