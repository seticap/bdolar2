/**
 * app/components/PrecioGrafica.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
"use client";

/**
 * Gráfico de línea para la cotización USD/COP usando `lightweight-charts`.
 *
 * Esta versión **solo agrega documentación y comentarios**; no modifica la lógica existente.
 *
 * Capaz de:
 *  - Normalizar distintos formatos de `payload` (datasets/labels, arrays simples, estructuras anidadas)
 *  - Convertir etiquetas de tiempo (HH:mm, YYYY-MM-DD, YYYY-MM-DD HH:mm) a epoch seconds en zona Bogotá
 *  - Eliminar duplicados por timestamp y ordenar datos antes de renderizar
 *  - Mostrar un tooltip flotante rico en información, estilizado y consistente con la app
 *  - Ajustar automáticamente la escala de tiempo al contenido
 *
 * ESTRUCTURAS DE PAYLOAD SOPORTADAS
 * 1) { labels: [...], datasets: [{ data: [...] }] }
 * 2) Array<number|string>  (valores directos)
 * 3) { chartData: [{ time|t, value|v }, ...] } (ya normalizado)
 * 4) Otras estructuras con arrays dentro de propiedades comunes: data, values, series, chartData, points
 *
 * PROPS
 * @typedef {Object} PrecioGraficaProps
 * @property {any}      payload                 - Datos crudos o normalizados (ver formatos arriba).
 * @property {any}      [baseDay=null]          - Semilla opcional (no usada en esta implementación).
 * @property {string}   [title="Cotización USD/COP"] - Título semántico (no renderizado aquí).
 * @property {number}   [height=360]            - Alto del gráfico en píxeles.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'} [range="1D"] - Rango temporal que guía el parseo/espaciado.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createChart, CrosshairMode, ColorType, LineSeries } from "lightweight-charts";

/* ──────────────────────────── PARSEO Y UTILIDADES ──────────────────────────── */

/**
 * Normaliza números que pueden venir como string con separadores/espacios → number.
 * @param {number|string} x
 * @returns {number} NaN si no puede normalizar
 */

const normalizeNumber = (x) => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(/\s+/g, "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

/**
 * Convierte una hora "HH:mm" del día actual en Bogotá a epoch seconds.
 * Incluye validaciones y un fallback si el constructor de Date falla.
 * @param {string} hhmm
 * @returns {number|null}
 */
const hhmmToUnixTodayBogota = (hhmm) => {
  try {
    console.log(` [TIME_CONVERSION] Convirtiendo: ${hhmm}`);
    
    const [hh, mm] = String(hhmm).split(":").map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      console.warn(` [TIME_CONVERSION] Formato inválido: ${hhmm}`);
      return null;
    }

    const now = new Date();
    const bogotaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
    
    const year = bogotaTime.getFullYear();
    const month = bogotaTime.getMonth();
    const day = bogotaTime.getDate();
    
    // Intento principal: string con offset -05:00 (hora estándar Colombia)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-05:00`;
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // Fallback: construir con UTC sumando offset
      const fallbackDate = new Date(Date.UTC(year, month, day, hh + 5, mm, 0));
      const timestamp = isNaN(fallbackDate.getTime()) ? null : Math.floor(fallbackDate.getTime() / 1000);
      console.log(` [TIME_CONVERSION] Fallback usado: ${timestamp}`);
      return timestamp;
    }
    
    const timestamp = Math.floor(date.getTime() / 1000);
    console.log(` [TIME_CONVERSION] ${hhmm} -> ${timestamp} (${new Date(timestamp * 1000).toLocaleString()})`);
    return timestamp;

  } catch (error) {
    console.error(` [TIME_CONVERSION] Error con ${hhmm}:`, error);
    return null;
  }
};

/**
 * Convierte "YYYY-MM-DD" o "YYYY-MM-DD HH:mm" a epoch seconds aproximado a Bogotá (offset -05).
 * - Si solo hay fecha, usa 12:00 (mediodía) en Bogotá para ubicar el punto.
 * @param {string} dateStr
 * @returns {number|null}
 */

