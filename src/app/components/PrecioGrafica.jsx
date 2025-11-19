/**
 * app/components/PrecioGrafica.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
"use client";

/**
 * Gráfico de línea para la cotización USD/COP usando `lightweight-charts`.
 *
 * Capaz de:
 *  - Normalizar distintos formatos de `payload` (datasets/labels, arrays simples, estructuras anidadas)
 *  - Convertir etiquetas de tiempo (HH:mm, YYYY-MM-DD, YYYY-MM-DD HH:mm) a epoch seconds en zona Bogotá
 *  - Eliminar duplicados por timestamp y ordenar datos antes de renderizar
 *  - Mostrar un tooltip flotante rico en información, estilizado y consistente con la app
 *  - Ajustar automáticamente la escala de tiempo al contenido
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CrosshairMode,
  ColorType,
  LineSeries,
} from "lightweight-charts";

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
    const bogotaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Bogota" })
    );

    const year = bogotaTime.getFullYear();
    const month = bogotaTime.getMonth();
    const day = bogotaTime.getDate();

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(
      mm
    ).padStart(2, "0")}:00-05:00`;
    const date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      const fallbackDate = new Date(Date.UTC(year, month, day, hh + 5, mm, 0));
      const timestamp = isNaN(fallbackDate.getTime())
        ? null
        : Math.floor(fallbackDate.getTime() / 1000);
      return timestamp;
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    return timestamp;
  } catch {
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
    let date;

    if (dateStr.includes("-") && dateStr.includes(":")) {
      // Formato: YYYY-MM-DD HH:mm
      const [datePart, timePart] = dateStr.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      date = new Date(
        Date.UTC(year, month - 1, day, hours + 5, minutes, 0)
      );
    } else if (dateStr.includes("-")) {
      // Formato: YYYY-MM-DD → usar mediodía
      const [year, month, day] = dateStr.split("-").map(Number);
      date = new Date(Date.UTC(year, month - 1, day, 12 + 5, 0, 0));
    } else {
      return null;
    }

    if (isNaN(date.getTime())) {
      return null;
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    return timestamp;
  } catch {
    return null;
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
    return [];
  }

  const now = Math.floor(Date.now() / 1000);
  const points = [];

  for (let i = 0; i < dataArray.length; i++) {
    const price = normalizeNumber(dataArray[i]);
    if (Number.isFinite(price)) {
      let timestamp;
      switch (range) {
        case "1D":
          timestamp = now - (dataArray.length - i) * 300;
          break;
        case "5D":
          timestamp = now - (dataArray.length - i) * 1800;
          break;
        case "1M":
          timestamp = now - (dataArray.length - i) * 86400;
          break;
        case "6M":
          timestamp = now - (dataArray.length - i) * 86400;
          break;
        case "1A":
          timestamp = now - (dataArray.length - i) * 86400;
          break;
        default:
          timestamp = now - (dataArray.length - i) * 300;
      }

      points.push({
        t: timestamp,
        v: price,
      });
    }
  }

  return points;
};

/**
 * Parsea la respuesta de API (flexible) a puntos { t, v } sin duplicados ni valores inválidos.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 * @returns {{t:number, v:number}[]}
 */
