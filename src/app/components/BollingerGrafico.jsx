/**
 * app/components/BollingerGrafico.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 *
 * Descripción:
 * Componente cliente que renderiza un gráfico de líneas usando lightweight-charts
 * para visualizar Precio, SMA 20 y Bandas de Bollinger (superior e inferior).
 *
 * Características:
 * - Recibe datos desde un proveedor WebSocket mediante `useWebSocketDataGrafico`.
 * - Convierte etiquetas (labels) a timestamps Unix considerando zona horaria de Bogotá.
 * - Ordena y deduplica por timestamp para cumplir con lightweight-charts.
 * - Tooltip interactivo sincronizado con crosshair.
 * - Comportamiento responsive mediante ResizeObserver.
 *
 * Dependencias:
 * - react (useEffect, useRef)
 * - lightweight-charts
 * - useWebSocketDataGrafico (servicio propio)
 *
 * Uso:
 *  <BollingerGrafico range="1D" height={360} />
 */

"use client";

import { useEffect, useRef } from "react";
import { createChart, LineSeries, CrosshairMode } from "lightweight-charts";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";

/**
 * Paleta y estilos del gráfico.
 */
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

/**
 * Opciones comunes que se aplican a todas las series de línea.
 */
const COMMON_SERIES_OPTS = { lastValueVisible: false, priceLineVisible: false };

/**
 * Ordena por timestamp ascendente y elimina duplicados por `time`.
 *
 * @param {Array<{time:number,value:number}>} data
 * @returns {Array<{time:number,value:number}>}
 */
const sortAndDeduplicateData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const sorted = [...data].sort((a, b) => a.time - b.time);

  const uniqueData = [];
  const seenTimestamps = new Set();

  for (const item of sorted) {
    if (!seenTimestamps.has(item.time)) {
      seenTimestamps.add(item.time);
      uniqueData.push(item);
    }
  }

  return uniqueData;
};

/**
 * Stub de diagnóstico (se deja por si quieres reactivar logs en desarrollo).
 * Actualmente no hace nada para no ensuciar la consola.
 */
const diagnoseDataOrder = (_data, _seriesName = "unknown") => {
  // Intencionalmente vacío (sin logs)
};

/**
 * Convierte una hora local HH:mm a timestamp Unix (segundos) de la fecha actual en zona "America/Bogota".
 *
 * @param {string} hhmm
 * @returns {number|null}
 */
const hhmmToUnixTodayBogota = (hhmm) => {
  try {
    const [hh, mm] = String(hhmm).split(":").map(Number);
    if (
      !Number.isFinite(hh) ||
      !Number.isFinite(mm) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59
    ) {
      return null;
    }

    const now = new Date();
    const todayBogota = new Date(
      now.toLocaleString("en-US", {
        timeZone: "America/Bogota",
      })
    );

    todayBogota.setHours(hh, mm, 0, 0);

    return Math.floor(todayBogota.getTime() / 1000);
  } catch {
    return null;
  }
};

/**
 * Convierte labels heterogéneos (HH:mm, ISO date string, unix seconds) a timestamps Unix (segundos).
 * Si no puede convertir, aplica fallback al timestamp actual.
 *
 * @param {Array<string|number>} labels
 * @returns {number[]}
 */
const convertLabelsToTimestamps = (labels) => {
  return labels.map((label) => {
    if (typeof label === "number" && label > 1000000000) {
      return label;
    }

    if (typeof label === "string" && label.includes(":")) {
      const timestamp = hhmmToUnixTodayBogota(label);
      return timestamp || Math.floor(Date.now() / 1000);
    }

    if (typeof label === "string") {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000);
      }
    }

    return Math.floor(Date.now() / 1000);
  });
};

/**
 * Componente de gráfico de Bollinger con lightweight-charts.
 *
 * @param {Object} props
 * @param {"1D"|"1W"|"1M"|string} [props.range="1D"]
 * @param {number} [props.height=360]
 * @param {number|null} [props.maxPoints=null]
 */
