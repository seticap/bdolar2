/**
 * src/app/services/WebSocketDataProviderGraficos.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
"use client";

/**
 * Capa de datos para gráficos (línea, velas, promedios y Bollinger) con:
 *  - Ingesta en tiempo real vía WebSocket (ids: 1002=promedios, 1003=velas, 1007=tick)
 *  - Carga inicial y refresco vía HTTP (precios, promedios, velas y bollinger)
 *  - Cache local por rango (1D/5D/1M/6M/1A) con expiración por tipo
 *  - Normalización de estructuras (Chart.js-like, arrays simples, OHLC crudo)
 *  - Corrección de zona horaria: Bogotá (UTC-5) para labels de tiempo
 *  - Filtro “solo hoy” para 1D
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import { tokenServices } from "../services/socketService";

/* ============== Contexto ============== */
/** Contexto de datos para gráficas (línea, velas, promedios, bollinger) */
const Ctx = createContext(null);

/**
 * Hook de consumo del contexto de gráficos.
 * @returns {{ request: (msg:any)=>void, useChartPayload: (id:number, lapse?:string)=>any, httpDataLoaded:boolean }}
 */
export const useWebSocketDataGrafico = () => useContext(Ctx);

/* ============== Helpers ============== */

/**
 * Agrupa un timestamp por tamaño de bucket (segundos).
 * @param {number} t - epoch seconds
 * @param {number} [size=60] - tamaño de bucket en segundos
 */
const bucketSec = (t, size = 60) => Math.floor(t / size) * size;

/**
 * SMA simple sobre un array de valores.
 * @param {number[]} arr
 * @param {number} period
 * @returns {(number|null)[]} longitud igual a arr, con null hasta completar ventana
 */
const sma = (arr, period) => {
  const out = Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = Number(arr[i]) || 0;
    sum += v;
    if (i >= period) sum -= Number(arr[i - period]) || 0;
    if (i >= period - 1) out[i] = +(sum / period).toFixed(2);
  }
  return out;
};

/**
 * Desviación estándar móvil para un periodo dado.
 * Se incluye por utilidad; no altera la lógica existente.
 * @param {number[]} arr
 * @param {number} period
 * @returns {(number|null)[]}
 */
const stdDev = (arr, period) => {
  const out = Array(arr.length).fill(null);
  for (let i = period - 1; i < arr.length; i++) {
    const slice = arr.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, val) => sum + val, 0) / period;
    const squareDiffs = slice.map((val) => Math.pow(val - mean, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, val) => sum + val, 0) / period;
    out[i] = Math.sqrt(avgSquareDiff);
  }
  return out;
};

/**
 * Normaliza números que vienen como string con separadores → number.
 * @param {number|string} x
 * @returns {number} NaN si no es convertible
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
 * Convierte "HH:mm" del día actual en Bogotá a epoch seconds.
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

    const timestamp = Math.floor(todayBogota.getTime() / 1000);
    return timestamp;
  } catch {
    return null;
  }
};

/**
 * Convierte "YYYY-MM-DD" o "YYYY-MM-DD HH:mm" a epoch seconds en Bogotá.
 * Usa offset -05:00 y fallback a UTC si fuera necesario.
 * @param {string} dateStr
 * @returns {number|null}
 */
const fullDateToUnixBogota = (dateStr) => {
  try {
    let date;

    if (dateStr.includes("-") && dateStr.includes(":")) {
      const [datePart, timePart] = dateStr.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      const bogotaDateStr = `${year}-${String(month).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}T${String(hours).padStart(
        2,
        "0"
      )}:${String(minutes).padStart(2, "0")}:00-05:00`;
      date = new Date(bogotaDateStr);

      if (isNaN(date.getTime())) {
        date = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
      }
    } else if (dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-").map(Number);

      const bogotaDateStr = `${year}-${String(month).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}T12:00:00-05:00`;
      date = new Date(bogotaDateStr);

      if (isNaN(date.getTime())) {
        date = new Date(Date.UTC(year, month - 1, day, 12 + 5, 0, 0));
      }
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
 * Filtro “solo hoy” (zona Bogotá) cuando range==='1D'.
 * Si el filtro deja 0 puntos, retorna el set original (evita dejar vacío).
 * Acepta tanto puntos {t,..} como velas {time,..}.
 * @param {Array<{t?:number,time?:number}>} data
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const filterDataByDate = (data, range = "1D") => {
  if (range !== "1D" || !Array.isArray(data)) return data;

  try {
    const nowBogota = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "America/Bogota",
      })
    );

    const startOfToday = new Date(nowBogota);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTimestamp = Math.floor(startOfToday.getTime() / 1000);

    const endOfToday = new Date(nowBogota);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayTimestamp = Math.floor(endOfToday.getTime() / 1000);

    const filteredData = data.filter((item) => {
      const itemTime = item.time || item.t;
      return (
        itemTime >= startOfTodayTimestamp && itemTime <= endOfTodayTimestamp
      );
    });

    if (filteredData.length === 0) {
      return data;
    }

    return filteredData;
  } catch {
    return data;
  }
};

