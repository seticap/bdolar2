// app/components/PromedioGrafico.jsx
"use client";

/**
 * Gráfico de promedio y medias móviles (Area + Line) usando `lightweight-charts`.
 * Muestra una serie principal (precio/promedio) y dos SMAs (8 y 13).
 * Esta versión SOLO agrega documentación/comentarios sin alterar la funcionalidad.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * ESTRUCTURA DE `data` ESPERADA (flexible con `getBlock`):
 * Puede llegar en varias profundidades, pero al final se normaliza a:
 * {
 *   labels: Array<number|string>,      // timestamps (s|ms), YYYY-MM-DD o HH:mm
 *   datasets: [
 *     { label: 'Precio' | 'Promedio', data: number[] },   // Serie principal (area)
 *     { label: 'SMA 8', data: number[] },                 // Línea SMA 8
 *     { label: 'SMA 13', data: number[] },                // Línea SMA 13
 *   ]
 * }
 *
 * `getBlock` busca esta forma en: data.data.data, data.data, o el root.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PROPS
 * @typedef {Object} PromedioGraficoProps
 * @property {any}   data                 - Estructura de datos con labels/datasets (ver arriba).
 * @property {number}[height=360]         - Alto del gráfico en px.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'} [range='1D'] - Rango temporal para filtrado visual.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CrosshairMode,
} from "lightweight-charts";

/**
 * Paleta visual para el chart y tooltip.
 */

const THEME = {
  bg: "transparent", // fondo del chart
  text: "#9aa4b2", // color de texto
  grid: "rgba(255,255,255,.06)", // color de grilla
  cross: "rgba(255,255,255,.18)", // crosshair
  primary: "#22c55e", // color de línea principal
  primaryTop: "rgba(34,197,94,.28)", // degradado superior área
  primaryBottom: "rgba(34,197,94,.06)", // degradado inferior área
  line8: "#22c55e",   // SMA 8
  line13: "#f59e0b",  // SMA 13
};

/**
 * Opciones comunes de series (ocultar línea de último valor).
 */

const COMMON_SERIES_OPTS = {
  lastValueVisible: false,
  priceLineVisible: false,
};

/* ─────────────────────────────── utils ─────────────────────────────── */

/**
 * Normaliza la entrada `data` y localiza { labels, datasets } independiente
 * de cuántos niveles de anidación tenga (data, data.data, data.data.data).
 * @param {any} input
 * @returns {{ labels: any[]; datasets: { label?: string; data: number[] }[] } | null}
 */

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

/** Valida patrón YYYY-MM-DD (no se usa directamente, mantenido por compatibilidad) */
const isYmd = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);


/**
 * Convierte una fecha completa (string) a epoch seconds en zona Bogotá.
 * @param {string} dateString
 * @returns {number}
 */

function fullDateToUnixBogota(dateString) {
  try {
    const date = new Date(dateString);
    const bogotaDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Bogota" }));
    return Math.floor(bogotaDate.getTime() / 1000);
  } catch (error) {
    console.error("Error converting date:", error);
    return 0;
  }
}

/**
 * Convierte "HH:mm" (o "HH:mm:ss") de HOY a epoch seconds en zona Bogotá.
 * @param {string} timeString
 * @returns {number}
 */

function hhmmToUnixTodayBogota(timeString) {
  try {
    const now = new Date();
    const today = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const [hours, minutes] = timeString.split(':').map(Number);
    today.setHours(hours, minutes || 0, 0, 0);
    return Math.floor(today.getTime() / 1000);
  } catch (error) {
    console.error("Error converting time:", error);
    return 0;
  }
}

/**
 * Normaliza `labels` a timestamps (epoch seconds):
 * - number: asume segundos (si > 1e12, convierte de ms a s)
 * - "YYYY-MM-DD": usa 12:00 Bogotá del mismo día
 * - "HH:mm[:ss]": usa la hora de HOY (Bogotá)
 * - otro string: intenta parseo y si falla, usa índice
 * @param {Array<string|number>} labels
 * @returns {number[]}
 */