export default function BollingerGrafico({
  range = "1D",
  height = 360,
  maxPoints = null, // reservado para futuros límites de puntos
}) {
  // Refs de chart y series
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const priceRef = useRef(null);
  const sma20Ref = useRef(null);
  const upperRef = useRef(null);
  const lowerRef = useRef(null);
  const tipRef = useRef(null);

  // Datos desde proveedor WebSocket
  const context = useWebSocketDataGrafico();
  const { useChartPayload } = context || {};
  const bollingerData = useChartPayload ? useChartPayload(1004, range) : null;

  // Montaje: inicializa chart, series y tooltip
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

    // Series en orden: precio, SMA20, upper, lower
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
      lineStyle: 2,
      ...COMMON_SERIES_OPTS,
    });
    const lower = addLine({
      color: THEME.lowerBand,
      lineWidth: 1,
      lineStyle: 2,
      ...COMMON_SERIES_OPTS,
    });

    // Tooltip HTML flotante
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
      if (!param?.time || !param.point) {
        tip.style.display = "none";
        return;
      }

      const p = param.seriesData.get(price)?.value;
      const s = param.seriesData.get(sma20)?.value;
      const up = param.seriesData.get(upper)?.value;
      const lo = param.seriesData.get(lower)?.value;

      if (p == null && s == null && up == null && lo == null) {
        tip.style.display = "none";
        return;
      }

      const exactTime = new Date(param.time * 1000).toLocaleTimeString(
        "es-CO",
        {
          timeZone: "America/Bogota",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }
      );

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

    // Responsive horizontal
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth || 640 });
      chart.timeScale().fitContent();
    });
    ro.observe(el);

    chartRef.current = chart;
    priceRef.current = price;
    sma20Ref.current = sma20;
    upperRef.current = upper;
    lowerRef.current = lower;
    tipRef.current = tip;

    return () => {
      ro.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      if (tipRef.current && el.contains(tipRef.current)) {
        el.removeChild(tipRef.current);
      }
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

  // Altura dinámica
  useEffect(() => {
    if (chartRef.current) chartRef.current.applyOptions({ height });
  }, [height]);

  // Efecto principal: procesar y pintar datos de Bollinger
  useEffect(() => {
    if (!chartRef.current || !bollingerData) return;

    const { labels, datasets } = bollingerData || {};

    if (!labels || !datasets || datasets.length < 4) {
      return;
    }

    // Orden esperado: [price, sma20, upper, lower]
    const priceData = datasets[0]?.data || [];
    const smaData = datasets[1]?.data || [];
    const upperData = datasets[2]?.data || [];
    const lowerData = datasets[3]?.data || [];

    const timestampLabels = convertLabelsToTimestamps(labels);

    const priceSeries = timestampLabels
      .map((timestamp, index) => ({
        time: timestamp,
        value: priceData[index],
      }))
      .filter((point) => point.value != null && point.value !== 0);

    const smaSeries = timestampLabels
      .map((timestamp, index) => ({
        time: timestamp,
        value: smaData[index],
      }))
      .filter((point) => point.value != null && point.value !== 0);

    const upperSeries = timestampLabels
      .map((timestamp, index) => ({
        time: timestamp,
        value: upperData[index],
      }))
      .filter((point) => point.value != null && point.value !== 0);

    const lowerSeries = timestampLabels
      .map((timestamp, index) => ({
        time: timestamp,
        value: lowerData[index],
      }))
      .filter((point) => point.value != null && point.value !== 0);

    try {
      // Reset antes de pintar
      if (priceRef.current) priceRef.current.setData([]);
      if (sma20Ref.current) sma20Ref.current.setData([]);
      if (upperRef.current) upperRef.current.setData([]);
      if (lowerRef.current) lowerRef.current.setData([]);

      const sortedPriceSeries = sortAndDeduplicateData(priceSeries);
      const sortedSmaSeries = sortAndDeduplicateData(smaSeries);
      const sortedUpperSeries = sortAndDeduplicateData(upperSeries);
      const sortedLowerSeries = sortAndDeduplicateData(lowerSeries);

      diagnoseDataOrder(sortedPriceSeries, "PRICE");

      if (sortedPriceSeries.length > 0 && priceRef.current) {
        priceRef.current.setData(sortedPriceSeries);
      }

      if (sortedSmaSeries.length > 0 && sma20Ref.current) {
        sma20Ref.current.setData(sortedSmaSeries);
      }

      if (sortedUpperSeries.length > 0 && upperRef.current) {
        upperRef.current.setData(sortedUpperSeries);
      }

      if (sortedLowerSeries.length > 0 && lowerRef.current) {
        lowerRef.current.setData(sortedLowerSeries);
      }

      if (sortedPriceSeries.length > 0 && chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch {
      // En producción mantenemos el fallo silencioso en este componente.
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