const fullDateToUnixBogota = (dateStr) => {
  try {
    console.log(` [DATE_CONVERSION] Convirtiendo: ${dateStr}`);
    
    // Intentar diferentes formatos de fecha
    let date;
    
    if (dateStr.includes('-') && dateStr.includes(':')) {
      // Formato: YYYY-MM-DD HH:mm
      const [datePart, timePart] = dateStr.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      // Ajuste UTC considerando offset -05 para obtener timestamp consistente
      date = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
    } else if (dateStr.includes('-')) {
      // Formato: YYYY-MM-DD → usar mediodía para representatividad
      const [year, month, day] = dateStr.split('-').map(Number);
      date = new Date(Date.UTC(year, month - 1, day, 12 + 5, 0, 0)); // Mediodía Bogotá
    } else {
      console.warn(` [DATE_CONVERSION] Formato no reconocido: ${dateStr}`);
      return null;
    }

    if (isNaN(date.getTime())) {
      console.warn(` [DATE_CONVERSION] Fecha inválida: ${dateStr}`);
      return null;
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    console.log(` [DATE_CONVERSION] ${dateStr} -> ${timestamp}`);
    return timestamp;

  } catch (error) {
    console.error(` [DATE_CONVERSION] Error con ${dateStr}:`, error);
    return null;
  }
};

/**
 * Parsea la respuesta de API (flexible) a puntos { t, v } sin duplicados ni valores inválidos.
 * - Detecta estructuras datasets/labels, arrays puros, u otras rutas posibles.
 * - Genera timestamps razonables basados en el `range` cuando no hay información temporal explícita.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 * @returns {{t:number, v:number}[]}
 */

const parseApiResponseToPoints = (apiResponse, range) => {
  try {
    console.log(' [PARSE_API_RESPONSE] Iniciando parseo:', {
      range,
      tieneResponse: !!apiResponse,
      estructura: Object.keys(apiResponse || {})
    });

    if (!apiResponse) {
      console.warn(' [PARSE_API_RESPONSE] Response vacío');
      return [];
    }

    const points = [];
    const seenTimestamps = new Set();

    // CASO 1: Estructura típica datasets/labels
    if (apiResponse.datasets && apiResponse.labels) {
      console.log(' [PARSE_API_RESPONSE] Formato datasets/labels detectado');
      
      const datasets = apiResponse.datasets;
      const labels = apiResponse.labels;

      console.log(` [PARSE_API_RESPONSE] Procesando ${labels.length} labels y ${datasets[0]?.data?.length || 0} datos`);

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
           // Evitar duplicados por timestamp exacto
          if (!seenTimestamps.has(timestamp)) {
            seenTimestamps.add(timestamp);
            points.push({
              t: timestamp,
              v: numericValue
            });
          } else {
            console.warn(` [PARSE_API_RESPONSE] Timestamp duplicado omitido: ${timestamp} (${label})`);
          }
        }
      }
    }
    // CASO 2: Array simple de valores
    else if (Array.isArray(apiResponse)) {
      console.log(' [PARSE_API_RESPONSE] Formato array simple detectado');
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
      console.warn(' [PARSE_API_RESPONSE] Estructura no reconocida, intentando extraer datos...');
      
      const possibleDataPaths = ['data', 'values', 'series', 'chartData', 'points'];
      for (const path of possibleDataPaths) {
        if (apiResponse[path] && Array.isArray(apiResponse[path])) {
          console.log(` [PARSE_API_RESPONSE] Encontrados datos en: ${path}`);
          const arrayData = parseSimpleArrayResponse(apiResponse[path], range);
          // También evitar duplicados en este camino
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

      console.warn(' [PARSE_API_RESPONSE] No se pudo identificar la estructura de datos');
      return [];
    }

    console.log(` [PARSE_API_RESPONSE] Parseados ${points.length} puntos (sin duplicados)`);
    
    // Ordenar por timestamp antes de retornar
    points.sort((a, b) => a.t - b.t);
    return points;

  } catch (error) {
    console.error(' [PARSE_API_RESPONSE] Error crítico:', error);
    return [];
  }
};

/**
 * Variante de parseo cuando nos pasan un array simple de valores.
 * Genera timestamps razonables según el `range`.
 * @param {Array<number|string>} dataArray
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 * @returns {{t:number, v:number}[]}
 */

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
      // Timestamps aproximados por rango
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

/* ──────────────────────────────── THEME ──────────────────────────────── */

/**
 * Paleta y estilos del chart.
 */
const THEME = {
  bg: "transparent",
  text: "#9aa4b2",
  grid: "rgba(255,255,255,.06)",
  cross: "rgba(255,255,255,.18)",
  primary: "#22c55e",
  primaryTop: "rgba(34,197,94,.28)",
  primaryBottom: "rgba(34,197,94,.06)",
};

/* ───────────────────────────── Tooltip UI ───────────────────────────── */

/**
 * Tooltip flotante del gráfico.
 * Presenta precio, hora, fecha descriptiva, variación (base 3900 como ejemplo) y conteo de puntos.
 * @param {{ visible:boolean, price:number|null, time:string, x:number, y:number, pointCount:number }} props
 */
function ChartTooltip({ visible, price, time, x, y, pointCount }) {
  if (!visible) return null;

    // Nota: variación ilustrativa, puede ajustarse según tu lógica real
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

/* ─────────────────────────── Componente Principal ─────────────────────────── */

/**
 * Componente de gráfico de precio (línea).
 * - Crea y gestiona el chart (montaje, tamaño, crosshair/tooltip)
 * - Normaliza y pinta data con `useMemo` + `useEffect`
 * @param {PrecioGraficaProps} props
 */
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
  /** Estado del tooltip custom (controlado por crosshair) */
 const [tooltip, setTooltip] = useState({
    visible: false,
    price: null,
    time: '',
    x: 0,
    y: 0,
    pointCount: 0
  });
   /** Marca temporal del último render de datos (útil para debugging) */
  const [lastUpdate, setLastUpdate] = useState(null);
  

  // Debug detallado del payload
  useEffect(() => {
    console.log('[PAYLOAD_DETAILED]', {
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
      console.log('[CHART_DATA_SAMPLE]', payload.chartData.slice(0, 3));
    }
    
    if (payload?.datasets) {
      console.log('[DATASETS_SAMPLE]', {
        labels: payload.labels?.slice(0, 5),
        data: payload.datasets?.[0]?.data?.slice(0, 5)
      });
    }

    if (Array.isArray(payload)) {
      console.log('[ARRAY_SAMPLE]', payload.slice(0, 5));
    }
  }, [payload, range]);

   /**
   * Montaje del chart:
   * - Inicializa el gráfico y la serie de línea
   * - Configura crosshair → tooltip reactivo
   * - Observa ancho del contenedor para responsividad horizontal
   */
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

    // Tooltip a partir del crosshair
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

 // ResizeObserver: actualiza ancho y ajusta contenido
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth });
      if (seriesRef.current?.data?.length > 1) {
        chart.timeScale().fitContent();
      }
    });
    ro.observe(el);

    // Limpieza
    return () => {
      try { ro.disconnect(); } catch (e) {}
      try { chart.remove(); } catch (e) {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  /**
   * Ajusta la altura del chart si cambia la prop `height`.
   */
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

   /**
   * Memo de transformación de `payload` → `seriesData` listo para `setData`:
   * - Usa `chartData` si ya viene normalizado
   * - Si no, parsea estructuras crudas con `parseApiResponseToPoints`
   * - Ordena asc y elimina duplicados por timestamp
   */
  const seriesData = useMemo(() => {
    console.log(' [USE_MEMO] Procesando datos para gráfica...', {
      range,
      tienePayload: !!payload
    });

    let rawData = [];

    // CASO 1: Si el payload ya tiene chartData (formato procesado)
    if (payload?.chartData && Array.isArray(payload.chartData) && payload.chartData.length > 0) {
      console.log(' [USE_MEMO] Usando chartData directo:', payload.chartData.length, 'puntos');
      rawData = payload.chartData.map(point => ({
        time: point.time || point.t,
        value: point.value || point.v
      }));
    }
    // CASO 2: parsear datos crudos (datasets/labels o arrays)
    else if (payload && (payload.datasets || Array.isArray(payload))) {
      console.log(' [USE_MEMO] Parseando datos crudos de API');
      const parsedPoints = parseApiResponseToPoints(payload, range);
      
      if (parsedPoints.length > 0) {
        console.log(` [USE_MEMO] Parseados ${parsedPoints.length} puntos desde API`);
        rawData = parsedPoints.map(point => ({
          time: point.t,
          value: point.v
        }));
      }
    }

      // Ordenar + eliminar duplicados por timestamp
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
          console.warn(` [DATA_CLEANING] Duplicado eliminado: timestamp ${point.time}`);
        }
      }
      
      console.log(`[DATA_CLEANING] Datos procesados: ${rawData.length} -> ${uniqueData.length} (eliminados ${rawData.length - uniqueData.length} duplicados)`);
      
      // 3. Verificación de orden ascendente (sanidad)
      let isSorted = true;
      for (let i = 1; i < uniqueData.length; i++) {
        if (uniqueData[i].time <= uniqueData[i-1].time) {
          isSorted = false;
          console.error(` [DATA_CLEANING] Error de ordenación en índice ${i}: ${uniqueData[i].time} <= ${uniqueData[i-1].time}`);
          break;
        }
      }
      
      if (!isSorted) {
        console.error(' [DATA_CLEANING] Los datos no están ordenados correctamente');
        // Reordenar por si acaso
        uniqueData.sort((a, b) => a.time - b.time);
      }
      
      return uniqueData;
    }

    return [];
  }, [payload, range]);

  /**
   * Pinta los datos en la serie y ajusta la escala de tiempo.
   * Se dispara cuando cambia `seriesData`.
   */