const parseApiResponseToPoints = (apiResponse, range) => {
  try {
    if (!apiResponse) {
      return [];
    }

    const points = [];
    const seenTimestamps = new Set();

    // CASO 1: Estructura típica datasets/labels
    if (apiResponse.datasets && apiResponse.labels) {
      const datasets = apiResponse.datasets;
      const labels = apiResponse.labels;

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const value = datasets[0]?.data?.[i];

        if (value === undefined || value === null) continue;

        const numericValue = normalizeNumber(value);
        if (!Number.isFinite(numericValue)) continue;

        let timestamp;

        if (
          range === "1D" &&
          typeof label === "string" &&
          label.includes(":")
        ) {
          // Formato HH:mm para 1D
          timestamp = hhmmToUnixTodayBogota(label);
        } else if (
          typeof label === "string" &&
          (label.includes("-") || label.includes(":"))
        ) {
          // Formato de fecha completa para otros rangos
          timestamp = fullDateToUnixBogota(label);
        } else if (typeof label === "number") {
          timestamp = label;
        } else {
          const now = Math.floor(Date.now() / 1000);
          const intervals = {
            "1D": 300,
            "5D": 1800,
            "1M": 86400,
            "6M": 86400,
            "1A": 86400,
          };
          timestamp =
            now - (labels.length - i) * (intervals[range] || 300);
        }

        if (timestamp && Number.isFinite(numericValue)) {
          if (!seenTimestamps.has(timestamp)) {
            seenTimestamps.add(timestamp);
            points.push({
              t: timestamp,
              v: numericValue,
            });
          }
        }
      }
    }
    // CASO 2: Array simple de valores
    else if (Array.isArray(apiResponse)) {
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < apiResponse.length; i++) {
        const price = normalizeNumber(apiResponse[i]);
        if (Number.isFinite(price)) {
          let timestamp;
          switch (range) {
            case "1D":
              timestamp = now - (apiResponse.length - i) * 300;
              break;
            case "5D":
              timestamp = now - (apiResponse.length - i) * 1800;
              break;
            case "1M":
              timestamp = now - (apiResponse.length - i) * 86400;
              break;
            case "6M":
              timestamp = now - (apiResponse.length - i) * 86400;
              break;
            case "1A":
              timestamp = now - (apiResponse.length - i) * 86400;
              break;
            default:
              timestamp = now - (apiResponse.length - i) * 300;
          }

          if (!seenTimestamps.has(timestamp)) {
            seenTimestamps.add(timestamp);
            points.push({
              t: timestamp,
              v: price,
            });
          }
        }
      }
    }
    // CASO 3: Datos en otros formatos
    else {
      const possibleDataPaths = [
        "data",
        "values",
        "series",
        "chartData",
        "points",
      ];
      for (const path of possibleDataPaths) {
        if (apiResponse[path] && Array.isArray(apiResponse[path])) {
          const arrayData = parseSimpleArrayResponse(
            apiResponse[path],
            range
          );
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

      return [];
    }

    points.sort((a, b) => a.t - b.t);
    return points;
  } catch {
    return [];
  }
};

/* ──────────────────────────────── THEME ──────────────────────────────── */

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