/**
 * Diagnóstico adicional solo para 1D con estructuras tipo Chart.js.
 * (versión silenciosa, sólo mantiene la firma)
 * @param {{labels:any[], datasets:any[]}|null} chartData
 * @param {string} range
 */
const diagnose1DData = (chartData, range) => {
  if (range !== "1D") return;
};

/* ============== Sistema de Cache Mejorado ============== */

/** Expiración por rango para tipos de gráficos */
const GRAPH_CACHE_CONFIG = {
  "1D": { expiry: 5 * 60 * 1000 },
  "5D": { expiry: 30 * 60 * 1000 },
  "1M": { expiry: 2 * 60 * 60 * 1000 },
  "6M": { expiry: 6 * 60 * 60 * 1000 },
  "1A": { expiry: 12 * 60 * 60 * 1000 },
};

/**
 * Borra cache de todos los tipos para un rango.
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const forceCacheRefresh = (range) => {
  try {
    const keys = [
      `graph_line_${range}`,
      `graph_velas_${range}`,
      `graph_bollinger_${range}`,
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * Guarda datos en cache local (localStorage) con expiración.
 * @param {string} range
 * @param {'line'|'velas'|'bollinger'} dataType
 * @param {any[]} data
 */
const saveToCache = (range, dataType, data) => {
  try {
    const key = `graph_${dataType}_${range}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiry:
        Date.now() + (GRAPH_CACHE_CONFIG[range]?.expiry || 24 * 60 * 60 * 1000),
    };

    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch {
    return false;
  }
};

/**
 * Lee cache si no expiró, si no, borra y retorna null.
 * @param {string} range
 * @param {'line'|'velas'|'bollinger'} dataType
 */
const loadFromCache = (range, dataType) => {
  try {
    const key = `graph_${dataType}_${range}`;
    const cached = localStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);
    const now = Date.now();

    if (now < cacheData.expiry) {
      return cacheData.data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    return null;
  }
};

/** Limpia entradas de cache expiradas (prefijo graph_) */
const cleanupOldCache = () => {
  try {
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("graph_")) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          if (cached && now >= cached.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
};

/**
 * Borra cache de velas (y relacionados) para un rango.
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} [range='1D']
 */
const forceClearVelasCache = (range = "1D") => {
  try {
    const keys = [
      `graph_velas_${range}`,
      `graph_line_${range}`,
      `graph_bollinger_${range}`,
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * Si es nuevo día en Bogotá (solo 1D), limpia cache y buffer.
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const checkAndClearCacheIfNewDay = (range) => {
  if (range !== "1D") return;

  try {
    const todayBogota = new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "America/Bogota",
      })
    ).toDateString();

    const lastCacheDate = localStorage.getItem("last_cache_date");

    if (lastCacheDate !== todayBogota) {
      forceClearVelasCache(range);
      localStorage.setItem("last_cache_date", todayBogota);
      // Nota: bufRef se define dentro del Provider; aquí sólo se deja la intención.
      // La limpieza real del buffer se maneja en el Provider.
      // bufRef.current = [];
    }
  } catch {
    /* ignore */
  }
};

/* ============== Bloques p/ gráfico ============== */

/**
 * Convierte una serie de puntos {t,v} a dataset de velas OHLC.
 * @param {{t:number,v:number}[]} points
 * @param {number} pointsPerCandle - cantidad de puntos por vela
 */
const toCandles = (points, pointsPerCandle = 6) => {
  const candlesData = [];
  for (let i = 0; i < points.length; i += pointsPerCandle) {
    const chunk = points.slice(i, i + pointsPerCandle);
    if (chunk.length > 0) {
      const opens = chunk.map((p) => p.v);
      const highs = Math.max(...opens);
      const lows = Math.min(...opens);
      candlesData.push({
        time: chunk[0].t,
        open: opens[0],
        high: highs,
        low: lows,
        close: opens[opens.length - 1],
      });
    }
  }
  return candlesData;
};

/**
 * Calcula bandas de Bollinger (SMA +/- k*σ) desde puntos {t,v}.
 * Devuelve bloque tipo Chart.js (labels=timestamps).
 * @param {{t:number,v:number}[]} points
 * @param {number} [period=20]
 * @param {number} [multiplier=2]
 */
const toBollinger = (points, period = 20, multiplier = 2) => {
  if (!Array.isArray(points) || points.length === 0) {
    return {
      labels: [],
      datasets: [
        { label: "Precio", data: [] },
        { label: "SMA", data: [] },
        { label: "Banda Superior", data: [] },
        { label: "Banda Inferior", data: [] },
      ],
    };
  }

  const sorted = [...points].sort((a, b) => a.t - b.t);
  const values = sorted.map((p) => p.v);

  const smaValues = sma(values, period);
  const upperBand = [];
  const lowerBand = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upperBand.push(null);
      lowerBand.push(null);
      continue;
    }

    const start = i - period + 1;
    const end = i + 1;
    const periodValues = values.slice(start, end);

    const mean = smaValues[i];
    const squaredDiffs = periodValues.map((v) => Math.pow(v - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const std = Math.sqrt(variance);

    upperBand.push(mean + multiplier * std);
    lowerBand.push(mean - multiplier * std);
  }

  const labels = sorted.map((p) => p.t);

  return {
    labels,
    datasets: [
      { label: "Precio", data: values },
      { label: "SMA", data: smaValues },
      { label: "Banda Superior", data: upperBand },
      { label: "Banda Inferior", data: lowerBand },
    ],
  };
};

/**
 * Convierte puntos {t,v} a bloque tipo línea (Chart.js-like) + chartData {time,value}.
 * @param {{t:number,v:number}[]} pts
 */
const toLineBlock = (pts, tz = "America/Bogota") => {
  if (!Array.isArray(pts) || pts.length === 0) {
    return {
      labels: [],
      datasets: [{ label: "Cotización USD/COP", data: [] }],
      chartData: [],
    };
  }
  const sorted = [...pts].sort((a, b) => a.t - b.t);
  const chartData = sorted.map((p) => ({ time: p.t, value: p.v }));
  const labels = sorted.map((p) => {
    try {
      const d = new Date(p.t * 1000);
      return d.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      });
    } catch {
      return "00:00";
    }
  });
  const data = sorted.map((p) => p.v);
  return {
    labels,
    datasets: [{ label: "Cotización USD/COP", data }],
    chartData,
  };
};

/**
 * Construye bloque de promedios (precio, SMA8, SMA13) desde puntos {t,v}.
 * @param {{t:number,v:number}[]} pts
 */
const toPromediosBlock = (pts) => {
  const labels = pts.map((p) => p.t);
  const data = pts.map((p) => p.v);
  return {
    labels,
    datasets: [
      { label: "Precio", data },
      { label: "SMA 8", data: sma(data, 8) },
      { label: "SMA 13", data: sma(data, 13) },
    ],
  };
};

/**
 * Normaliza estructura de promedios desde WS/HTTP devolviendo Chart.js-like.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const toPromediosFromWebSocket = (apiResponse, range) => {
  try {
    let chartData;

    if (apiResponse.data?.data?.data) {
      chartData = apiResponse.data.data.data;
    } else if (apiResponse.data?.data) {
      chartData = apiResponse.data.data;
    } else if (apiResponse.data) {
      chartData = apiResponse.data;
    } else {
      chartData = apiResponse;
    }

    if (!chartData?.labels || !chartData?.datasets) {
      return null;
    }

    const { labels, datasets } = chartData;

    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300;
        break;
      case "5D":
        interval = 1800;
        break;
      case "1M":
      case "6M":
      case "1A":
        interval = 86400;
        break;
      default:
        interval = 300;
    }

    const allEqual = labels.every((l) => l === labels[0]);

    const timestamps = labels.map((label, index) => {
      if (allEqual) {
        return now - (labels.length - index - 1) * interval;
      }

      if (range === "1D" && typeof label === "string" && label.includes(":")) {
        return hhmmToUnixTodayBogota(label);
      } else if (typeof label === "string" && label.includes("-")) {
        return fullDateToUnixBogota(label + " 12:00");
      } else {
        return now - (labels.length - index - 1) * interval;
      }
    });

    const block = {
      labels: timestamps,
      datasets: datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data.map((val) => {
          const num = normalizeNumber(val);
          return Number.isFinite(num) ? num : 0;
        }),
      })),
    };

    return block;
  } catch {
    return null;
  }
};

/**
 * Normaliza estructura de bollinger desde WS/HTTP devolviendo Chart.js-like.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const processBollingerData = (apiResponse, range) => {
  try {
    let rawData = apiResponse;
    if (apiResponse?.data?.data?.data) {
      rawData = apiResponse.data.data.data;
    } else if (apiResponse?.data?.data) {
      rawData = apiResponse.data.data;
    } else if (apiResponse?.data) {
      rawData = apiResponse.data;
    }

    if (!rawData || !rawData.labels || !rawData.datasets) {
      return null;
    }

    const { labels, datasets } = rawData;

    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300;
        break;
      case "5D":
        interval = 1800;
        break;
      case "1M":
        interval = 3600;
        break;
      case "6M":
      case "1A":
        interval = 86400;
        break;
      default:
        interval = 300;
    }

    const allEqual = labels.every((l) => l === labels[0]);

    const timestamps = labels.map((label, index) => {
      if (allEqual) {
        return now - (labels.length - index - 1) * interval;
      }

      if (range === "1D" && typeof label === "string" && label.includes(":")) {
        return hhmmToUnixTodayBogota(label);
      } else if (typeof label === "string" && label.includes("-")) {
        return fullDateToUnixBogota(
          label + (label.includes(":") ? "" : " 12:00")
        );
      } else {
        return now - (labels.length - index - 1) * interval;
      }
    });

    const block = {
      labels: timestamps,
      datasets: datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data.map((val) => {
          const num = normalizeNumber(val);
          return Number.isFinite(num) ? num : 0;
        }),
      })),
    };

    return block;
  } catch {
    return null;
  }
};

/**
 * Normaliza respuesta WS de velas (1003) a array de velas {time,open,high,low,close}.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const toVelasFromWebSocket = (apiResponse, range) => {
  try {
    const debugDataStructure = (data) => {
      if (!data) return;
      if (Array.isArray(data)) {
        if (data.length > 0) {
          /* no-op: función sólo para mantener firma */
        }
      } else {
        /* no-op */
      }
    };

    debugDataStructure(apiResponse);

    let chartData;

    if (apiResponse.data?.data?.data) {
      chartData = apiResponse.data.data.data;
    } else if (apiResponse.data?.data) {
      chartData = apiResponse.data.data;
    } else if (apiResponse.data) {
      chartData = apiResponse.data;
    } else {
      chartData = apiResponse;
    }

    diagnose1DData(chartData, range);

    if (!chartData || (!chartData.labels && !chartData.datasets)) {
      const findOHLCData = (obj) => {
        if (Array.isArray(obj)) {
          if (
            obj.length > 0 &&
            obj[0] &&
            typeof obj[0].o === "number" &&
            typeof obj[0].h === "number" &&
            typeof obj[0].l === "number" &&
            typeof obj[0].c === "number"
          ) {
            return obj;
          }
        }
        return null;
      };

      const ohlcData =
        findOHLCData(apiResponse) ||
        findOHLCData(apiResponse?.data) ||
        findOHLCData(apiResponse?.data?.data);

      if (ohlcData) {
        const now = Math.floor(Date.now() / 1000);
        const interval = 300;

        const velas = ohlcData.map((item, index) => ({
          time: now - (ohlcData.length - index - 1) * interval,
          open: normalizeNumber(item.o),
          high: normalizeNumber(item.h),
          low: normalizeNumber(item.l),
          close: normalizeNumber(item.c),
        }));

        const processedVelas = velas.filter(
          (v) => v && v.time && v.open && v.close
        );
        const todayVelas = filterDataByDate(processedVelas, range);

        return todayVelas.length > 0 ? todayVelas : processedVelas;
      } else {
        return null;
      }
    }

    if (!chartData?.labels || !chartData?.datasets) {
      return null;
    }

    const { labels, datasets } = chartData;

    const firstDataset = datasets[0];
    if (
      !firstDataset ||
      !firstDataset.data ||
      !Array.isArray(firstDataset.data)
    ) {
      return null;
    }

    const velasData = firstDataset.data;

    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300;
        break;
      case "5D":
        interval = 1800;
        break;
      case "1M":
        interval = 3600;
        break;
      case "6M":
      case "1A":
        interval = 86400;
        break;
      default:
        interval = 300;
    }

    const velas = [];
    const allEqual = labels.every((l) => l === labels[0]);

    for (let i = 0; i < Math.min(labels.length, velasData.length); i++) {
      const label = labels[i];
      const vela = velasData[i];

      if (!vela) continue;

      let timestamp;

      if (allEqual) {
        timestamp = now - (labels.length - i - 1) * interval;
      } else {
        if (typeof label === "number") {
          timestamp = label;
        } else if (typeof label === "string") {
          if (range === "1D" && label.includes(":")) {
            timestamp = hhmmToUnixTodayBogota(label);
            if (!timestamp) {
              timestamp = now - (labels.length - i - 1) * interval;
            }
          } else if (label.includes("-") && label.includes(":")) {
            timestamp = fullDateToUnixBogota(label);
          } else if (label.includes("-")) {
            timestamp = fullDateToUnixBogota(label + " 12:00");
          } else {
            timestamp = now - (labels.length - i - 1) * interval;
          }
        } else {
          timestamp = now - (labels.length - i - 1) * interval;
        }
      }

      if (timestamp && timestamp > 0) {
        velas.push({
          time: timestamp,
          open: normalizeNumber(vela.o),
          high: normalizeNumber(vela.h),
          low: normalizeNumber(vela.l),
          close: normalizeNumber(vela.c),
        });
      }
    }

    const processedVelas = velas.filter(
      (v) => v && v.time && v.open && v.close
    );

    let todayVelas;
    if (range === "1D") {
      todayVelas = filterDataByDate(processedVelas, range);
      if (todayVelas.length === 0 && processedVelas.length > 0) {
        todayVelas = processedVelas;
      }
    } else {
      todayVelas = filterDataByDate(processedVelas, range);
    }

    return todayVelas.length > 0 ? todayVelas : processedVelas;
  } catch {
    return null;
  }
};

/**
 * Enrutador de procesamiento según tipo (line|velas|promedios|bollinger).
 * @param {any} apiResponse
 * @param {'line'|'velas'|'promedios'|'bollinger'} dataType
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
function processApiData(apiResponse, dataType = "line", range = "1D") {
  try {
    let rawData = apiResponse;
    if (apiResponse?.data?.data?.data) {
      rawData = apiResponse.data.data.data;
    } else if (apiResponse?.data?.data) {
      rawData = apiResponse.data.data;
    } else if (apiResponse?.data) {
      rawData = apiResponse.data;
    }

    if (!rawData) {
      return null;
    }

    switch (dataType) {
      case "velas": {
        const velasResult = toVelasFromWebSocket(apiResponse, range);
        return velasResult;
      }
      case "promedios":
        return toPromediosFromWebSocket(rawData, range);
      case "bollinger":
        return processBollingerData(rawData, range);
      case "line":
        return parseApiResponseToPoints(rawData, range);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/* ============== Parser Mejorado ============== */

/**
 * Parser de arrays simples → puntos {t,v} con spacing por rango.
 * @param {(number|string)[]} dataArray
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const parseSimpleArrayResponse = (dataArray, range) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return [];
  }

  const now = Math.floor(Date.now() / 1000);
  let interval, startTime;

  switch (range) {
    case "1D":
      interval = 60;
      startTime = now - dataArray.length * interval;
      break;
    case "5D":
      interval = 5 * 60;
      startTime = now - 5 * 24 * 60 * 60;
      break;
    case "1M":
      interval = 60 * 60;
      startTime = now - 30 * 24 * 60 * 60;
      break;
    case "6M":
      interval = 24 * 60 * 60;
      startTime = now - 180 * 24 * 60 * 60;
      break;
    case "1A":
      interval = 24 * 60 * 60;
      startTime = now - 365 * 24 * 60 * 60;
      break;
    default:
      interval = 60;
      startTime = now - dataArray.length * interval;
  }

  const points = [];

  for (let i = 0; i < dataArray.length; i++) {
    const price = normalizeNumber(dataArray[i]);
    if (Number.isFinite(price)) {
      points.push({
        t: startTime + i * interval,
        v: price,
      });
    }
  }

  return points;
};

/**
 * Parser robusto: acepta estructura real anidada (data.data.data),
 * datasets/labels directo, arrays simples y recursivo por otras rutas.
 * Siempre retorna puntos {t,v} ordenados, y filtra a “solo hoy” si 1D.
 * @param {any} apiResponse
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const parseApiResponseToPoints = (apiResponse, range) => {
  try {
    if (!apiResponse) {
      return [];
    }

    if (apiResponse.data?.data?.data) {
      const chartData = apiResponse.data.data.data;

      if (chartData.labels && chartData.datasets) {
        const labels = chartData.labels;
        const datasets = chartData.datasets;
        const points = [];

        let values = [];
        for (const dataset of datasets) {
          if (
            dataset.data &&
            Array.isArray(dataset.data) &&
            dataset.data.length > 0
          ) {
            values = dataset.data;
            break;
          }
        }

        if (values.length === 0) {
          return [];
        }

        for (let i = 0; i < Math.min(labels.length, values.length); i++) {
          const label = labels[i];
          const value = values[i];

          if (value === undefined || value === null) continue;

          const numericValue = normalizeNumber(value);
          if (!Number.isFinite(numericValue)) {
            continue;
          }

          let timestamp;

          if (
            range === "1D" &&
            typeof label === "string" &&
            label.includes(":")
          ) {
            timestamp = hhmmToUnixTodayBogota(label);
          } else if (
            typeof label === "string" &&
            label.includes("-") &&
            label.includes(":")
          ) {
            timestamp = fullDateToUnixBogota(label);
          } else if (
            typeof label === "string" &&
            label.includes("-") &&
            !label.includes(":")
          ) {
            timestamp = fullDateToUnixBogota(label + " 12:00");
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
            timestamp = now - (labels.length - i) * (intervals[range] || 300);
          }

          if (timestamp && Number.isFinite(numericValue)) {
            points.push({
              t: timestamp,
              v: numericValue,
            });
          }
        }

        points.sort((a, b) => a.t - b.t);

        const filteredPoints = filterDataByDate(points, range);
        return filteredPoints;
      }
    }

    if (apiResponse.datasets && apiResponse.labels) {
      return parseDatasetsLabels(apiResponse, range);
    }

    if (Array.isArray(apiResponse)) {
      return parseSimpleArrayResponse(apiResponse, range);
    }

    const foundData = findChartDataRecursive(apiResponse);
    if (foundData) {
      return parseDatasetsLabels(foundData, range);
    }

    return [];
  } catch {
    return [];
  }
};

/**
 * Busca recursivamente una estructura con {labels, datasets} hasta cierta profundidad.
 * @param {any} obj
 * @param {number} [depth=0]
 */
const findChartDataRecursive = (obj, depth = 0) => {
  if (depth > 3) return null;

  if (obj && typeof obj === "object") {
    if (obj.labels && obj.datasets) {
      return obj;
    }

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const result = findChartDataRecursive(obj[key], depth + 1);
        if (result) return result;
      }
    }
  }

  return null;
};

/**
 * Parser de formato datasets/labels → puntos {t,v}.
 * @param {{labels:any[], datasets:{data:any[]}[]}} data
 * @param {'1D'|'5D'|'1M'|'6M'|'1A'} range
 */
const parseDatasetsLabels = (data, range) => {
  const labels = data.labels;
  const datasets = data.datasets;
  const points = [];

  if (
    !labels ||
    !datasets ||
    !Array.isArray(labels) ||
    !Array.isArray(datasets)
  ) {
    return [];
  }

  let values = [];
  for (const dataset of datasets) {
    if (dataset.data && Array.isArray(dataset.data) && dataset.data.length > 0) {
      values = dataset.data;
      break;
    }
  }

  for (let i = 0; i < Math.min(labels.length, values.length); i++) {
    const label = labels[i];
    const value = values[i];

    const numericValue = normalizeNumber(value);
    if (!Number.isFinite(numericValue)) continue;

    let timestamp;

    if (range === "1D" && typeof label === "string" && label.includes(":")) {
      timestamp = hhmmToUnixTodayBogota(label);
    } else if (typeof label === "string" && label.includes("-")) {
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
      timestamp = now - (labels.length - i) * (intervals[range] || 300);
    }

    if (timestamp && Number.isFinite(numericValue)) {
      points.push({
        t: timestamp,
        v: numericValue,
      });
    }
  }

  points.sort((a, b) => a.t - b.t);
  return points;
};

/* ============== Provider ============== */

export function WebSocketDataGraficosProvider({ children, range = "1D" }) {
  const {
    dataById,
    chartById: wsCharts,
    request: wsRequest,
  } = useWebSocketData();

  const [chartById, setChartById] = useState({});
  const [httpDataLoaded, setHttpDataLoaded] = useState(false);
  const bufRef = useRef([]);
  const MAX_MINUTES = 24 * 60;

  useEffect(() => {
    cleanupOldCache();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window._gfx = {
        buf: bufRef,
        state: () => ({
          data1001: !!dataById?.[1001],
          data1002: !!dataById?.[1002],
          data1007: !!dataById?.[1007],
          bufLength: bufRef.current.length,
          httpDataLoaded,
          chart1001Points:
            chartById?.[1001]?.[range]?.datasets?.[0]?.data?.length || 0,
          chart1002Points:
            chartById?.[1002]?.[range]?.datasets?.[0]?.data?.length || 0,
        }),
      };
    }
  }, [dataById, chartById, range, httpDataLoaded]);

  /* ===== 1) Datos en tiempo real desde WebSocket ===== */
  useEffect(() => {
    let t = dataById?.[1007];
    if (!t) return;

    if (t.data) t = t.data;

    const tsRaw =
      t.time ?? t.timestamp ?? t.ts ?? t.hora ?? t.fechaHora ?? null;
    const closeRaw =
      t.close ??
      t.lastPrice ??
      t.value ??
      t.c ??
      t.precio ??
      t.valor ??
      t.cierre ??
      null;

    const ts = typeof tsRaw === "number" ? tsRaw : hhmmToUnixTodayBogota(tsRaw);
    const vNum = normalizeNumber(closeRaw);

    if (!Number.isFinite(ts) || !Number.isFinite(vNum)) {
      return;
    }

    const arr = bufRef.current;
    const b = bucketSec(ts, 60);

    const existingIndex = arr.findIndex((p) => p.t === b);

    if (existingIndex >= 0) {
      arr[existingIndex].v = vNum;
    } else {
      arr.push({ t: b, v: vNum });

      if (arr.length > MAX_MINUTES) {
        arr.splice(0, arr.length - MAX_MINUTES);
      }
    }

    arr.sort((a, b2) => a.t - b2.t);

    updateChartsFromPoints(arr, range);
  }, [dataById?.[1007], range]);

  /* ===== 2) WebSocket para Promedios (ID 1002) ===== */
  useEffect(() => {
    const promData = dataById?.[1002];
    if (!promData) {
      return;
    }

    if (promData.status === "success" && promData.data) {
      const promBlock = toPromediosFromWebSocket(promData, range);

      if (promBlock) {
        setChartById((prev) => ({
          ...prev,
          1002: {
            ...(prev[1002] || {}),
            [range]: promBlock,
          },
        }));
      }
    }
  }, [dataById?.[1002], range]);

  /* ===== WebSocket para Velas (ID 1003) ===== */
  useEffect(() => {
    const velasData = dataById?.[1003];

    if (!velasData) {
      return;
    }

    if (velasData.status === "success" && velasData.data) {
      const velasBlock = toVelasFromWebSocket(velasData, range);

      if (velasBlock && velasBlock.length > 0) {
        setChartById((prev) => ({
          ...prev,
          1003: {
            ...(prev[1003] || {}),
            [range]: velasBlock,
          },
        }));

        saveToCache(range, "velas", velasBlock);
      }
    }
  }, [dataById?.[1003], range]);

  /* ===== 4) HTTP principal (línea) con Cache ===== */
  useEffect(() => {
    checkAndClearCacheIfNewDay(range);

    const cachedData = loadFromCache(range, "line");

    if (cachedData && cachedData.length > 0) {
      bufRef.current = cachedData;
      updateChartsFromPoints(cachedData, range);
      setHttpDataLoaded(true);
      return;
    }

    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          return;
        }

        const periodMap = {
          "1D": "1D",
          "5D": "5D",
          "1M": "1M",
          "6M": "6M",
          "1A": "1A",
        };

        const periodo = periodMap[range] || "1D";

        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/graficos/graficoPrecios",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              mercado: 71,
              moneda: "USD/COP",
              periodo: periodo,
            }),
          }
        );

        if (!res.ok) {
          return;
        }

        const responseData = await res.json();

        const points = parseApiResponseToPoints(responseData, range);

        if (points.length === 0) {
          bufRef.current = [];
          setHttpDataLoaded(true);
          return;
        }

        const todayPoints = filterDataByDate(points, range);

        if (todayPoints.length === 0) {
          bufRef.current = [];
          setHttpDataLoaded(true);
          return;
        }

        bufRef.current = todayPoints;
        updateChartsFromPoints(todayPoints, range);

        saveToCache(range, "line", points);
        setHttpDataLoaded(true);
      } catch {
        /* ignore */
      }
    })();
  }, [range]);

  /* ===== 4) Carga HTTP para Promedios (ID 1002) ===== */
  useEffect(() => {
    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          return;
        }

        const periodMap = {
          "1D": "1D",
          "5D": "5D",
          "1M": "1M",
          "6M": "6M",
          "1A": "1A",
        };

        const periodo = periodMap[range] || "1D";

        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/graficos/graficoPromedios",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              mercado: 71,
              moneda: "USD/COP",
              periodo: periodo,
            }),
          }
        );

        if (!res.ok) {
          return;
        }

        const responseData = await res.json();

        const promBlock = toPromediosFromWebSocket(responseData, range);

        if (promBlock) {
          setChartById((prev) => ({
            ...prev,
            1002: {
              ...(prev[1002] || {}),
              [range]: promBlock,
            },
          }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [range]);

  /* ===== 6) HTTP: Velas (ID 1003) ===== */
  useEffect(() => {
    if (range === "1D") {
      checkAndClearCacheIfNewDay(range);
    }

    const cachedData = loadFromCache(range, "velas");
    if (cachedData) {
      setChartById((prev) => ({
        ...prev,
        1003: {
          ...(prev[1003] || {}),
          [range]: cachedData,
        },
      }));
      return;
    }

    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          return;
        }

        const periodMap = {
          "1D": "1d",
          "5D": "5d",
          "1M": "1m",
          "6M": "6m",
          "1A": "1a",
        };

        const periodo = periodMap[range] || "1d";

        const requestBody = {
          mercado: 71,
          moneda: "USD/COP",
          periodo: periodo,
          sma: 20,
          desv: 2,
        };

        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/graficos/graficoVelas",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!res.ok) {
          return;
        }

        const responseData = await res.json();

        let velasBlock = null;

        if (responseData.status === "success") {
          velasBlock = processApiData(responseData, "velas", range);
        }

        if (range === "1D" && (!velasBlock || velasBlock.length === 0)) {
          const points = parseApiResponseToPoints(responseData, range);
          if (points && points.length > 0) {
            velasBlock = toCandles(points, 300);
          }
        }

        if (velasBlock && Array.isArray(velasBlock)) {
          const todayVelas = filterDataByDate(velasBlock, range);
          velasBlock = todayVelas.length > 0 ? todayVelas : velasBlock;
        }

        if (velasBlock && velasBlock.length > 0) {
          saveToCache(range, "velas", velasBlock);

          setChartById((prev) => ({
            ...prev,
            1003: {
              ...(prev[1003] || {}),
              [range]: velasBlock,
            },
          }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [range]);

  /* ===== 7) HTTP: Bollinger (ID 1004) ===== */
  useEffect(() => {
    const cachedData = loadFromCache(range, "bollinger");
    if (cachedData) {
      setChartById((prev) => ({
        ...prev,
        1004: {
          ...(prev[1004] || {}),
          [range]: cachedData,
        },
      }));
      return;
    }

    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          return;
        }

        const periodMap = {
          "1D": "1d",
          "5D": "5d",
          "1M": "1m",
          "6M": "6m",
          "1A": "1a",
        };

        const periodo = periodMap[range] || "1d";

        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/graficos/graficoBollinger",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              mercado: 71,
              moneda: "USD/COP",
              periodo: periodo,
              sma: 20,
              desv: 2,
            }),
          }
        );

        if (!res.ok) {
          return;
        }

        const responseData = await res.json();

        const bollingerBlock = processApiData(
          responseData,
          "bollinger",
          range
        );

        if (bollingerBlock) {
          saveToCache(range, "bollinger", bollingerBlock);

          setChartById((prev) => ({
            ...prev,
            1004: {
              ...(prev[1004] || {}),
              [range]: bollingerBlock,
            },
          }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [range]);

  /* ===== 8) Diagnóstico completo de velas (silencioso) ===== */
  useEffect(() => {
    const cachedVelas = loadFromCache(range, "velas");
    void cachedVelas;
  }, [dataById?.[1003], chartById?.[1003]?.[range], range, httpDataLoaded]);

  const updateChartsFromPoints = (points, currentRange) => {
    const lineBlk = toLineBlock(points);

    let velaFrameSec = 60;
    if (currentRange === "5D") velaFrameSec = 300;
    if (currentRange === "1M") velaFrameSec = 3600;
    if (currentRange === "6M" || currentRange === "1A") velaFrameSec = 86400;
    void velaFrameSec; // reservado para futuros derivados

    const bollBlk = toBollinger(points, 20);

    setChartById((prev) => ({
      ...prev,
      1001: { ...(prev[1001] || {}), [currentRange]: lineBlk },
      1004: { ...(prev[1004] || {}), [currentRange]: bollBlk },
    }));
  };

  const request = useCallback(
    (msg) => {
      try {
        wsRequest?.(msg);
      } catch {
        /* ignore */
      }
    },
    [wsRequest]
  );

  const useChartPayload = (id, lapse = "1D") =>
    chartById[id]?.[(lapse || "1D").toUpperCase()] ?? null;

  return (
    <Ctx.Provider value={{ request, useChartPayload, httpDataLoaded }}>
      {children}
    </Ctx.Provider>
  );
}