function makeTimes(labels = []) {
  if (!labels.length) return [];

  return labels.map((l, i) => {
    if (typeof l === "number") {
      return l > 1e12 ? Math.floor(l / 1000) : l;
    }
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

/**
 * Une arrays de times y values en puntos { time, value } sanitizados.
 * @param {number[]} times
 * @param {Array<number|string>} values
 * @returns {{time:number,value:number}[]}
 */

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

/**
 * Formatea un timestamp (s) a hora local Bogotá HH:mm:ss.
 * Si recibe string, lo retorna tal cual.
 * @param {number|string} t
 * @returns {string}
 */

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

/**
 * Filtra puntos por `range` relativo al último timestamp, elimina duplicados
 * y ordena ascendente.
 * @param {{time:number|String, value:number}[]} points
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 * @returns {typeof points}
 */

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

/* ───────────────────────────── component ───────────────────────────── */

/**
 * Componente principal PromedioGrafico.
 * Inicializa el chart (área + dos líneas), gestiona tooltip,
 * sincroniza tamaño y setea datos cuando `data`/`range` cambian.
 * @param {PromedioGraficoProps} props
 */
export default function PromedioGrafico({
  data,
  height = 360,
  range = '1D',
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const areaRef = useRef(null);
  const sma8Ref = useRef(null);
  const sma13Ref = useRef(null);
  const tipRef = useRef(null);

   /**
   * Inicialización del gráfico (una sola vez):
   * - Crea chart con layout, grid, escalas y crosshair
   * - Añade series (Area para precio, Line para SMAs)
   * - Configura tooltip y listeners
   * - Observa el tamaño para responsividad
   * - Limpia todo al desmontar
   */

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
      // APIs nuevas
      area = chart.addAreaSeries(areaOpts);
      sma8 = chart.addLineSeries(line80pts);
      sma13 = chart.addLineSeries(line130pts);
    } else {
      // Back-compat con modo addSeries(...)
      area = chart.addSeries(AreaSeries, areaOpts);
      sma8 = chart.addSeries(LineSeries, line80pts);
      sma13 = chart.addSeries(LineSeries, line130pts);
    }

    // tooltip flotante
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
    // Listener de crosshair → actualiza tooltip
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

    // Refs
    chartRef.current = chart;
    areaRef.current = area;
    sma8Ref.current = sma8;
    sma13Ref.current = sma13;
    tipRef.current = tip;

    // Limpieza
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

      /**
   * Ajusta la altura cuando cambia `height`.
   */
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

/**
   * Actualiza las series cuando cambian `data` o `range`:
   * - Normaliza data con `getBlock`
   * - Convierte labels a times (epoch seconds) con `makeTimes`
   * - Asocia datasets → price (area), s8 (linea), s13 (línea)
   * - Filtra por `range`
   * - Sanitiza, ordena y elimina duplicados
   * - Setea datos en las series y ajusta timeScale
   */
useEffect(() => {
  if (!chartRef.current) return;

  console.log("📊 [PROMEDIO_GRAFICO] Actualizando datos:", {
    tieneData: !!data,
    dataStructure: data ? Object.keys(data) : 'NO_DATA',
    labelsLength: data?.labels?.length,
    datasetsLength: data?.datasets?.length,
    range
  });

  const block = getBlock(data || {});
  console.log("🔍 [PROMEDIO_GRAFICO] Block extraído:", {
    tieneBlock: !!block,
    blockLabels: block?.labels?.length,
    blockDatasets: block?.datasets?.length
  });

  let price = [], s8 = [], s13 = [];

  if (block) {
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

   // Filtrado por rango relativo al último punto
  if (typeof range === 'string') {
    price = filterSeriesByRange(price, range);
    s8 = filterSeriesByRange(s8, range);
    s13 = filterSeriesByRange(s13, range);
  }

  // Sanitización final: números finitos, orden asc y sin duplicados
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

  // Establecer datos en las series (solo si hay serie principal)
  if (price.length > 0) {
    areaRef.current.setData(price);
    sma8Ref.current.setData(s8);
    sma13Ref.current.setData(s13);

    // Ajustar escala de tiempo al contenido
    if (price.length >= 2) {
      chartRef.current.timeScale().fitContent();
    }
  } else {
    console.log("⏳ [PROMEDIO_GRAFICO] No hay datos reales para mostrar");
  }
}, [data, range]);

// Contenedor visual del chart
return (
  <div
    ref={containerRef}
    className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
    style={{ height }}
  />
);
}