function ChartTooltip({ visible, price, time, x, y, pointCount }) {
  if (!visible) return null;

  const variation =
    price && pointCount > 1 ? ((price - 3900) / 3900) * 100 : 0;
  const isPositive = variation >= 0;

  return (
    <div
      className="custom-tooltip"
      style={{
        position: "fixed",
        padding: "12px",
        background: "rgba(15, 23, 42, 0.98)",
        color: "white",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        pointerEvents: "none",
        zIndex: 1000,
        opacity: 1,
        transition: "opacity 0.1s ease",
        backdropFilter: "blur(12px)",
        boxShadow:
          "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        minWidth: "180px",
        left: `${x + 15}px`,
        top: `${y - 80}px`,
        transform: "none",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: "13px",
            marginBottom: "2px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "white" }}>USD/COP</span>
          <span style={{ color: "white", fontSize: "11px" }}>{time}</span>
        </div>
        <div style={{ color: "white", fontSize: "11px" }}>
          {new Date().toLocaleDateString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          fontSize: "11px",
        }}
      >
        <span style={{ color: "white" }}>Precio:</span>
        <span
          style={{
            textAlign: "right",
            color: "white",
            fontWeight: 500,
          }}
        >
          ${price?.toFixed(2) || "0.00"}
        </span>
        <span style={{ color: "white" }}>Variación:</span>
        <span
          style={{
            textAlign: "right",
            color: isPositive ? "#10b981" : "#ef4444",
            fontWeight: 600,
          }}
        >
          {isPositive ? "+" : ""}
          {variation.toFixed(2)}%
        </span>
        <span style={{ color: "white" }}>Puntos:</span>
        <span
          style={{
            textAlign: "right",
            color: "white",
            fontWeight: 500,
          }}
        >
          {pointCount}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── Componente Principal ─────────────────────────── */

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
    time: "",
    x: 0,
    y: 0,
    pointCount: 0,
  });

  const [lastUpdate, setLastUpdate] = useState(null);

  // Montaje del chart
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth || 640,
      height,
      layout: {
        background: { type: ColorType.Solid, color: THEME.bg },
        textColor: THEME.text,
      },
      grid: {
        vertLines: { color: THEME.grid },
        horzLines: { color: THEME.grid },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: THEME.cross,
          width: 1,
          style: 3,
          labelBackgroundColor: THEME.primary,
        },
        horzLine: {
          color: THEME.cross,
          width: 1,
          style: 3,
          labelBackgroundColor: THEME.primary,
        },
      },
    });

    const line = chart.addSeries(LineSeries, {
      color: THEME.primary,
      lineWidth: 2,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || param.point.x < 0 || param.point.y < 0) {
        setTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      const seriesData = param.seriesData.get(line);
      if (seriesData) {
        const price = seriesData.value;
        const time = param.time;

        const timeStr =
          typeof time === "number"
            ? new Date(time * 1000).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Bogota",
              })
            : "";

        setTooltip({
          visible: true,
          price,
          time: timeStr,
          x: param.point.x,
          y: param.point.y,
          pointCount: seriesRef.current?.data?.length || 0,
        });
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }));
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
      try {
        ro.disconnect();
      } catch {}
      try {
        chart.remove();
      } catch {}
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Ajusta la altura del chart si cambia `height`
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({ height });
    }
  }, [height]);

  // Memo de payload → seriesData
  const seriesData = useMemo(() => {
    let rawData = [];

    if (
      payload?.chartData &&
      Array.isArray(payload.chartData) &&
      payload.chartData.length > 0
    ) {
      rawData = payload.chartData.map((point) => ({
        time: point.time || point.t,
        value: point.value || point.v,
      }));
    } else if (payload && (payload.datasets || Array.isArray(payload))) {
      const parsedPoints = parseApiResponseToPoints(payload, range);
      if (parsedPoints.length > 0) {
        rawData = parsedPoints.map((point) => ({
          time: point.t,
          value: point.v,
        }));
      }
    }

    if (rawData.length > 0) {
      rawData.sort((a, b) => a.time - b.time);

      const uniqueData = [];
      const seenTimestamps = new Set();

      for (const point of rawData) {
        if (!seenTimestamps.has(point.time)) {
          seenTimestamps.add(point.time);
          uniqueData.push(point);
        }
      }

      let isSorted = true;
      for (let i = 1; i < uniqueData.length; i++) {
        if (uniqueData[i].time <= uniqueData[i - 1].time) {
          isSorted = false;
          break;
        }
      }

      if (!isSorted) {
        uniqueData.sort((a, b) => a.time - b.time);
      }

      return uniqueData;
    }

    return [];
  }, [payload, range]);

  // Pinta los datos en la serie
  useEffect(() => {
    const s = seriesRef.current;
    const chart = chartRef.current;

    if (!s || !chart) {
      return;
    }

    if (!seriesData || seriesData.length === 0) {
      s.setData([]);
      return;
    }

    s.setData(seriesData);
    setLastUpdate(new Date());

    const ts = chart.timeScale();
    if (ts && seriesData.length > 1) {
      requestAnimationFrame(() => {
        try {
          ts.fitContent();
        } catch {}
      });
    }
  }, [seriesData]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full relative border border-slate-700 rounded-lg bg-slate-900/50"
        style={{ height: `${height}px` }}
      />
      <ChartTooltip {...tooltip} />
    </div>
  );
}
