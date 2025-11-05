// src/app/services/WebSocketDataProvider.jsx
/**
 * Proveedor global de datos en tiempo real (WebSocket).
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Expone:
 *  - dataById:    { [id:number]: any }         → último payload bruto por id (excepto 1000 que se normaliza).
 *  - dataByHour:  { [hh:string]: Tick1007 }    → snapshots por hora (solo para id=1007).
 *  - chartById:   { [id:number]: { [lapse:string]: ChartLike } } → datos formateados estilo Chart.js.
 *  - request:     (opts) => void               → helper para emitir mensajes al WS.
 *  - updateData:  (id, payload) => void        → escritura manual sobre el estado (compatibilidad).
 *
 * Notas clave:
 * - Este provider AUTENTICA (TokenService) y se CONECTA al WS (WebSocketService) en el montaje.
 * - Rutea y normaliza mensajes por `id` (1000, 1001, 1002, 1003, 1004, 1007, genéricos).
 * - Incluye un parser robusto para el "string raro" de 1000 y un normalizador flexible para 1007.
 * - ⚠️ Contiene credenciales HARDCODEADAS (solo para desarrollo). Deben moverse a una API route/Server Action.
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { tokenServices, webSocketServices } from "./socketService";

/**
 * Contexto global para exponer datos provenientes del WebSocket:
 *  - dataById: último payload por id.
 *  - dataByHour: agregados por hora (especialmente para id = 1007).
 *  - chartById: estructura estilo Chart.js por id y lapse.
 *  - request: helper para enviar solicitudes al WS.
 *  - updateData: actualización manual de estado (compat). 
 */

/** Contexto global del WebSocket. */
const WebSocketDataContext = createContext();
/** Hook público para consumir el contexto. */
export const useWebSocketData = () => useContext(WebSocketDataContext);

/**
 * Tipo de Tick normalizado para id=1007.
 * @typedef {Object} Tick1007
 * @property {number} time   Unix seconds (orden ascendente requerido para charts).
 * @property {number} close  Último precio/cierre.
 * @property {number|null} avg  Promedio (opcional).
 */

/**
 * Estructura Chart-like (similar a Chart.js) para ids 1001/1002/1004/1003.
 * @typedef {Object} ChartLike
 * @property {string[]} labels
 * @property {{label:string, data:number[]}[]} datasets
 */

/**
 * Parser del payload "string raro" de id=1000.
 * Extrae:
 *  - prices: number[]  (primer `data: [...]`)
 *  - amounts: number[] (segundo `data: [...]`)
 *  - labels: string[]  (`labels: [...]`)
 * Devuelve `null` si la estructura no coincide.
 * @param {string} dataStr
 * @returns {{prices:number[], amounts:number[], labels:string[]}|null}
 */

