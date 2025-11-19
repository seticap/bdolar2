/**
 * app/components/VelasGrafico.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */

"use client";

/**
 * Gráfico de velas (candlesticks) basado en `lightweight-charts`.
 * Muestra datos de velas para USD/COP, típicamente provenientes del WebSocket.
 *
 * ESTRUCTURA ESPERADA DE CADA VELA:
 * {
 *   time:  number (epoch seconds),
 *   open:  number,
 *   high:  number,
 *   low:   number,
 *   close: number
 * }
 *
 * PROPS:
 * @typedef {Object} Candle
 * @property {number} time
 * @property {number} open
 * @property {number} high
 * @property {number} low
 * @property {number} close
 *
 * @typedef {Object} VelasGraficoProps
 * @property {Candle[]}                [payload]       - Arreglo de velas.
 * @property {number}                  [height=360]    - Alto del chart.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'}[range='1D']    - Rango temporal.
 * @property {string}                  [title]         - Título semántico (no se pinta aquí).
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  CrosshairMode,
} from "lightweight-charts";

/* ─────────────────────────────── theme ─────────────────────────────── */

const THEME = {
  bg: "transparent",
  text: "#9aa4b2",
  grid: "rgba(255,255,255,.06)",
  cross: "rgba(255,255,255,.18)",
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

/* ─────────────────────────────── utils ─────────────────────────────── */

/**
 * Filtro “solo hoy” (zona Bogotá) para range === '1D'.
 * Si el filtro deja 0 velas, retorna el array original (evita gráfico vacío).
 */
const filterDataByDate = (data, range = "1D") => {
  if (range !== "1D" || !Array.isArray(data)) return data;

  try {
    const nowBogota = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Bogota" })
    );

    const startOfToday = new Date(nowBogota);
    startOfToday.setHours(0, 0, 0, 0);
    const startTs = Math.floor(startOfToday.getTime() / 1000);

    const endOfToday = new Date(nowBogota);
    endOfToday.setHours(23, 59, 59, 999);
    const endTs = Math.floor(endOfToday.getTime() / 1000);

    const filtered = data.filter(
      (c) => c.time >= startTs && c.time <= endTs
    );

    // Si no hay datos de hoy, evitamos dejar el gráfico vacío
    return filtered.length === 0 ? data : filtered;
  } catch {
    return data;
  }
};

/**
 * Formatea un timestamp en segundos a fecha/hora de Bogotá legible.
 */
const fmtDate = (t) => {
  if (typeof t === "string") return t;

  const d = new Date(t * 1000);
  return d.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Normaliza cualquier objeto de vela a la forma esperada.
 */
const normalizeCandle = (item) => {
  if (!item) return null;

  const time = Number(item.time);
  const open = Number(item.open);
  const high = Number(item.high);
  const low = Number(item.low);
  const close = Number(item.close);

  if (
    !Number.isFinite(time) ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null;
  }

  return { time, open, high, low, close };
};

/* ───────────────────────────── component ───────────────────────────── */

export default function VelasGrafico({
  payload,
  height = 360,
  range = "1D",
  title = "Gráfico de Velas USD/COP",
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickRef = useRef(null);
  const tipRef = useRef(null);

  /**
   * Inicialización del chart (solo una vez):
   * - crea el chart y la serie de velas
   * - configura crosshair + tooltip flotante
   * - añade ResizeObserver
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth || 640,
      height,
      layout: {
        background: { color: THEME.bg },
        textColor: THEME.text,
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
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

    // Compatibilidad con distintas versiones de lightweight-charts
    let candlestickSeries;
    try {
      if (typeof chart.addCandlestickSeries === "function") {
        candlestickSeries = chart.addCandlestickSeries({
          upColor: THEME.up,
          downColor: THEME.down,
          borderUpColor: THEME.borderUp,
          borderDownColor: THEME.borderDown,
          wickUpColor: THEME.wickUp,
          wickDownColor: THEME.wickDown,
          ...COMMON_SERIES_OPTS,
        });
      } else {
        candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: THEME.up,
          downColor: THEME.down,
          borderUpColor: THEME.borderUp,
          borderDownColor: THEME.borderDown,
          wickUpColor: THEME.wickUp,
          wickDownColor: THEME.wickDown,
          ...COMMON_SERIES_OPTS,
        });
      }
    } catch {
      // Si falla la creación de la serie, no seguimos configurando
      return;
    }

    // Tooltip flotante
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
      fontFamily: "system-ui, -apple-system, sans-serif",
      minWidth: "180px",
    });
    el.style.position = "relative";
    el.appendChild(tip);

    const onMove = (param) => {
      if (!param?.time || !param.point) {
        tip.style.display = "none";
        return;
      }

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
          <div style="color:#fff;font-weight:500;text-align:right">$${Number(
            open
          ).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Máximo:</div>
          <div style="color:${THEME.up};font-weight:500;text-align:right">$${Number(
            high
          ).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Mínimo:</div>
          <div style="color:${THEME.down};font-weight:500;text-align:right">$${Number(
            low
          ).toLocaleString("es-CO")}</div>
          
          <div style="color:${THEME.text}">Cierre:</div>
          <div style="color:${color};font-weight:500;text-align:right">$${Number(
            close
          ).toLocaleString("es-CO")}</div>
        </div>
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid rgba(255,255,255,.1);font-size:10px;color:${THEME.text}">
          Variación: <span style="color:${color};font-weight:500">${(
            ((close - open) / open) *
            100
          ).toFixed(2)}%</span>
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

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el && el.contains(tipRef.current)) {
        el.removeChild(tipRef.current);
      }
      chart.remove();
      chartRef.current = null;
      candlestickRef.current = null;
      tipRef.current = null;
    };
  }, []);

  /** Ajusta altura cuando cambia `height`. */
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  /**
   * Actualiza la serie de velas cuando cambian `payload` o `range`:
   * - Usa los datos reales del payload
   * - Filtra a “solo hoy” para 1D
   * - Normaliza, sanitiza y ordena las velas
   * - Ajusta la escala de tiempo al contenido
   */
  useEffect(() => {
    const chart = chartRef.current;
    const series = candlestickRef.current;
    if (!chart || !series) return;

    if (!payload || !Array.isArray(payload) || payload.length === 0) {
      series.setData([]);
      return;
    }

    const filtered = filterDataByDate(payload, range);

    const velasData = filtered
      .map((item) => normalizeCandle(item))
      .filter(Boolean);

    const sanitizedData = velasData
      .filter(
        (c) =>
          Number.isFinite(c.time) &&
          Number.isFinite(c.open) &&
          Number.isFinite(c.high) &&
          Number.isFinite(c.low) &&
          Number.isFinite(c.close)
      )
      .sort((a, b) => a.time - b.time);

    if (sanitizedData.length > 0) {
      try {
        series.setData(sanitizedData);
        if (sanitizedData.length >= 2) {
          chart.timeScale().fitContent();
        }
      } catch {
        // Silencioso en producción
      }
    } else {
      series.setData([]);
    }
  }, [payload, range]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-slate-700 rounded-lg bg-slate-900/50"
      style={{ height }}
      aria-label={title}
    />
  );
}