useEffect(() => {
  const s = seriesRef.current;
  const chart = chartRef.current;
  
  if (!s || !chart) {
    console.log('[RENDER] Serie o chart no disponibles');
    return;
  }

  if (!seriesData || seriesData.length === 0) {
    console.log(' [RENDER] No hay datos para renderizar');
    s.setData([]);
    return;
  }

  console.log(' [RENDER] Renderizando datos:', {
    puntos: seriesData.length,
    primerPunto: seriesData[0],
    ultimoPunto: seriesData[seriesData.length - 1]
  });

  s.setData(seriesData);
  setLastUpdate(new Date());

  const ts = chart.timeScale();
  if (ts && seriesData.length > 1) {
    requestAnimationFrame(() => {
      try {
        ts.fitContent();
        console.log(' [RENDER] Gráfico ajustado correctamente');
      } catch (e) {
        console.warn(' [RENDER] Error ajustando escala:', e);
      }
    });
  }
}, [seriesData]); 

// Contenedor del gráfico + tooltip
  return (
    <div className="w-full h-full relative">

      {/* Contenedor del gráfico */}
      <div
        ref={containerRef}
        className="w-full h-full relative border border-slate-700 rounded-lg bg-slate-900/50"
        style={{ height: `${height}px` }}
      />
      
      {/* Tooltip personalizado controlado por estado */}
      <ChartTooltip {...tooltip} />
    </div>
  );
}