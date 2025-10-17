// app/components/PrecioGrafica.jsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode, ColorType, LineSeries } from "lightweight-charts";

// ========== FUNCIONES DE PARSEO MEJORADAS ==========

// Función para normalizar números
const normalizeNumber = (x) => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(/\s+/g, "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

// Función mejorada para convertir HH:mm a timestamp
const hhmmToUnixTodayBogota = (hhmm) => {
  try {
    console.log(`⏰ [TIME_CONVERSION] Convirtiendo: ${hhmm}`);
    
    const [hh, mm] = String(hhmm).split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      console.warn(`❌ [TIME_CONVERSION] Formato inválido: ${hhmm}`);
      return null;
    }

    const now = new Date();
    const bogotaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
    
    const year = bogotaTime.getFullYear();
    const month = bogotaTime.getMonth();
    const day = bogotaTime.getDate();
    
    // Crear fecha en Bogotá con la hora especificada
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-05:00`;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // Fallback: usar UTC offset
      const fallbackDate = new Date(Date.UTC(year, month, day, hh + 5, mm, 0));
      const timestamp = isNaN(fallbackDate.getTime()) ? null : Math.floor(fallbackDate.getTime() / 1000);
      console.log(`🔄 [TIME_CONVERSION] Fallback usado: ${timestamp}`);
      return timestamp;
    }
    
    const timestamp = Math.floor(date.getTime() / 1000);
    console.log(`✅ [TIME_CONVERSION] ${hhmm} -> ${timestamp} (${new Date(timestamp * 1000).toLocaleString()})`);
    return timestamp;

  } catch (error) {
    console.error(`💥 [TIME_CONVERSION] Error con ${hhmm}:`, error);
    return null;
  }
};

// Función para convertir fecha completa a timestamp Bogotá
const fullDateToUnixBogota = (dateStr) => {
  try {
    console.log(`📅 [DATE_CONVERSION] Convirtiendo: ${dateStr}`);
    
    // Intentar diferentes formatos de fecha
    let date;
    
    if (dateStr.includes('-') && dateStr.includes(':')) {
      // Formato: YYYY-MM-DD HH:mm
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      date = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
    } else if (dateStr.includes('-')) {
      // Formato: YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(Date.UTC(year, month - 1, day, 12 + 5, 0, 0)); // Mediodía Bogotá
    } else {
      console.warn(`❌ [DATE_CONVERSION] Formato no reconocido: ${dateStr}`);
      return null;
    }

    if (isNaN(date.getTime())) {
      console.warn(`❌ [DATE_CONVERSION] Fecha inválida: ${dateStr}`);
      return null;
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    console.log(`✅ [DATE_CONVERSION] ${dateStr} -> ${timestamp}`);
    return timestamp;

  } catch (error) {
    console.error(`💥 [DATE_CONVERSION] Error con ${dateStr}:`, error);
    return null;
  }
};

// FUNCIÓN DE PARSEO PRINCIPAL - MEJORADA PARA EVITAR DUPLICADOS
const parseApiResponseToPoints = (apiResponse, range) => {
  try {
    console.log('🔍 [PARSE_API_RESPONSE] Iniciando parseo:', {
      range,
      tieneResponse: !!apiResponse,
      estructura: Object.keys(apiResponse || {})
    });

    if (!apiResponse) {
      console.warn('❌ [PARSE_API_RESPONSE] Response vacío');
      return [];
    }

    const points = [];
    const seenTimestamps = new Set();

    // CASO 1: Datos en formato datasets/labels (más común)
    if (apiResponse.datasets && apiResponse.labels) {
      console.log('📊 [PARSE_API_RESPONSE] Formato datasets/labels detectado');
      
      const datasets = apiResponse.datasets;
      const labels = apiResponse.labels;

      console.log(`📊 [PARSE_API_RESPONSE] Procesando ${labels.length} labels y ${datasets[0]?.data?.length || 0} datos`);

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const value = datasets[0]?.data?.[i];
        
        if (value === undefined || value === null) continue;

        const numericValue = normalizeNumber(value);
        if (!Number.isFinite(numericValue)) continue;

        let timestamp;

        // Determinar formato de timestamp basado en el rango y tipo de label
        if (range === '1D' && typeof label === 'string' && label.includes(':')) {
          // Formato HH:mm para 1D
          timestamp = hhmmToUnixTodayBogota(label);
        } else if (typeof label === 'string' && (label.includes('-') || label.includes(':'))) {
          // Formato de fecha completa para otros rangos
          timestamp = fullDateToUnixBogota(label);
        } else if (typeof label === 'number') {
          // Ya es timestamp
          timestamp = label;
        } else {
          // Fallback: generar timestamp basado en posición
          const now = Math.floor(Date.now() / 1000);
          const intervals = {
            '1D': 300, // 5 minutos
            '5D': 1800, // 30 minutos
            '1M': 86400, // 1 día
            '6M': 86400, // 1 día
            '1A': 86400 // 1 día
          };
          timestamp = now - ((labels.length - i) * (intervals[range] || 300));
        }

        if (timestamp && Number.isFinite(numericValue)) {
          // Evitar duplicados
          if (!seenTimestamps.has(timestamp)) {
            seenTimestamps.add(timestamp);
            points.push({
              t: timestamp,
              v: numericValue
            });
          } else {
            console.warn(`⚠️ [PARSE_API_RESPONSE] Timestamp duplicado omitido: ${timestamp} (${label})`);
          }
        }
      }
    }
    // CASO 2: Datos en formato array simple
    else if (Array.isArray(apiResponse)) {
      console.log('📊 [PARSE_API_RESPONSE] Formato array simple detectado');
      const now = Math.floor(Date.now() / 1000);
      
      for (let i = 0; i < apiResponse.length; i++) {
        const price = normalizeNumber(apiResponse[i]);
        if (Number.isFinite(price)) {
          let timestamp;
          switch (range) {
            case '1D':
              timestamp = now - ((apiResponse.length - i) * 300);
              break;
            case '5D':
              timestamp = now - ((apiResponse.length - i) * 1800);
              break;
            case '1M':
              timestamp = now - ((apiResponse.length - i) * 86400);
              break;
            case '6M':
              timestamp = now - ((apiResponse.length - i) * 86400);
              break;
            case '1A':
              timestamp = now - ((apiResponse.length - i) * 86400);
              break;
            default:
              timestamp = now - ((apiResponse.length - i) * 300);
          }
          
          if (!seenTimestamps.has(timestamp)) {
            seenTimestamps.add(timestamp);
            points.push({
              t: timestamp,
              v: price
            });
          }
        }
      }
    }
    // CASO 3: Datos en otros formatos
    else {
      console.warn('⚠️ [PARSE_API_RESPONSE] Estructura no reconocida, intentando extraer datos...');
      
      const possibleDataPaths = ['data', 'values', 'series', 'chartData', 'points'];
      for (const path of possibleDataPaths) {
        if (apiResponse[path] && Array.isArray(apiResponse[path])) {
          console.log(`📊 [PARSE_API_RESPONSE] Encontrados datos en: ${path}`);
          const arrayData = parseSimpleArrayResponse(apiResponse[path], range);
          // Eliminar duplicados del array simple también
          const uniqueArrayData = [];
          const arraySeen = new Set();
          for (const point of arrayData) {
            if (!arraySeen.has(point.t)) {
              arraySeen.add(point.t);
              uniqueArrayData.push(point);
            }
          }
          return uniqueArrayData;
        }
      }

      console.warn('❌ [PARSE_API_RESPONSE] No se pudo identificar la estructura de datos');
      return [];
    }

    console.log(`✅ [PARSE_API_RESPONSE] Parseados ${points.length} puntos (sin duplicados)`);
    
    // Ordenar por timestamp antes de retornar
    points.sort((a, b) => a.t - b.t);
    return points;

  } catch (error) {
    console.error('💥 [PARSE_API_RESPONSE] Error crítico:', error);
    return [];
  }
};

// Función para parsear array simple
const parseSimpleArrayResponse = (dataArray, range) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    console.warn('[SIMPLE_ARRAY] Datos no válidos o vacíos');
    return [];
  }

  console.log(`[SIMPLE_ARRAY] Procesando ${dataArray.length} puntos para rango ${range}`);

  const now = Math.floor(Date.now() / 1000);
  const points = [];
  
  for (let i = 0; i < dataArray.length; i++) {
    const price = normalizeNumber(dataArray[i]);
    if (Number.isFinite(price)) {
      // Generar timestamps realistas basados en el rango
      let timestamp;
      switch (range) {
        case '1D':
          timestamp = now - ((dataArray.length - i) * 300); // 5 min interval
          break;
        case '5D':
          timestamp = now - ((dataArray.length - i) * 1800); // 30 min interval
          break;
        case '1M':
          timestamp = now - ((dataArray.length - i) * 86400); // 1 day interval
          break;
        case '6M':
          timestamp = now - ((dataArray.length - i) * 86400); // 1 day interval
          break;
        case '1A':
          timestamp = now - ((dataArray.length - i) * 86400); // 1 day interval
          break;
        default:
          timestamp = now - ((dataArray.length - i) * 300);
      }
      
      points.push({
        t: timestamp,
        v: price
      });
    }
  }

  console.log(`[SIMPLE_ARRAY] Generados ${points.length} puntos`);
  return points;
};

const THEME = {
  bg: "transparent",
  text: "#9aa4b2",
  grid: "rgba(255,255,255,.06)",
  cross: "rgba(255,255,255,.18)",
  primary: "#22c55e",
  primaryTop: "rgba(34,197,94,.28)",
  primaryBottom: "rgba(34,197,94,.06)",
};

// Componente de Tooltip mejorado - ESTILOS CONSISTENTES
function ChartTooltip({ visible, price, time, x, y, pointCount }) {
  if (!visible) return null;

  const variation = price && pointCount > 1 ? ((price - 3900) / 3900 * 100) : 0; // Ejemplo de cálculo de variación
  const isPositive = variation >= 0;

  return (
    <div
      className="custom-tooltip"
      style={{
        position: 'fixed',
        padding: '12px',
        background: 'rgba(15, 23, 42, 0.98)',
        color: 'white',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: 1,
        transition: 'opacity 0.1s ease',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        minWidth: '180px',
        left: `${x + 15}px`,
        top: `${y - 80}px`,
        transform: 'none',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: '13px', 
          marginBottom: '2px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ color: 'white' }}>USD/COP</span>
          <span style={{ color: 'white', fontSize: '11px' }}>{time}</span>
        </div>
        <div style={{ color: 'white', fontSize: '11px' }}>
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
        <span style={{ color: 'white' }}>Precio:</span>
        <span style={{ textAlign: 'right', color: 'white', fontWeight: 500 }}>
          ${price?.toFixed(2) || '0.00'}
        </span>
        <span style={{ color: 'white' }}>Variación:</span>
        <span style={{ 
          textAlign: 'right', 
          color: isPositive ? '#10b981' : '#ef4444', 
          fontWeight: 600 
        }}>
          {isPositive ? '+' : ''}{variation.toFixed(2)}%
        </span>
        <span style={{ color: 'white' }}>Puntos:</span>
        <span style={{ textAlign: 'right', color: 'white', fontWeight: 500 }}>
          {pointCount}
        </span>
      </div>
    </div>
  );
}

export default function PrecioGrafica({
  payload,
  baseDay = null,
  title = "Cotización USD/COP",
  height = 360,
  range = "1D",
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    price: null,
    time: '',
    x: 0,
    y: 0,
    pointCount: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  // ✅ CORRECCIÓN: Añadir estado faltante
  const [usingDemoData, setUsingDemoData] = useState(false);

  // Debug detallado del payload
  useEffect(() => {
    console.log('🎯 [PAYLOAD_DETAILED]', {
      tienePayload: !!payload,
      range,
      estructura: payload?.chartData ? 'CHART_DATA' : 
                  payload?.datasets ? 'DATASETS' : 
                  payload?.data ? 'DATA_NESTED' : 
                  Array.isArray(payload) ? 'ARRAY_SIMPLE' : 'UNKNOWN',
      chartDataLength: payload?.chartData?.length || 0,
      datasetsLength: payload?.datasets?.length || 0,
      labelsLength: payload?.labels?.length || 0,
      dataValuesLength: payload?.datasets?.[0]?.data?.length || 0,
      arrayLength: Array.isArray(payload) ? payload.length : 0
    });

    if (payload?.chartData) {
      console.log('📊 [CHART_DATA_SAMPLE]', payload.chartData.slice(0, 3));
    }
    
    if (payload?.datasets) {
      console.log('📊 [DATASETS_SAMPLE]', {
        labels: payload.labels?.slice(0, 5),
        data: payload.datasets?.[0]?.data?.slice(0, 5)
      });
    }

    if (Array.isArray(payload)) {
      console.log('📊 [ARRAY_SAMPLE]', payload.slice(0, 5));
    }
  }, [payload, range]);

  // Montaje: crear chart + serie + tooltip
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth || 640,
      height,
      layout: {
        background: { type: ColorType.Solid, color: THEME.bg },
        textColor: THEME.text
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { 
          color: THEME.cross, 
          width: 1, 
          style: 3,
          labelBackgroundColor: THEME.primary 
        },
        horzLine: { 
          color: THEME.cross, 
          width: 1, 
          style: 3,
          labelBackgroundColor: THEME.primary 
        },
      },
    });

    const line = chart.addSeries(LineSeries, {
      color: THEME.primary,
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Tooltip personalizado
    chart.subscribeCrosshairMove(param => {
      if (!param.point || param.point.x < 0 || param.point.y < 0) {
        setTooltip(prev => ({ ...prev, visible: false }));
        return;
      }

      const seriesData = param.seriesData.get(line);
      if (seriesData) {
        const price = seriesData.value;
        const time = param.time;
        
        const timeStr = typeof time === 'number' 
          ? new Date(time * 1000).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Bogota'
            })
          : '';

        setTooltip({
          visible: true,
          price,
          time: timeStr,
          x: param.point.x,
          y: param.point.y,
          pointCount: seriesRef.current?.data?.length || 0
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    });

    chartRef.current = chart;
    seriesRef.current = line;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
      if (seriesRef.current?.data?.length > 1) {
        chart.timeScale().fitContent();
      }
    });
    ro.observe(el);

    return () => {
      try { ro.disconnect(); } catch (e) {}
      try { chart.remove(); } catch (e) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Altura reactiva
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  // Procesamiento de datos - CORREGIDO CON ORDENACIÓN Y ELIMINACIÓN DE DUPLICADOS
  const seriesData = useMemo(() => {
    console.log('🔄 [USE_MEMO] Procesando datos para gráfica...', {
      range,
      tienePayload: !!payload
    });

    let rawData = [];

    // CASO 1: Si el payload ya tiene chartData (formato procesado)
    if (payload?.chartData && Array.isArray(payload.chartData) && payload.chartData.length > 0) {
      console.log('✅ [USE_MEMO] Usando chartData directo:', payload.chartData.length, 'puntos');
      setUsingDemoData(false);
      rawData = payload.chartData.map(point => ({
        time: point.time || point.t,
        value: point.value || point.v
      }));
    }
    // CASO 2: Parsear datos crudos de la API
    else if (payload && (payload.datasets || Array.isArray(payload))) {
      console.log('🔧 [USE_MEMO] Parseando datos crudos de API');
      const parsedPoints = parseApiResponseToPoints(payload, range);
      
      if (parsedPoints.length > 0) {
        console.log(`✅ [USE_MEMO] Parseados ${parsedPoints.length} puntos desde API`);
        setUsingDemoData(false);
        rawData = parsedPoints.map(point => ({
          time: point.t,
          value: point.v
        }));
      }
    }
    // CASO 3: Fallback a datos demo
    else {
      console.log('🔄 [USE_MEMO] Usando datos de demostración');
      setUsingDemoData(true);
      
      // Generar datos demo más realistas
      const now = Math.floor(Date.now() / 1000);
      let interval, count, basePrice;

      switch(range) {
        case '1D':
          interval = 300; // 5 minutos
          count = 288; // 24 horas
          basePrice = 3880;
          break;
        case '5D':
          interval = 1800; // 30 minutos
          count = 240; // 5 días
          basePrice = 3870;
          break;
        case '1M':
          interval = 86400; // 1 día
          count = 30; // 30 días
          basePrice = 3850;
          break;
        case '6M':
          interval = 86400; // 1 día
          count = 180; // 180 días
          basePrice = 3800;
          break;
        case '1A':
          interval = 86400; // 1 día
          count = 365; // 365 días
          basePrice = 3750;
          break;
        default:
          interval = 300;
          count = 50;
          basePrice = 3880;
      }

      for (let i = 0; i < count; i++) {
        const time = now - ((count - i) * interval);
        const variation = (Math.random() - 0.5) * 20;
        basePrice += variation;
        // Mantener un rango realista
        basePrice = Math.max(3700, Math.min(3950, basePrice));
        rawData.push({ 
          time, 
          value: Number(basePrice.toFixed(2)) 
        });
      }
    }

    // 🔥 CORRECCIÓN CRÍTICA: Ordenar y eliminar duplicados
    if (rawData.length > 0) {
      // 1. Ordenar por tiempo (ascendente)
      rawData.sort((a, b) => a.time - b.time);
      
      // 2. Eliminar duplicados por timestamp
      const uniqueData = [];
      const seenTimestamps = new Set();
      
      for (const point of rawData) {
        if (!seenTimestamps.has(point.time)) {
          seenTimestamps.add(point.time);
          uniqueData.push(point);
        } else {
          console.warn(`⚠️ [DATA_CLEANING] Duplicado eliminado: timestamp ${point.time}`);
        }
      }
      
      console.log(`🧹 [DATA_CLEANING] Datos procesados: ${rawData.length} -> ${uniqueData.length} (eliminados ${rawData.length - uniqueData.length} duplicados)`);
      
      // 3. Verificar que estén ordenados correctamente
      let isSorted = true;
      for (let i = 1; i < uniqueData.length; i++) {
        if (uniqueData[i].time <= uniqueData[i-1].time) {
          isSorted = false;
          console.error(`❌ [DATA_CLEANING] Error de ordenación en índice ${i}: ${uniqueData[i].time} <= ${uniqueData[i-1].time}`);
          break;
        }
      }
      
      if (!isSorted) {
        console.error('❌ [DATA_CLEANING] Los datos no están ordenados correctamente');
        // Reordenar por si acaso
        uniqueData.sort((a, b) => a.time - b.time);
      }
      
      return uniqueData;
    }

    return [];
  }, [payload, range]);

  // Pintar datos en la serie
  useEffect(() => {
    const s = seriesRef.current;
    const chart = chartRef.current;
    
    if (!s || !chart) {
      console.log('⏸️ [RENDER] Serie o chart no disponibles');
      return;
    }

    if (!seriesData || seriesData.length === 0) {
      console.log('⏸️ [RENDER] No hay datos para renderizar');
      s.setData([]);
      return;
    }

    console.log('🎨 [RENDER] Renderizando datos:', {
      puntos: seriesData.length,
      primerPunto: seriesData[0],
      ultimoPunto: seriesData[seriesData.length - 1],
      usandoDemoData: usingDemoData
    });

    s.setData(seriesData);
    setLastUpdate(new Date()); // ✅ ACTUALIZAR TIMESTAMP

    const ts = chart.timeScale();
    if (ts && seriesData.length > 1) {
      requestAnimationFrame(() => {
        try {
          ts.fitContent();
          console.log('✅ [RENDER] Gráfico ajustado correctamente');
        } catch (e) {
          console.warn('⚠️ [RENDER] Error ajustando escala:', e);
        }
      });
    }
  }, [seriesData, usingDemoData]);

  return (
    <div className="w-full h-full relative">
      {/* Header con información del estado - SIMILAR A VELASGRAFICO */}

      {/* Contenedor del gráfico */}
      <div
        ref={containerRef}
        className="w-full h-full relative border border-slate-700 rounded-lg bg-slate-900/50"
        style={{ height: `${height}px` }}
      />
      
      {/* Tooltip personalizado */}
      <ChartTooltip {...tooltip} />
    </div>
  );
}