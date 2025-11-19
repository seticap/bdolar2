/**
 * app/components/PromedioGrafico.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
"use client";

/**
 * Gráfico de promedio y medias móviles (Area + Line) usando `lightweight-charts`.
 * Muestra una serie principal (precio/promedio) y dos SMAs (8 y 13).
 *
 * ESTRUCTURA FLEXIBLE DE `data` (normalizada con `getBlock`):
 * {
 *   labels: Array<number|string>,      // timestamps (s|ms), YYYY-MM-DD o HH:mm
 *   datasets: [
 *     { label: 'Precio' | 'Promedio', data: number[] },   // Serie principal (area)
 *     { label: 'SMA 8', data: number[] },                 // Línea SMA 8
 *     { label: 'SMA 13', data: number[] },                // Línea SMA 13
 *   ]
 * }
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CrosshairMode,
} from "lightweight-charts";

/* ─────────────────────────────── theme ─────────────────────────────── */

const THEME = {
  bg: "transparent",
  text: "#9aa4b2",
  grid: "rgba(255,255,255,.06)",
  cross: "rgba(255,255,255,.18)",
  primary: "#22c55e",
  primaryTop: "rgba(34,197,94,.28)",
  primaryBottom: "rgba(34,197,94,.06)",
  line8: "#22c55e",
  line13: "#f59e0b",
};

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
function getBlock(input) {
  const p = input ?? {};
  const a = p?.data?.data?.data ?? p?.data?.data ?? p?.data ?? p;

  if (a?.labels && a?.datasets) return a;
  if (a?.data?.labels && a?.data?.datasets) return a.data;
  if (p?.labels && p?.datasets) return p;

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
    const bogotaDate = new Date(
      date.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );
    return Math.floor(bogotaDate.getTime() / 1000);
  } catch {
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
    const today = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );
    const [hours, minutes] = timeString.split(":").map(Number);
    today.setHours(hours, minutes || 0, 0, 0);
    return Math.floor(today.getTime() / 1000);
  } catch {
    return 0;
  }
}

/**
 * Normaliza `labels` a timestamps (epoch seconds).
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
        return fullDateToUnixBogota(l + " 12:00");
      }
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(l)) {
        return hhmmToUnixTodayBogota(l);
      }
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
  const d = new Date(t * 1000);
  return d.toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Filtra puntos por `range` relativo al último timestamp, elimina duplicados
 * y ordena ascendente.
 * @param {{time:number|string, value:number}[]} points
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
function filterSeriesByRange(points = [], range = "1D") {
  if (!points.length) return points;

  const toSec = (t) =>
    typeof t === "number"
      ? t
      : /^\d{4}-\d{2}-\d{2}$/.test(t)
      ? Math.floor(new Date(t + "T00:00:00Z").getTime() / 1000)
      : NaN;

  const lastSec = toSec(points[points.length - 1].time);
  if (!Number.isFinite(lastSec)) return points;

  const days = { "1D": 1, "5D": 5, "1M": 30, "6M": 182, "1A": 365 }[range] ?? 365;
  const fromSec = lastSec - days * 24 * 3600;

  const seen = new Set();
  return points
    .filter((p) => {
      const ts = toSec(p.time);
      const shouldKeep = Number.isFinite(ts) ? ts >= fromSec : true;
      if (shouldKeep) {
        if (seen.has(ts)) return false;
        seen.add(ts);
        return true;
      }
      return false;
    })
    .sort((a, b) => toSec(a.time) - toSec(b.time));
}

/* ───────────────────────────── component ───────────────────────────── */

export default function PromedioGrafico({
  data,
  height = 360,
  range = "1D",
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const areaRef = useRef(null);
  const sma8Ref = useRef(null);
  const sma13Ref = useRef(null);
  const tipRef = useRef(null);

  /** Inicialización del chart (una sola vez) */
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

    const areaOpts = {
      ...COMMON_SERIES_OPTS,
      topColor: THEME.primaryTop,
      bottomColor: THEME.primaryBottom,
      lineColor: THEME.primary,
      lineWidth: 2,
    };
    const line8Opts = { ...COMMON_SERIES_OPTS, color: THEME.line8, lineWidth: 2 };
    const line13Opts = { ...COMMON_SERIES_OPTS, color: THEME.line13, lineWidth: 2 };

    let area, sma8, sma13;
    if (typeof chart.addAreaSeries === "function") {
      area = chart.addAreaSeries(areaOpts);
      sma8 = chart.addLineSeries(line8Opts);
      sma13 = chart.addLineSeries(line13Opts);
    } else {
      area = chart.addSeries(AreaSeries, areaOpts);
      sma8 = chart.addSeries(LineSeries, line8Opts);
      sma13 = chart.addSeries(LineSeries, line13Opts);
    }

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
        <div><span style="display:inline-block;width:10px;height:10px;background:${
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

  /** Ajusta altura cuando cambia `height` */
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  /**
   * Actualiza las series cuando cambian `data` o `range`.
   */
  useEffect(() => {
    if (!chartRef.current) return;

    const block = getBlock(data || {});
    let price = [],
      s8 = [],
      s13 = [];

    if (block) {
      const times = makeTimes(block.labels || []);
      price = zip(times, block.datasets?.[0]?.data || []);
      s8 = zip(times, block.datasets?.[1]?.data || []);
      s13 = zip(times, block.datasets?.[2]?.data || []);
    }

    if (typeof range === "string") {
      price = filterSeriesByRange(price, range);
      s8 = filterSeriesByRange(s8, range);
      s13 = filterSeriesByRange(s13, range);
    }

    const sanitize = (arr) => {
      const seen = new Set();
      return arr
        .filter(
          (p) => Number.isFinite(p?.time) && Number.isFinite(p?.value)
        )
        .sort((a, b) => a.time - b.time)
        .filter((p) => {
          if (seen.has(p.time)) return false;
          seen.add(p.time);
          return true;
        });
    };

    price = sanitize(price);
    s8 = sanitize(s8);
    s13 = sanitize(s13);

    if (price.length > 0) {
      areaRef.current.setData(price);
      sma8Ref.current.setData(s8);
      sma13Ref.current.setData(s13);

      if (price.length >= 2) {
        chartRef.current.timeScale().fitContent();
      }
    } else {
      areaRef.current.setData([]);
      sma8Ref.current.setData([]);
      sma13Ref.current.setData([]);
    }
  }, [data, range]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
      style={{ height }}
    />
  );
}
