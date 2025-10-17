// src/app/services/WebSocketDataProviderGraficos.js
"use client";

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
const Ctx = createContext(null);
export const useWebSocketDataGrafico = () => useContext(Ctx);

/* ============== Helpers ============== */

const bucketSec = (t, size = 60) => Math.floor(t / size) * size;

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

const normalizeNumber = (x) => {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = Number(x.replace(/\s+/g, "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

// Función corregida para convertir hora HH:mm a timestamp de Bogotá (UTC-5)
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

    // Obtener la fecha actual EN LA ZONA HORARIA LOCAL del navegador
    const now = new Date();
    
    // Crear fecha específica para hoy en Bogotá
    const todayBogota = new Date(now.toLocaleString("en-US", { 
      timeZone: "America/Bogota" 
    }));
    
    // Establecer la hora específica
    todayBogota.setHours(hh, mm, 0, 0);
    
    // Convertir a timestamp Unix
    const timestamp = Math.floor(todayBogota.getTime() / 1000);

    console.log(
      `⏰ [TIME_CONV_TODAY] ${hhmm} -> ${timestamp} (${new Date(
        timestamp * 1000
      ).toLocaleString("es-CO", { timeZone: "America/Bogota" })})`
    );

    return timestamp;
  } catch (error) {
    console.error(`💥 [TIME_CONV] Error con ${hhmm}:`, error);
    return null;
  }
};

// Función mejorada para convertir fecha completa a timestamp Bogotá
const fullDateToUnixBogota = (dateStr) => {
  try {
    console.log(`📅 [DATE_CONVERSION] Convirtiendo: ${dateStr}`);

    let date;

    if (dateStr.includes("-") && dateStr.includes(":")) {
      // Formato: YYYY-MM-DD HH:mm
      const [datePart, timePart] = dateStr.split(" ");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      // Crear fecha en zona horaria de Bogotá (UTC-5)
      const bogotaDateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:00-05:00`;
      date = new Date(bogotaDateStr);

      if (isNaN(date.getTime())) {
        // Fallback a UTC
        date = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
      }
    } else if (dateStr.includes("-")) {
      // Formato: YYYY-MM-DD
      const [year, month, day] = dateStr.split("-").map(Number);

      // Crear fecha en Bogotá al mediodía
      const bogotaDateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}T12:00:00-05:00`;
      date = new Date(bogotaDateStr);

      if (isNaN(date.getTime())) {
        // Fallback a UTC
        date = new Date(Date.UTC(year, month - 1, day, 12 + 5, 0, 0));
      }
    } else {
      console.warn(`❌ [DATE_CONVERSION] Formato no reconocido: ${dateStr}`);
      return null;
    }

    if (isNaN(date.getTime())) {
      console.warn(`❌ [DATE_CONVERSION] Fecha inválida: ${dateStr}`);
      return null;
    }

    const timestamp = Math.floor(date.getTime() / 1000);
    console.log(
      `✅ [DATE_CONVERSION] ${dateStr} -> ${timestamp} (${new Date(
        timestamp * 1000
      ).toLocaleString("es-CO", { timeZone: "America/Bogota" })})`
    );
    return timestamp;
  } catch (error) {
    console.error(`💥 [DATE_CONVERSION] Error con ${dateStr}:`, error);
    return null;
  }
};

// Función corregida para filtrar datos SOLO por hoy
const filterDataByDate = (data, range = "1D") => {
  if (range !== "1D" || !Array.isArray(data)) return data;
  
  try {
    // Obtener la fecha actual EN BOGOTÁ
    const nowBogota = new Date(new Date().toLocaleString("en-US", { 
      timeZone: "America/Bogota" 
    }));
    
    // Calcular inicio del día actual en Bogotá (00:00:00)
    const startOfToday = new Date(nowBogota);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayTimestamp = Math.floor(startOfToday.getTime() / 1000);
    
    // Calcular fin del día actual en Bogotá (23:59:59)
    const endOfToday = new Date(nowBogota);
    endOfToday.setHours(23, 59, 59, 999);
    const endOfTodayTimestamp = Math.floor(endOfToday.getTime() / 1000);
    
    console.log(`📅 [FILTER_BY_DATE] Filtrando para HOY: ${startOfToday.toLocaleDateString("es-CO")}`, {
      inicio: new Date(startOfTodayTimestamp * 1000).toLocaleString("es-CO"),
      fin: new Date(endOfTodayTimestamp * 1000).toLocaleString("es-CO")
    });

    // Filtrar datos que estén dentro del día de HOY
    const filteredData = data.filter(item => {
      const itemTime = item.time || item.t;
      return itemTime >= startOfTodayTimestamp && itemTime <= endOfTodayTimestamp;
    });
    
    console.log(`✅ [FILTER_BY_DATE] De ${data.length} a ${filteredData.length} puntos de HOY`);
    
    return filteredData;
  } catch (error) {
    console.error("💥 [FILTER_BY_DATE] Error filtrando datos:", error);
    return data;
  }
};

/* ============== Sistema de Cache Mejorado ============== */

const GRAPH_CACHE_CONFIG = {
  "1D": { expiry: 5 * 60 * 1000 }, // 5 minutos para datos intraday
  "5D": { expiry: 30 * 60 * 1000 }, // 30 minutos
  "1M": { expiry: 2 * 60 * 60 * 1000 }, // 2 horas
  "6M": { expiry: 6 * 60 * 60 * 1000 }, // 6 horas
  "1A": { expiry: 12 * 60 * 60 * 1000 }, // 12 horas
};

// Función para forzar actualización de cache
const forceCacheRefresh = (range) => {
  try {
    const keys = [
      `graph_line_${range}`,
      `graph_velas_${range}`,
      `graph_bollinger_${range}`,
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ [CACHE] Forzado refresh: ${key}`);
    });

    return true;
  } catch (error) {
    console.warn("❌ [CACHE] Error forzando refresh:", error);
    return false;
  }
};

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
    console.log(`💾 [CACHE] Datos guardados: ${key}`, { puntos: data.length });
    return true;
  } catch (error) {
    console.warn("❌ [CACHE] Error guardando en cache:", error);
    return false;
  }
};

const loadFromCache = (range, dataType) => {
  try {
    const key = `graph_${dataType}_${range}`;
    const cached = localStorage.getItem(key);

    if (!cached) {
      console.log(`📂 [CACHE] No hay cache para: ${key}`);
      return null;
    }

    const cacheData = JSON.parse(cached);
    const now = Date.now();

    if (now < cacheData.expiry) {
      console.log(`📂 [CACHE] Datos recuperados: ${key}`, {
        puntos: cacheData.data.length,
        edad:
          Math.round((now - cacheData.timestamp) / (1000 * 60)) + " minutos",
      });
      return cacheData.data;
    } else {
      localStorage.removeItem(key);
      console.log(`🗑️ [CACHE] Datos expirados eliminados: ${key}`);
      return null;
    }
  } catch (error) {
    console.warn("❌ [CACHE] Error leyendo cache:", error);
    return null;
  }
};

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
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
    }
    console.log("🧹 [CACHE] Cache antiguo limpiado");
  } catch (e) {
    console.warn("Error limpiando cache:", e);
  }
};
// Función para forzar limpieza de cache de velas
const forceClearVelasCache = (range = "1D") => {
  try {
    const keys = [
      `graph_velas_${range}`,
      `graph_line_${range}`,
      `graph_bollinger_${range}`,
    ];

    keys.forEach((key) => {
      localStorage.removeItem(key);
      console.log(`🗑️ [CACHE] Eliminado: ${key}`);
    });

    console.log(`✅ [CACHE] Cache forzado limpiado para rango: ${range}`);
    return true;
  } catch (error) {
    console.warn("❌ [CACHE] Error forzando limpieza:", error);
    return false;
  }
};

// Función mejorada para verificar y limpiar cache si es nuevo día
const checkAndClearCacheIfNewDay = (range) => {
  if (range !== "1D") return;
  
  try {
    // Obtener fecha actual en Bogotá
    const todayBogota = new Date(new Date().toLocaleString("en-US", { 
      timeZone: "America/Bogota" 
    })).toDateString();
    
    const lastCacheDate = localStorage.getItem('last_cache_date');
    
    if (lastCacheDate !== todayBogota) {
      console.log(`🔄 [NEW_DAY_CACHE] Nuevo día detectado (${todayBogota}), limpiando cache...`);
      forceClearVelasCache(range);
      localStorage.setItem('last_cache_date', todayBogota);
      
      // También limpiar datos del buffer
      bufRef.current = [];
      console.log("🧹 [NEW_DAY_CACHE] Buffer limpiado");
    }
  } catch (error) {
    console.warn("❌ [NEW_DAY_CACHE] Error:", error);
  }
};

/* ============== Bloques p/ gráfico ============== */

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
        timeZone: "America/Bogota",
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

// FUNCIÓN CORREGIDA: Para procesar datos específicos de promedios
const toPromediosFromWebSocket = (apiResponse, range) => {
  try {
    console.log(
      "🔍 [PROMEDIOS_WS] Procesando datos para promedios:",
      apiResponse
    );

    // EXTRAER LA ESTRUCTURA CORRECTA - según tu respuesta real
    let chartData;

    if (apiResponse.data?.data?.data) {
      // Estructura: data.data.data (la que muestras en la respuesta)
      chartData = apiResponse.data.data.data;
    } else if (apiResponse.data?.data) {
      // Estructura: data.data
      chartData = apiResponse.data.data;
    } else if (apiResponse.data) {
      // Estructura: data
      chartData = apiResponse.data;
    } else {
      chartData = apiResponse;
    }

    console.log("📊 [PROMEDIOS_WS] ChartData extraído:", chartData);

    if (!chartData?.labels || !chartData?.datasets) {
      console.warn("❌ [PROMEDIOS_WS] Datos de gráfico incompletos");
      return null;
    }

    const { labels, datasets } = chartData;

    console.log(
      `📊 [PROMEDIOS_WS] Procesando: ${labels.length} labels, ${datasets.length} datasets`
    );

    // Generar timestamps progresivos para labels duplicadas
    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300; // 5 minutos
        break;
      case "5D":
        interval = 1800; // 30 minutos
        break;
      case "1M":
        interval = 86400; // 1 día
        break;
      case "6M":
        interval = 86400; // 1 día
        break;
      case "1A":
        interval = 86400; // 1 día
        break;
      default:
        interval = 300;
    }

    const timestamps = labels.map((label, index) => {
      // Si todas las labels son iguales, generar timestamps progresivos
      if (labels.every((l) => l === labels[0])) {
        return now - (labels.length - index - 1) * interval;
      }

      // Intentar parsear la fecha normalmente
      if (range === "1D" && typeof label === "string" && label.includes(":")) {
        return hhmmToUnixTodayBogota(label);
      } else if (typeof label === "string" && label.includes("-")) {
        return fullDateToUnixBogota(label + " 12:00");
      } else {
        return now - (labels.length - index - 1) * interval;
      }
    });

    // Crear el bloque de datos CORREGIDO
    const block = {
      labels: timestamps,
      datasets: datasets.map((dataset, idx) => ({
        label: dataset.label,
        data: dataset.data.map((val) => {
          const num = normalizeNumber(val);
          return Number.isFinite(num) ? num : 0;
        }),
      })),
    };

    console.log("✅ [PROMEDIOS_WS] Bloque de promedios creado:", {
      labels: block.labels.length,
      datasets: block.datasets.map((d) => ({
        label: d.label,
        puntos: d.data.length,
        primerosValores: d.data.slice(0, 3), // Mostrar primeros valores para debug
      })),
    });

    return block;
  } catch (error) {
    console.error("💥 [PROMEDIOS_WS] Error procesando datos:", error);
    return null;
  }
};

// FUNCIÓN PARA PROCESAR DATOS DE BOLLINGER
const processBollingerData = (apiResponse, range) => {
  try {
    console.log(
      "🔍 [BOLLINGER_DATA] Procesando datos de Bollinger:",
      apiResponse
    );

    // Extraer datos de la estructura anidada
    let rawData = apiResponse;
    if (apiResponse?.data?.data?.data) {
      rawData = apiResponse.data.data.data;
    } else if (apiResponse?.data?.data) {
      rawData = apiResponse.data.data;
    } else if (apiResponse?.data) {
      rawData = apiResponse.data;
    }

    if (!rawData) {
      console.warn("❌ [BOLLINGER_DATA] No se pudieron extraer datos");
      return null;
    }

    // Verificar estructura Chart.js
    if (!rawData.labels || !rawData.datasets) {
      console.warn("❌ [BOLLINGER_DATA] Estructura Chart.js no encontrada");
      return null;
    }

    const { labels, datasets } = rawData;

    console.log(
      `📊 [BOLLINGER_DATA] Procesando: ${labels.length} labels, ${datasets.length} datasets`
    );

    // Generar timestamps
    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300; // 5 minutos
        break;
      case "5D":
        interval = 1800; // 30 minutos
        break;
      case "1M":
        interval = 3600; // 1 hora
        break;
      case "6M":
      case "1A":
        interval = 86400; // 1 día
        break;
      default:
        interval = 300;
    }

    const timestamps = labels.map((label, index) => {
      // Si todas las labels son iguales, generar timestamps progresivos
      if (labels.every((l) => l === labels[0])) {
        return now - (labels.length - index - 1) * interval;
      }

      // Parsear según el formato
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

    // Crear el bloque de datos para Bollinger
    const block = {
      labels: timestamps,
      datasets: datasets.map((dataset, idx) => ({
        label: dataset.label,
        data: dataset.data.map((val) => {
          const num = normalizeNumber(val);
          return Number.isFinite(num) ? num : 0;
        }),
      })),
    };

    console.log("✅ [BOLLINGER_DATA] Bloque de Bollinger creado:", {
      labels: block.labels.length,
      datasets: block.datasets.map((d) => ({
        label: d.label,
        puntos: d.data.length,
        primerosValores: d.data.slice(0, 3),
      })),
    });

    return block;
  } catch (error) {
    console.error("💥 [BOLLINGER_DATA] Error procesando datos:", error);
    return null;
  }
};

// FUNCIÓN MEJORADA: Para manejar la estructura REAL de velas del WebSocket
const toVelasFromWebSocket = (apiResponse, range) => {
  try {
    console.log("🔍 [VELAS_WS] Iniciando procesamiento:", {
      status: apiResponse?.status,
      message: apiResponse?.message,
      tieneData: !!apiResponse?.data
    });

    // Función de diagnóstico temporal
    const debugDataStructure = (data) => {
      console.log("🔍 [DEBUG_ESTRUCTURA] Analizando estructura:");
      
      if (!data) {
        console.log("❌ Datos nulos");
        return;
      }
      
      console.log("Tipo:", typeof data);
      console.log("Es array:", Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log("Longitud:", data.length);
        if (data.length > 0) {
          console.log("Primer elemento:", data[0]);
          console.log("Keys del primer elemento:", Object.keys(data[0]));
        }
      } else {
        console.log("Keys del objeto:", Object.keys(data));
      }
    };

    console.log("🔍 [VELAS_WS] Estructura completa de datos:");
    debugDataStructure(apiResponse);

    // EXTRAER LA ESTRUCTURA CORRECTA - según tu respuesta real
    let chartData;

    if (apiResponse.data?.data?.data) {
      // Estructura: data.data.data (la que muestras en la respuesta)
      chartData = apiResponse.data.data.data;
    } else if (apiResponse.data?.data) {
      // Estructura: data.data
      chartData = apiResponse.data.data;
    } else if (apiResponse.data) {
      // Estructura: data
      chartData = apiResponse.data;
    } else {
      chartData = apiResponse;
    }

    console.log("📊 [VELAS_WS] ChartData extraído:", chartData);

    // VERIFICACIÓN ADICIONAL: Si no hay estructura Chart.js, buscar datos directamente
    if (!chartData || (!chartData.labels && !chartData.datasets)) {
      console.log("🔄 [VELAS_WS] Buscando datos OHLC directamente...");
      
      // Intentar encontrar datos OHLC en la estructura
      const findOHLCData = (obj) => {
        if (Array.isArray(obj)) {
          // Verificar si es un array de objetos OHLC
          if (obj.length > 0 && obj[0] && 
              typeof obj[0].o === 'number' && 
              typeof obj[0].h === 'number' && 
              typeof obj[0].l === 'number' && 
              typeof obj[0].c === 'number') {
            return obj;
          }
        }
        return null;
      };

      const ohlcData = findOHLCData(apiResponse) || 
                      findOHLCData(apiResponse?.data) || 
                      findOHLCData(apiResponse?.data?.data);

      if (ohlcData) {
        console.log(`✅ [VELAS_WS] Encontrados ${ohlcData.length} datos OHLC directamente`);
        
        const now = Math.floor(Date.now() / 1000);
        let interval = 300; // 5 minutos por defecto

        const velas = ohlcData.map((item, index) => ({
          time: now - (ohlcData.length - index - 1) * interval,
          open: normalizeNumber(item.o),
          high: normalizeNumber(item.h),
          low: normalizeNumber(item.l),
          close: normalizeNumber(item.c),
        }));

        return velas;
      } else {
        console.warn("❌ [VELAS_WS] No se pudieron encontrar datos OHLC directamente");
        return null;
      }
    }

    if (!chartData?.labels || !chartData?.datasets) {
      console.warn("❌ [VELAS_WS] Datos de gráfico incompletos");
      return null;
    }

    const { labels, datasets } = chartData;

    console.log(
      `📊 [VELAS_WS] Procesando: ${labels.length} labels, ${datasets.length} datasets`
    );

    // Verificar que el dataset tenga datos de velas
    const firstDataset = datasets[0];
    if (!firstDataset || !firstDataset.data || !Array.isArray(firstDataset.data)) {
      console.warn("❌ [VELAS_WS] Dataset no válido");
      return null;
    }

    // Los datos de velas están en firstDataset.data como array de objetos {o, h, l, c}
    const velasData = firstDataset.data;

    // Generar timestamps para cada label
    const now = Math.floor(Date.now() / 1000);
    let interval;

    switch (range) {
      case "1D":
        interval = 300; // 5 minutos
        break;
      case "5D":
        interval = 1800; // 30 minutos
        break;
      case "1M":
        interval = 3600; // 1 hora
        break;
      case "6M":
        interval = 86400; // 1 día
        break;
      case "1A":
        interval = 86400; // 1 día
        break;
      default:
        interval = 300;
    }

    const velas = [];

    for (let i = 0; i < Math.min(labels.length, velasData.length); i++) {
      const label = labels[i];
      const vela = velasData[i];

      if (!vela) continue;

      let timestamp;

      // ESTRATEGIA MEJORADA: Si todas las labels son iguales, usar timestamps progresivos
      if (labels.every(l => l === labels[0])) {
        timestamp = now - (labels.length - i - 1) * interval;
      } else {
        // Convertir label a timestamp
        if (typeof label === "number") {
          timestamp = label;
        } else if (typeof label === "string") {
          if (range === "1D" && label.includes(":")) {
            timestamp = hhmmToUnixTodayBogota(label);
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

    console.log(`✅ [VELAS_WS] ${velas.length} velas procesadas`);
    
    // VERIFICACIÓN FINAL: Si tenemos muy pocas velas para 1D, considerar usar fallback
    if (range === "1D" && velas.length < 50) {
      console.warn(`⚠️ [VELAS_WS] Muy pocas velas para 1D: ${velas.length}, el backend podría estar fallando`);
    }
    
     const processedVelas = velas.filter(v => v && v.time && v.open && v.close);
    const todayVelas = filterDataByDate(processedVelas, range);
    return todayVelas.length > 0 ? todayVelas : null;

    // ==== FIN DE AGREGADO ====
  } catch (error) {
    console.error("💥 [VELAS_WS] Error procesando datos:", error);
    return null;
  }
};

// FUNCIÓN DE FALLBACK PARA DATOS DE VELAS (SOLO PARA DEBUG)
const generateFallbackVelasData = (range) => {
  console.log("🔄 [FALLBACK_VELAS] Generando datos de prueba para", range);

  const now = Math.floor(Date.now() / 1000);
  let interval, count;

  switch (range) {
    case "1D":
      interval = 300; // 5 minutos
      count = 288; // 24 horas en periodos de 5 min
      break;
    case "5D":
      interval = 1800; // 30 minutos
      count = 240; // 5 días en periodos de 30 min
      break;
    case "1M":
      interval = 3600; // 1 hora
      count = 720; // 30 días
      break;
    case "6M":
      interval = 86400; // 1 día
      count = 180; // 6 meses
      break;
    case "1A":
      interval = 86400; // 1 día
      count = 365; // 1 año
      break;
    default:
      interval = 300;
      count = 100;
  }

  const velas = [];
  let basePrice = 3800; // Precio base COP

  for (let i = 0; i < count; i++) {
    const time = now - (count - i - 1) * interval;
    const variation = (Math.random() - 0.5) * 20; // Variación de ±10 COP
    const open = basePrice + variation;
    const close = open + (Math.random() - 0.5) * 10;
    const high = Math.max(open, close) + Math.random() * 5;
    const low = Math.min(open, close) - Math.random() * 5;

    velas.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    basePrice = close;
  }

  console.log(`✅ [FALLBACK_VELAS] ${velas.length} velas de prueba generadas`);
  return velas;
};

function processApiData(apiResponse, dataType = "line", range = "1D") {
  console.log(
    `🔍 [PROCESS_API] Procesando datos tipo ${dataType} para rango ${range}`,
    {
      status: apiResponse?.status,
      message: apiResponse?.message,
      tieneData: !!apiResponse?.data,
    }
  );

  try {
    // Extraer datos de la estructura anidada común
    let rawData = apiResponse;
    if (apiResponse?.data?.data?.data) {
      rawData = apiResponse.data.data.data;
    } else if (apiResponse?.data?.data) {
      rawData = apiResponse.data.data;
    } else if (apiResponse?.data) {
      rawData = apiResponse.data;
    }

    if (!rawData) {
      console.warn("❌ [PROCESS_API] No se pudieron extraer datos");
      return null;
    }

    // Procesar según el tipo de gráfico
    switch (dataType) {
      case "velas":
        console.log(`🔍 [PROCESS_API_VELAS] Procesando datos de velas...`);
        const velasResult = toVelasFromWebSocket(apiResponse, range);
        
        // DIAGNÓSTICO: Mostrar información sobre el resultado
        console.log(`📊 [PROCESS_API_VELAS] Resultado:`, {
          tieneResultado: !!velasResult,
          cantidad: velasResult?.length || 0,
          range: range
        });
        
        return velasResult;
        
      case "promedios":
        return toPromediosFromWebSocket(rawData, range);
      case "bollinger":
        return processBollingerData(rawData, range);
      case "line":
        return parseApiResponseToPoints(rawData, range);
      default:
        console.warn(
          `❌ [PROCESS_API] Tipo de datos no soportado: ${dataType}`
        );
        return null;
    }
  } catch (error) {
    console.error("💥 [PROCESS_API] Error procesando datos:", error);
    return null;
  }
}

const toCandles = (pts, frameSec = 60) => {
  const by = new Map();
  for (const p of pts) {
    const b = bucketSec(p.t, frameSec);
    const cur = by.get(b);
    if (cur) {
      cur.h = Math.max(cur.h, p.v);
      cur.l = Math.min(cur.l, p.v);
      cur.c = p.v;
    } else {
      by.set(b, { t: b, o: p.v, h: p.v, l: p.v, c: p.v });
    }
  }
  const buckets = [...by.values()].sort((a, b) => a.t - b.t);
  return {
    labels: buckets.map((b) => b.t),
    datasets: [
      { label: "O", data: buckets.map((b) => b.o) },
      { label: "H", data: buckets.map((b) => b.h) },
      { label: "L", data: buckets.map((b) => b.l) },
      { label: "C", data: buckets.map((b) => b.c) },
    ],
  };
};

const toBollinger = (pts, period = 20) => {
  const vals = pts.map((p) => p.v);
  const labels = pts.map((p) => p.t);
  const mean = sma(vals, period);
  const upper = Array(vals.length).fill(null);
  const lower = Array(vals.length).fill(null);
  for (let i = period - 1; i < vals.length; i++) {
    const win = vals.slice(i - (period - 1), i + 1);
    const m = mean[i];
    const variance = win.reduce((a, v) => a + (v - m) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = +(m + 2 * std).toFixed(2);
    lower[i] = +(m - 2 * std).toFixed(2);
  }
  return {
    labels,
    datasets: [
      { label: "Precio", data: vals },
      { label: "SMA 20", data: mean },
      { label: "Lower", data: lower },
      { label: "Upper", data: upper },
    ],
  };
};

/* ============== Parser Mejorado ============== */

// Función para parsear array simple
const parseSimpleArrayResponse = (dataArray, range) => {
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    console.warn("[SIMPLE_ARRAY] Datos no válidos o vacíos");
    return [];
  }

  console.log(
    `[SIMPLE_ARRAY] Procesando ${dataArray.length} puntos para rango ${range}`
  );

  const now = Math.floor(Date.now() / 1000);
  let interval, startTime;

  // Configurar intervalo y tiempo de inicio según el rango
  switch (range) {
    case "1D":
      interval = 60; // 1 minuto
      startTime = now - dataArray.length * interval;
      break;
    case "5D":
      interval = 5 * 60; // 5 minutos
      startTime = now - 5 * 24 * 60 * 60; // 5 días atrás
      break;
    case "1M":
      interval = 60 * 60; // 1 hora
      startTime = now - 30 * 24 * 60 * 60; // 30 días atrás
      break;
    case "6M":
      interval = 24 * 60 * 60; // 1 día
      startTime = now - 180 * 24 * 60 * 60; // 180 días atrás
      break;
    case "1A":
      interval = 24 * 60 * 60; // 1 día
      startTime = now - 365 * 24 * 60 * 60; // 365 días atrás
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

  console.log(`[SIMPLE_ARRAY] Generados ${points.length} puntos`);
  return points;
};

// Función de parseo mejorada
const parseApiResponseToPoints = (apiResponse, range) => {
  try {
    console.log("🔍 [PARSE_API_RESPONSE] Iniciando parseo:", {
      range,
      tieneResponse: !!apiResponse,
      estructura: Object.keys(apiResponse || {}),
    });

    if (!apiResponse) {
      console.warn("❌ [PARSE_API_RESPONSE] Response vacío");
      return [];
    }

    // DEBUG: Mostrar estructura completa para entender los datos
    console.log("🔍 [PARSE_API_DEBUG] Estructura completa:", {
      rootKeys: Object.keys(apiResponse),
      dataKeys: apiResponse.data ? Object.keys(apiResponse.data) : "NO_DATA",
      dataDataKeys: apiResponse.data?.data
        ? Object.keys(apiResponse.data.data)
        : "NO_DATA_DATA",
      dataDataDataKeys: apiResponse.data?.data?.data
        ? Object.keys(apiResponse.data.data.data)
        : "NO_DATA_DATA_DATA",
    });

    // CASO 1: Estructura anidada data.data.data (la real de la API)
    if (apiResponse.data?.data?.data) {
      console.log(
        "📊 [PARSE_API_RESPONSE] Estructura data.data.data detectada"
      );
      const chartData = apiResponse.data.data.data;

      if (chartData.labels && chartData.datasets) {
        console.log(
          `📊 [PARSE_API_RESPONSE] Procesando ${chartData.labels.length} labels`
        );

        const labels = chartData.labels;
        const datasets = chartData.datasets;
        const points = [];

        // Buscar el primer dataset con datos
        let values = [];
        for (const dataset of datasets) {
          if (
            dataset.data &&
            Array.isArray(dataset.data) &&
            dataset.data.length > 0
          ) {
            values = dataset.data;
            console.log(
              `📊 [PARSE_API_RESPONSE] Encontrados ${values.length} valores en dataset`
            );
            break;
          }
        }

        if (values.length === 0) {
          console.warn(
            "❌ [PARSE_API_RESPONSE] No se encontraron valores en datasets"
          );
          return [];
        }

        console.log(
          `📊 [PARSE_API_RESPONSE] Procesando ${Math.min(
            labels.length,
            values.length
          )} puntos`
        );

        for (let i = 0; i < Math.min(labels.length, values.length); i++) {
          const label = labels[i];
          const value = values[i];

          if (value === undefined || value === null) continue;

          const numericValue = normalizeNumber(value);
          if (!Number.isFinite(numericValue)) {
            console.warn(
              `⚠️ [PARSE_API_RESPONSE] Valor no numérico en índice ${i}:`,
              value
            );
            continue;
          }

          let timestamp;

          // Determinar formato de timestamp basado en el rango y tipo de label
          if (
            range === "1D" &&
            typeof label === "string" &&
            label.includes(":")
          ) {
            // Formato HH:mm para 1D
            timestamp = hhmmToUnixTodayBogota(label);
          } else if (
            typeof label === "string" &&
            label.includes("-") &&
            label.includes(":")
          ) {
            // Formato YYYY-MM-DD HH:mm para 5D, 1M
            timestamp = fullDateToUnixBogota(label);
          } else if (
            typeof label === "string" &&
            label.includes("-") &&
            !label.includes(":")
          ) {
            // Formato YYYY-MM-DD para 6M, 1A
            timestamp = fullDateToUnixBogota(label + " 12:00"); // Mediodía como hora por defecto
          } else if (typeof label === "number") {
            // Ya es timestamp
            timestamp = label;
          } else {
            // Fallback: generar timestamp basado en posición
            console.warn(
              `⚠️ [PARSE_API_RESPONSE] Formato de label no reconocido: ${label}`
            );
            const now = Math.floor(Date.now() / 1000);
            const intervals = {
              "1D": 300, // 5 minutos
              "5D": 1800, // 30 minutos
              "1M": 86400, // 1 día
              "6M": 86400, // 1 día
              "1A": 86400, // 1 día
            };
            timestamp = now - (labels.length - i) * (intervals[range] || 300);
          }

          if (timestamp && Number.isFinite(numericValue)) {
            points.push({
              t: timestamp,
              v: numericValue,
            });
          } else {
            console.warn(
              `⚠️ [PARSE_API_RESPONSE] No se pudo obtener timestamp para label: ${label}`
            );
          }
        }

        console.log(
          `✅ [PARSE_API_RESPONSE] Parseados ${
            points.length
          } puntos de ${Math.min(labels.length, values.length)} posibles`
        );

        // Ordenar por timestamp
        points.sort((a, b) => a.t - b.t);

        // ==== AGREGAR ESTAS 2 LÍNEAS AL FINAL ====
        const filteredPoints = filterDataByDate(points, range);
        return filteredPoints;
        // ==== FIN DE AGREGADO ====
      }
    }

    // CASO 2: Datos en formato datasets/labels directo
    if (apiResponse.datasets && apiResponse.labels) {
      console.log(
        "📊 [PARSE_API_RESPONSE] Formato datasets/labels directo detectado"
      );
      return parseDatasetsLabels(apiResponse, range);
    }

    // CASO 3: Datos en formato array simple
    if (Array.isArray(apiResponse)) {
      console.log("📊 [PARSE_API_RESPONSE] Formato array simple detectado");
      return parseSimpleArrayResponse(apiResponse, range);
    }

    // CASO 4: Intentar encontrar datos en otras ubicaciones
    console.warn(
      "⚠️ [PARSE_API_RESPONSE] Estructura no reconocida, intentando extraer datos..."
    );

    // Buscar recursivamente labels y datasets
    const foundData = findChartDataRecursive(apiResponse);
    if (foundData) {
      console.log("📊 [PARSE_API_RESPONSE] Datos encontrados recursivamente");
      return parseDatasetsLabels(foundData, range);
    }

    console.warn(
      "❌ [PARSE_API_RESPONSE] No se pudo identificar la estructura de datos"
    );
    return [];
  } catch (error) {
    console.error("💥 [PARSE_API_RESPONSE] Error crítico:", error);
    return [];
  }
};

// Función auxiliar para buscar datos recursivamente
const findChartDataRecursive = (obj, depth = 0) => {
  if (depth > 3) return null; // Límite de profundidad

  if (obj && typeof obj === "object") {
    // Si encontramos labels y datasets en este nivel
    if (obj.labels && obj.datasets) {
      return obj;
    }

    // Buscar recursivamente en las propiedades
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const result = findChartDataRecursive(obj[key], depth + 1);
        if (result) return result;
      }
    }
  }

  return null;
};

// Función para parsear formato datasets/labels
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
    if (
      dataset.data &&
      Array.isArray(dataset.data) &&
      dataset.data.length > 0
    ) {
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

  // Limpiar cache al inicializar
  useEffect(() => {
    cleanupOldCache();
  }, []);

  // Debug global
  useEffect(() => {
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

    arr.sort((a, b) => a.t - b.t);

    // Actualizar gráficos
    updateChartsFromPoints(arr, range);
  }, [dataById?.[1007], range]);

  /* ===== 2) WebSocket para Promedios (ID 1002) ===== */
  useEffect(() => {
    const promData = dataById?.[1002];
    if (!promData) {
      console.log("📭 [WS_PROMEDIOS] No hay datos 1002 disponibles");
      return;
    }

    console.log("🎯 [WS_PROMEDIOS] Datos de promedios recibidos:", {
      status: promData.status,
      message: promData.message,
      lapse: promData.lapse,
      market: promData.market,
      tieneData: !!promData.data,
    });

    // Procesar datos de promedios del WebSocket
    if (promData.status === "success" && promData.data) {
      console.log(
        "🔄 [WS_PROMEDIOS] Procesando datos de promedios del WebSocket"
      );

      const promBlock = toPromediosFromWebSocket(promData, range);

      if (promBlock) {
        setChartById((prev) => ({
          ...prev,
          1002: {
            ...(prev[1002] || {}),
            [range]: promBlock,
          },
        }));

        console.log(
          "✅ [WS_PROMEDIOS] Gráfico de promedios actualizado desde WebSocket"
        );
      } else {
        console.warn(
          "⚠️ [WS_PROMEDIOS] No se pudo procesar bloque de promedios"
        );
      }
    } else {
      console.warn(
        "❌ [WS_PROMEDIOS] Datos no válidos o status no success:",
        promData.status
      );
    }
  }, [dataById?.[1002], range]);

/* ===== WebSocket para Velas (ID 1003) - VERSIÓN CORREGIDA ===== */
useEffect(() => {
  const velasData = dataById?.[1003];

  console.log("🔔 [WS_1003] Datos recibidos:", {
    tieneData: !!velasData,
    status: velasData?.status,
    message: velasData?.message,
  });

  if (!velasData) {
    console.log("📭 [WS_1003] No hay datos disponibles");
    return;
  }

  if (velasData.status === "success" && velasData.data) {
    console.log("🔄 [WS_1003] Procesando datos de velas del WebSocket...");

    // DEBUG: Mostrar estructura completa
    console.log("🔍 [WS_1003_DEBUG] Estructura completa:", {
      data: velasData.data,
      dataData: velasData.data?.data,
      dataDataData: velasData.data?.data?.data,
      labels: velasData.data?.data?.data?.labels,
      datasets: velasData.data?.data?.data?.datasets,
      firstDataset: velasData.data?.data?.data?.datasets?.[0],
      firstDataPoint: velasData.data?.data?.data?.datasets?.[0]?.data?.[0]
    });

    // Procesar datos de velas
    const velasBlock = toVelasFromWebSocket(velasData, range);

    if (velasBlock && velasBlock.length > 0) {
      console.log(`✅ [WS_1003] ${velasBlock.length} velas procesadas desde WS`);

      setChartById((prev) => ({
        ...prev,
        1003: {
          ...(prev[1003] || {}),
          [range]: velasBlock,
        },
      }));

      // Guardar en cache también
      saveToCache(range, "velas", velasBlock);
    } else {
      console.warn("❌ [WS_1003] No se pudieron procesar datos del WS");
    }
  } else {
    console.warn(`❌ [WS_1003] Datos no válidos: status=${velasData.status}`);
  }
}, [dataById?.[1003], range]);

  /* ===== 3) Carga HTTP principal con Cache ===== */
  useEffect(() => {
    console.log("🚀 [HTTP_MAIN] Iniciando carga para rango:", range);

    // ==== AGREGAR ESTA LÍNEA ====
    checkAndClearCacheIfNewDay(range);

    // Intentar cargar desde cache primero
    const cachedData = loadFromCache(range, "line");

    if (cachedData && cachedData.length > 0) {
      console.log(
        "📂 [HTTP_MAIN] Usando datos en cache para",
        range,
        cachedData.length,
        "puntos"
      );
      bufRef.current = cachedData;
      updateChartsFromPoints(cachedData, range);
      setHttpDataLoaded(true);
      return;
    }

    // Si no hay cache, hacer petición HTTP
    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          console.warn("🔐 [HTTP_MAIN] No hay token disponible");
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

        console.log("🌐 [HTTP_MAIN] Solicitando datos para periodo:", periodo);

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
          console.warn(`❌ [HTTP_MAIN] Error HTTP: ${res.status}`);
          return;
        }

        const responseData = await res.json();

        // DEBUG DETALLADO
        console.log("🔍 [DEBUG_API_RESPONSE] Keys:", {
          root: Object.keys(responseData),
          data: responseData.data ? Object.keys(responseData.data) : "NO_DATA",
          dataData: responseData.data?.data
            ? Object.keys(responseData.data.data)
            : "NO_DATA_DATA",
        });

        // Verificar estructura específica
        if (responseData.data?.data?.datasets) {
          console.log("✅ [DEBUG] Estructura data.data.datasets encontrada");
          console.log(
            "📊 [DEBUG] Datasets length:",
            responseData.data.data.datasets.length
          );
          console.log(
            "🏷️ [DEBUG] Labels length:",
            responseData.data.data.labels?.length
          );
        }

        console.log("📦 [HTTP_MAIN] Respuesta recibida:", {
          status: responseData.status,
          lapse: responseData.lapse,
          tieneData: !!responseData.data,
          tieneDataData: !!responseData.data?.data,
        });

        // Parsear los datos
        const points = parseApiResponseToPoints(responseData, range);

        console.log(
          `✅ [HTTP_MAIN] ${points.length} puntos parseados para ${range}`
        );

        if (points.length === 0) {
          console.warn("⚠️ [HTTP_MAIN] No se pudieron parsear puntos válidos");

          // DEBUG EXTRA: mostrar estructura completa para diagnóstico
          console.log(
            "🔍 [DEBUG_RAW_STRUCTURE]",
            JSON.stringify(
              {
                data: responseData.data,
                dataData: responseData.data?.data,
                datasets: responseData.data?.data?.datasets,
                firstDataset: responseData.data?.data?.datasets?.[0],
              },
              null,
              2
            )
          );

          return;
        }

        // Aplicar filtro para hoy
        const todayPoints = filterDataByDate(points, range);
        console.log(`✅ [HTTP_MAIN] ${todayPoints.length} puntos de hoy para ${range}`);

        if (todayPoints.length === 0) {
          console.warn("⚠️ [HTTP_MAIN] No hay datos para hoy, mostrando mensaje informativo");
          // En lugar de usar todos los datos, mantener el buffer vacío o mostrar mensaje
          bufRef.current = [];
          setHttpDataLoaded(true);
          return;
        }

        bufRef.current = todayPoints;
        updateChartsFromPoints(todayPoints, range);

        // Guardar en cache (guardamos todos los puntos, no solo los de hoy)
        saveToCache(range, "line", points);
        setHttpDataLoaded(true);

        console.log(`🎉 [HTTP_MAIN] Gráficos actualizados para ${range}`);
      } catch (e) {
        console.warn("💥 [HTTP_MAIN] Error crítico:", e.message);
      }
    })();
  }, [range]);

  /* ===== 4) Carga HTTP para Promedios (ID 1002) ===== */
  useEffect(() => {
    console.log("🚀 [HTTP_PROMEDIOS] Iniciando carga para rango:", range);

    (async () => {
      try {
        const token = tokenServices.getToken();

        if (!token) {
          console.warn("🔐 [HTTP_PROMEDIOS] No hay token disponible");
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

        console.log(
          "🌐 [HTTP_PROMEDIOS] Solicitando datos de promedios para periodo:",
          periodo
        );

        // Petición al endpoint CORRECTO
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
          console.warn(`❌ [HTTP_PROMEDIOS] Error HTTP: ${res.status}`);
          return;
        }

        const responseData = await res.json();

        // DEBUG DETALLADO
        console.log(
          "🔍 [HTTP_PROMEDIOS_RESPONSE] Respuesta completa:",
          responseData
        );
        console.log("📊 [HTTP_PROMEDIOS_STRUCTURE] Estructura:", {
          tieneData: !!responseData.data,
          tieneDataData: !!responseData.data?.data,
          tieneDataDataData: !!responseData.data?.data?.data,
          labelsCount: responseData.data?.data?.data?.labels?.length,
          datasetsCount: responseData.data?.data?.data?.datasets?.length,
        });

        // Procesar datos de promedios
        const promBlock = toPromediosFromWebSocket(responseData, range);

        if (promBlock) {
          setChartById((prev) => ({
            ...prev,
            1002: {
              ...(prev[1002] || {}),
              [range]: promBlock,
            },
          }));

          console.log(
            "✅ [HTTP_PROMEDIOS] Gráfico de promedios actualizado desde HTTP"
          );
        } else {
          console.warn(
            "❌ [HTTP_PROMEDIOS] No se pudo procesar bloque de promedios"
          );
        }
      } catch (e) {
        console.warn("💥 [HTTP_PROMEDIOS] Error crítico:", e.message);
      }
    })();
  }, [range]);

/* ===== 5) Carga HTTP para Velas (ID 1003) - VERSIÓN MEJORADA CON FALLBACK ===== */
useEffect(() => {
  console.log("🚀 [HTTP_VELAS] Iniciando carga para rango:", range);
  
  console.log("🔍 [HTTP_VELAS_DEBUG] Estado actual:", {
    range,
    data1003: !!dataById?.[1003],
    chart1003: !!chartById?.[1003]?.[range],
    chart1003Length: chartById?.[1003]?.[range]?.length || 0
  });
  
  // Intentar cargar desde cache primero
  const cachedData = loadFromCache(range, "velas");
  if (cachedData) {
    console.log(
      "📂 [HTTP_VELAS] Usando datos en cache:",
      cachedData.length,
      "velas"
    );
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
        console.warn(
          "🔐 [HTTP_VELAS] No hay token disponible, usando fallback"
        );
        const fallbackData = generateFallbackVelasData(range);
        setChartById((prev) => ({
          ...prev,
          1003: {
            ...(prev[1003] || {}),
            [range]: fallbackData,
          },
        }));
        return;
      }

      // Mapeo de periodos CORREGIDO
      const periodMap = {
        "1D": "1d",
        "5D": "5d",
        "1M": "1m",
        "6M": "6m",
        "1A": "1a",
      };

      const periodo = periodMap[range] || "1d";

      console.log(
        "🌐 [HTTP_VELAS] Solicitando datos de velas para periodo:",
        periodo
      );

      const requestBody = {
        mercado: 71,
        moneda: "USD/COP",
        periodo: periodo,
        sma: 20,
        desv: 2,
      };

      console.log("📤 [HTTP_VELAS] Body de la petición:", requestBody);

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

      console.log(
        "📡 [HTTP_VELAS] Status de respuesta:",
        res.status,
        res.statusText
      );

      if (!res.ok) {
        console.warn(
          `❌ [HTTP_VELAS] Error HTTP: ${res.status}, usando fallback`
        );
        const fallbackData = generateFallbackVelasData(range);
        setChartById((prev) => ({
          ...prev,
          1003: {
            ...(prev[1003] || {}),
            [range]: fallbackData,
          },
        }));
        return;
      }

      const responseData = await res.json();

      console.log("📦 [HTTP_VELAS] Respuesta recibida:", {
        status: responseData.status,
        message: responseData.message,
        tieneData: !!responseData.data,
      });

      let velasBlock = null;

      // Intentar procesar con la función principal
      if (responseData.status === "success") {
        console.log("🔄 [HTTP_VELAS] Procesando datos con processApiData...");
        velasBlock = processApiData(responseData, "velas", range);
      }

      // DIAGNÓSTICO: Verificar qué se obtuvo
      console.log("🔍 [HTTP_VELAS_DIAGNOSTICO] Resultado del procesamiento:", {
        tieneVelasBlock: !!velasBlock,
        cantidadVelas: velasBlock?.length || 0,
        esArray: Array.isArray(velasBlock)
      });

      // ==== AGREGAR ESTE BLOQUE DESPUÉS DEL DIAGNÓSTICO ====
      // Aplicar filtro para hoy si tenemos datos
      if (velasBlock && Array.isArray(velasBlock)) {
        const todayVelas = filterDataByDate(velasBlock, range);
        console.log(`📅 [HTTP_VELAS_FILTERED] ${velasBlock.length} -> ${todayVelas.length} velas de hoy`);
        velasBlock = todayVelas.length > 0 ? todayVelas : velasBlock;
      }
      // ==== FIN DE AGREGADO ====

      // Si no se pudo procesar, usar fallback
      if (!velasBlock || velasBlock.length === 0) {
        console.warn(
          "❌ [HTTP_VELAS] No se pudieron procesar datos de la API, usando fallback"
        );
        velasBlock = generateFallbackVelasData(range);
      }

      // VERIFICACIÓN ADICIONAL: Si los datos son insuficientes para el rango, usar fallback
      if (range === "1D" && velasBlock && velasBlock.length < 50) {
        console.warn(
          `⚠️ [HTTP_VELAS] Datos insuficientes para 1D (${velasBlock.length} velas), usando fallback`
        );
        velasBlock = generateFallbackVelasData(range);
      }

      if (velasBlock && velasBlock.length > 0) {
        console.log(
          "✅ [HTTP_VELAS] Datos procesados:",
          velasBlock.length,
          "velas"
        );

        // Guardar en cache solo si son datos reales (no fallback)
        if (responseData.status === "success" && velasBlock.length >= 50) {
          saveToCache(range, "velas", velasBlock);
          console.log("💾 [HTTP_VELAS] Datos guardados en cache");
        } else {
          console.log("🚫 [HTTP_VELAS] No se guarda en cache (datos insuficientes o fallback)");
        }

        setChartById((prev) => ({
          ...prev,
          1003: {
            ...(prev[1003] || {}),
            [range]: velasBlock,
          },
        }));
      } else {
        console.error("💥 [HTTP_VELAS] Fallback también falló");
      }
    } catch (e) {
      console.warn(
        "💥 [HTTP_VELAS] Error crítico, usando fallback:",
        e.message
      );
      const fallbackData = generateFallbackVelasData(range);
      setChartById((prev) => ({
        ...prev,
        1003: {
          ...(prev[1003] || {}),
          [range]: fallbackData,
        },
      }));
    }
  })();
}, [range]);

  /* ===== 6) Carga HTTP para Bollinger (ID 1004) ===== */
  useEffect(() => {
    console.log("🚀 [HTTP_BOLLINGER] Iniciando carga para rango:", range);

    // Intentar cargar desde cache primero
    const cachedData = loadFromCache(range, "bollinger");
    if (cachedData) {
      console.log(
        "📂 [HTTP_BOLLINGER] Usando datos en cache:",
        cachedData.length,
        "puntos"
      );
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
          console.warn("🔐 [HTTP_BOLLINGER] No hay token disponible");
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

        console.log(
          "🌐 [HTTP_BOLLINGER] Solicitando datos de Bollinger para periodo:",
          periodo
        );

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
          console.warn(`❌ [HTTP_BOLLINGER] Error HTTP: ${res.status}`);
          return;
        }

        const responseData = await res.json();

        console.log("📦 [HTTP_BOLLINGER] Respuesta recibida:", {
          status: responseData.status,
          lapse: responseData.lapse,
          tieneData: !!responseData.data,
        });

        // Procesar datos de Bollinger
        const bollingerBlock = processApiData(responseData, "bollinger", range);

        if (bollingerBlock) {
          // Guardar en cache
          saveToCache(range, "bollinger", bollingerBlock);

          setChartById((prev) => ({
            ...prev,
            1004: {
              ...(prev[1004] || {}),
              [range]: bollingerBlock,
            },
          }));
          console.log(
            "✅ [HTTP_BOLLINGER] Gráfico de Bollinger actualizado desde HTTP"
          );
        } else {
          console.warn(
            "❌ [HTTP_BOLLINGER] No se pudo procesar bloque de Bollinger"
          );
        }
      } catch (e) {
        console.warn("💥 [HTTP_BOLLINGER] Error crítico:", e.message);
      }
    })();
  }, [range]);

  /* ===== DIAGNÓSTICO COMPLETO DE VELAS ===== */
  useEffect(() => {
    console.log("🔍 [DIAGNOSTICO_VELAS] Estado actual:", {
      range,
      data1003: !!dataById?.[1003],
      chart1003: !!chartById?.[1003]?.[range],
      chart1003Length: chartById?.[1003]?.[range]?.length || 0,
      httpDataLoaded,
      bufLength: bufRef.current.length,
    });

    // Diagnóstico del WebSocket 1003
    if (dataById?.[1003]) {
      console.log("🔍 [DIAGNOSTICO_WS_1003] Datos WebSocket:", {
        status: dataById[1003].status,
        message: dataById[1003].message,
        tieneData: !!dataById[1003].data,
        dataKeys: dataById[1003].data
          ? Object.keys(dataById[1003].data)
          : "NO_DATA",
      });
    }

    // Diagnóstico del HTTP 1003
    const cachedVelas = loadFromCache(range, "velas");
    console.log("🔍 [DIAGNOSTICO_CACHE_VELAS] Cache:", {
      tieneCache: !!cachedVelas,
      cacheLength: cachedVelas?.length || 0,
    });
  }, [dataById?.[1003], chartById?.[1003]?.[range], range, httpDataLoaded]);

  const updateChartsFromPoints = (points, currentRange) => {
    const lineBlk = toLineBlock(points);

    // Intervalo solo si lo necesitas para otros derivados
    let velaFrameSec = 60;
    if (currentRange === "5D") velaFrameSec = 300;
    if (currentRange === "1M") velaFrameSec = 3600;
    if (currentRange === "6M" || currentRange === "1A") velaFrameSec = 86400;

    const bollBlk = toBollinger(points, 20);

    setChartById((prev) => ({
      ...prev,
      1001: { ...(prev[1001] || {}), [currentRange]: lineBlk },
      1004: { ...(prev[1004] || {}), [currentRange]: bollBlk },
    }));
  };

  /* ===== API pública ===== */
  const request = useCallback(
    (msg) => {
      try {
        wsRequest?.(msg);
      } catch (e) {
        console.warn("[GFX.request] error", e);
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