// -------------------- 1000 util (string raro) --------------------
const ChartData = (dataStr) => {
  const pricesMatch = dataStr.match(/data:\s*\[([^\]]+)\]/);
  const amountsMatches = dataStr.match(/data:\s*\[([^\]]+)\]/g) || [];
  const labelsMatch = dataStr.match(/labels:\s*\[([^\]]+)\]/);
  if (!pricesMatch || amountsMatches.length < 2 || !labelsMatch) return null;

  const amountsMatch = amountsMatches[1];
  const prices = pricesMatch[1]
    ?.split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
  const amounts = amountsMatch
    .match(/\[([^\]]+)\]/)?.[1]
    ?.split(",")
    .map(Number)
    .filter((n) => !isNaN(n));
  const labels = labelsMatch[1]
    ?.split(",")
    .map((l) => l.trim().replace(/["']/g, ""))
    .filter(Boolean);
  const minLength = Math.min(prices.length, amounts.length, labels.length);
  return {
    prices: prices.slice(0, minLength),
    amounts: amounts.slice(0, minLength),
    labels: labels.slice(0, minLength),
  };
};

/**
 * Normalizador de ticks para id=1007.
 * - Acepta múltiples nombres para campos y formatos de tiempo:
 *   time: unix seconds / "HH:mm(:ss)" Bogotá / "YYYY-MM-DD HH:mm(:ss)" / ISO / parseable por Date
 *   close: close/cierre/last/price/valor
 *   avg: avg/promedio/average (opcional)
 * Retorna null si no hay `time` y `close` válidos.
 * @param {any} source
 * @returns {Tick1007|null}
 */
// -------------------- 1007 normalizador --------------------
function normalizeTick1007(source) {
  if (!source) return null;
  const d = source.data ?? source;

  const num = (x) => {
    if (x == null) return null;
    if (typeof x === "number") return x;
    if (typeof x === "string") {
      const n = Number(x.replace(/\s+/g, "").replace(/,/g, ""));
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const toUnix = (t) => {
    if (t == null) return null;
    if (typeof t === "number")
      return t > 1e12 ? Math.floor(t / 1000) : Math.floor(t);
    if (typeof t === "string") {
      const s = t.trim();

    // soporta "0 8:01:57" u otros prefijos antes de HH:mm(:ss)
      const m = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
      if (m) {
        const hhmmss = m[1].length === 5 ? `${m[1]}:00` : m[1];
        const day = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Bogota",
        }).format(new Date());
        const ts = Math.floor(
          new Date(`${day}T${hhmmss}-05:00`).getTime() / 1000
        );
        return Number.isFinite(ts) ? ts : null;
      }

    // YYYY-MM-DD [HH:mm(:ss)]
      if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(s)) {
        const iso = s.replace(" ", "T");
        const withSec = iso.length === 16 ? iso + ":00" : iso;
        const ts = Math.floor(new Date(withSec + "Z").getTime() / 1000);
        return Number.isFinite(ts) ? ts : null;
      }

      const fb = Math.floor(new Date(s).getTime() / 1000);
      return Number.isFinite(fb) ? fb : null;
    }
    return null;
  };

  const time = toUnix(d.time ?? d.hora ?? d.timestamp);
  const close = num(d.close ?? d.cierre ?? d.last ?? d.price ?? d.valor);
  const avg = num(d.avg ?? d.promedio ?? d.average);

  if (!Number.isFinite(time) || !Number.isFinite(close)) return null;
  return { time, close, avg };
}

/**
 * WebSocketDataProvider
 * - Autentica, conecta el WS y enruta los mensajes a estados globales.
 * - Normaliza estructuras conocidas (1000/1001/1002/1003/1004/1007).
 * - Ofrece `request` y `updateData` para interacción/control desde la UI.
 */
export const WebSocketDataProvider = ({ children }) => {
  const [dataById, setDataById] = useState({});
  const [dataByHour, setDataByHour] = useState({});
  const [chartById, setChartById] = useState({});

// Conexión y ruteo de mensajes entrantes
  useEffect(() => {
    const connectWebSocket = async () => {
  //  SOLO DESARROLLO: no hardcodees credenciales en cliente.
  // Muévelas a una API route o Server Action y retorna únicamente el token.
      const username = "sysdev";
      const password = "$MasterDev1972*";
      localStorage.removeItem("auth-token");
      try {
        const token = await tokenServices.fetchToken(username, password);
        if (!token || token.length < 30) throw new Error("Token inválido");
        await webSocketServices.connect(token);
      // Suscripción a mensajes entrantes
        webSocketServices.addListener((data) => {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            if (!parsed) return;
            const pid =
              typeof parsed.id === "string"
                ? parseInt(parsed.id, 10)
                : parsed.id;
            if (!pid) return;


        // --- 1007: normalizar y guardar SOLO si trae time/close ---
            if (pid === 1007) {
              const tick =
                normalizeTick1007(parsed) ||
                normalizeTick1007(parsed.data ? parsed : { data: parsed });
              if (tick) {
                setDataById((p) => ({ ...p, 1007: tick }));
            // Agrega un snapshot por hora si no existe
                try {
                  const hour = new Intl.DateTimeFormat("es-CO", {
                    hour: "2-digit",
                    hour12: false,
                    timeZone: "America/Bogota",
                  }).format(new Date(tick.time * 1000));
                  const hourKey = `${hour}:00`;
                  setDataByHour((prev) =>
                    prev[hourKey] ? prev : { ...prev, [hourKey]: tick }
                  );
                } catch {}
              } else {
                if (process.env.NODE_ENV !== "production") {
                  console.warn(
                    "[WS 1007] control/invalid (sin close/time):",
                    parsed
                  );
                }
              }
              return; // evita caer al bloque genérico
            }

            // 1000: "string raro" → chart + dataById
            if (
              pid === 1000 &&
              parsed.result?.[0]?.datos_grafico_moneda_mercado
            ) {
              const formatted = ChartData(
                parsed.result[0].datos_grafico_moneda_mercado
              );
              if (formatted) {
                setChartById((p) => ({
                  ...p,
                  1000: {
                    ...(p[1000] || {}),
                    RT: {
                      labels: formatted.labels,
                      datasets: [
                        { label: "Precio", data: formatted.prices },
                        { label: "Montos", data: formatted.amounts },
                      ],
                    },
                  },
                }));
                setDataById((prev) => ({ ...prev, 1000: formatted }));
              }
              return;
            }

          // 1001/1002/1004: estructuras tipo Chart.js
            if (pid === 1001 || pid === 1002 || pid === 1004) {
              const lapse = (
                parsed.lapse ||
                parsed.periodo ||
                "1D"
              ).toUpperCase();
              let chart = parsed?.data?.data || null;
              if (!chart && parsed?.labels && parsed?.datasets) {
                chart = { labels: parsed.labels, datasets: parsed.datasets };
              }
              if (chart?.labels?.length && chart?.datasets?.[0]?.data?.length) {
                setChartById((p) => ({
                  ...p,
                  [pid]: { ...(p[pid] || {}), [lapse]: chart },
                }));
              } else {
                console.warn(
                  "[WS 1001/2/4] bloque sin labels/datasets válidos",
                  parsed
                );
              }
              return;
            }

            // 1003: velas (data.data)
            if (pid === 1003) {
              const lapse = (
                parsed.lapse ||
                parsed.periodo ||
                "1D"
              ).toUpperCase();
              const chart = parsed?.data?.data || null;
              if (chart) {
                setChartById((p) => ({
                  ...p,
                  1003: { ...(p[1003] || {}), [lapse]: chart },
                }));
              }
              return;
            }

          // Genérico: guarda parsed.data como dataById[pid]
            if (parsed.data) {
              setDataById((prev) => ({ ...prev, [pid]: parsed.data }));
            }
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              console.error("[WS listener error]", err);
            }
          }
        });
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[WS connect error]", err);
        }
      }
    };

    connectWebSocket();
  }, []);

 // Debug opcional (exponer estado global en window para inspección)
  useEffect(() => {
    window._ws = { dataById, chartById };
    console.log("[WS state]", {
      has1000: !!dataById[1000],
      Keys1001: Object.keys(chartById[1001] || {}),
      len1001_1D: chartById[1001]?.["1D"]?.datasets?.[0]?.data?.length,
      keys1003: Object.keys(chartById[1003] || {}),
    });
  }, [dataByHour, chartById]);

 /**
   * Envía un payload al WebSocket.
   * @param {{id:number, lapse?:string, [k:string]:any}} [opts]
   */
  const request = useCallback(({ id, lapse = "1D", ...extra } = {}) => {
    if (!id) return;
    const payload = { id, lapse, ...extra };
    try {
      webSocketServices.send(JSON.stringify(payload));
    } catch {}
  }, []);

  /**
   * Actualiza manualmente dataById (no afecta id=1000).
   * Si es 1007 y trae time, agrega snapshot en dataByHour[HH:00] si no existe.
   * @param {number} id
   * @param {any} payload
   */
  const updateData = (id, payload) => {
    if (id === 1000) return;
    setDataById((prev) => ({ ...prev, [id]: payload }));

    if (id === 1007 && payload?.data?.time) {
      const t = payload.data.time;
      const hourKey = `${String(t).substring(0, 2)}:00`;
      setDataByHour((prev) =>
        prev[hourKey] ? prev : { ...prev, [hourKey]: payload.data }
      );

    }
  };

  return (
    <WebSocketDataContext.Provider
      value={{ dataById, dataByHour, chartById, request, updateData }}
    >
      {children}
    </WebSocketDataContext.Provider>
  );
};
