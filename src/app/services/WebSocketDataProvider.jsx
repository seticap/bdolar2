"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenServices, webSocketServices } from "./socketService";

const WebSocketDataContext = createContext();
export const useWebSocketData = () => useContext(WebSocketDataContext);

/* ===== Debug ===== */
const DEBUG_WS = true;
const TAG = "📈 WS-Chart";

/* ===== IDs ===== */
const CHART_CANONICAL_ID = 1001;
const isChartMsg = (id) => id === 1000 || id === 1001;

/* ===== API HTTP (Postman) ===== */
const API_URL = "http://set-fx.com/api/v1/dolar/graficos/graficoPrecios"; // usa https si existe
const API_MARKET = 71;
const API_CURRENCY = "USD/COP";

/* ===== Parser tolerante (string pseudo-JSON -> objeto) ===== */
function parseWeirdJson(input) {
  if (typeof input !== "string") return input;
  let s = input.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  )
    s = s.slice(1, -1);
  s = s.replace(/\\"/g, '"').replace(/\\n|\\r/g, "");
  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };
  let j = tryParse(s);
  if (j) return j;
  let fixed = s;
  if (/^\s*(data|labels|datasets)\s*:/.test(fixed)) fixed = `{${fixed}}`;
  fixed = fixed.replace(/'/g, '"');
  fixed = fixed.replace(/([\s{,])([a-zA-Z_][\w]*)\s*:/g, '$1"$2":');
  fixed = fixed.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
  j = tryParse(fixed);
  if (j) return j;
  if (DEBUG_WS)
    console.warn(
      "parseWeirdJson no pudo parsear. Muestra:",
      fixed.slice(0, 200)
    );
  return null;
}

/* ===== Normalizadores ===== */
function normalizeToChartPayload(any) {
  if (!any) return null;
  const obj = typeof any === "string" ? parseWeirdJson(any) : any;

  if (DEBUG_WS) {
    console.log("[normalizeToChartPayload] payload parsed as:", obj);
  }

  // ✅ Caso 1: nuevo formato [array plano de precios]
  if (Array.isArray(obj?.data)) {
    const fakeLabels = obj.data.map((_, i) => {
      const hour = Math.floor(i / 60)
        .toString()
        .padStart(2, "0");
      const minute = (i % 60).toString().padStart(2, "0");
      return `${hour}:${minute}`;
    });

    return {
      data: {
        data: {
          labels: fakeLabels,
          datasets: [
            {
              label: "Precios",
              data: obj.data,
            },
          ],
        },
      },
    };
  }

  // ✅ Caso 2: datasets sin labels
  if (obj?.data?.datasets && Array.isArray(obj.data.datasets)) {
    const prices = obj.data.datasets[0]?.data;
    const fakeLabels = Array.isArray(prices)
      ? prices.map((_, i) => {
          const hour = Math.floor(i / 60)
            .toString()
            .padStart(2, "0");
          const minute = (i % 60).toString().padStart(2, "0");
          return `${hour}:${minute}`;
        })
      : [];

    return {
      data: {
        data: {
          labels: fakeLabels,
          datasets: obj.data.datasets,
        },
      },
    };
  }

  // ✅ Casos anteriores
  if (obj?.data?.data?.data?.labels && obj?.data?.data?.data?.datasets) {
    return { data: { data: obj.data.data.data } };
  }
  if (obj?.data?.data?.labels && obj?.data?.data?.datasets) {
    return { data: { data: obj.data.data } };
  }
  if (obj?.data?.labels && obj?.data?.datasets) {
    return {
      data: { data: { labels: obj.data.labels, datasets: obj.data.datasets } },
    };
  }
  if (obj?.labels && obj?.datasets) {
    return { data: { data: { labels: obj.labels, datasets: obj.datasets } } };
  }

  return null;
}

/* ======= HTTP fetch (REST) ======= */
async function fetchChartHttp(periodo) {
  const body = {
    mercado: API_MARKET,
    moneda: API_CURRENCY,
    periodo: periodo || "1d",
  };

  try {
    const username = "sysdev";
    const password = "$MasterDev1972*";
    const token = await tokenServices.fetchToken(username, password);

    if (!token || token.length < 30) {
      throw new Error("Token inválido");
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // ✅ Aquí va el token
      },
      body: JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
      mode: "cors",
    });

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("❌ Error al hacer fetch HTTP:", error);
    throw error;
  }
}

export const WebSocketDataProvider = ({ children }) => {

  const [ dataById, setDataById] = useState({});
  const [ chartByRange, setChartByRange] = useState({});
  const currentRangeRef = React.useRef("1d"); 

  const updateData = (id, data) => {
    setDataById((prev) => ({ ...prev, [id]: data }));
  };

  /* ========= Conexión WS (se mantiene) ========= */
  useEffect(() => {
    let unsub = null;

    const connectWebSocket = async () => {
      const username = "sysdev";
      const password = "$MasterDev1972*";
      localStorage.removeItem("auth-token");

      try {
        const token = await tokenServices.fetchToken(username, password);
        if (!token || token.length < 30) throw new Error("Token inválido");

        await webSocketServices.connect(token);
        unsub = webSocketServices.addListener((raw) => {
          try {
            const msg = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (!msg || !msg.id) return;

            if (DEBUG_WS) {
              console.groupCollapsed(`${TAG} msg id=${msg.id}`);
              console.log("raw msg:", msg);
              console.groupEnd();
            }

if (isChartMsg(msg.id)) {
  const rawChart =
    msg?.result?.[0]?.datos_grafico_moneda_mercado ??
    msg?.datos_grafico_moneda_mercado ??
    msg?.data?.data?.data ??
    msg?.data?.data ??
    msg?.data ?? null;

  if (DEBUG_WS) {
    console.groupCollapsed(`${TAG} id=${msg.id} RAW chart payload`);
    console.log(rawChart);
    console.groupEnd();
  }

  let normalized = normalizeToChartPayload(rawChart);
  if (!normalized && typeof rawChart === "string") {
    normalized = normalizeToChartPayload(parseWeirdJson(rawChart));
  }

  if (normalized) {
   // intenta obtener el lapso del mensaje WS; si no viene, no pises el actual
   const lapse =
     (msg?.lapse || msg?.data?.lapse || msg?.lapsed || "").toString().toLowerCase();

   if (lapse) {
     setChartByRange((prev) => ({ ...prev, [lapse]: normalized }));
   }

    setDataById((prev) => ({
      ...prev,
      [msg.id]: normalized,
      [CHART_CANONICAL_ID]: normalized,
    }));
  } else {
    console.warn("❌ WebSocket payload no normalizado. No se actualiza estado.");
  }
if (msg.data !== undefined) {
  setDataById((prev) => ({ ...prev, [msg.id]: msg.data }));
}
 return;
}


            // Flujo genérico
            // ✅ No pises los charts si ya procesaste el caso "isChartMsg"
            if (isChartMsg(msg.id)) {
              const rawChart =
                msg?.result?.[0]?.datos_grafico_moneda_mercado ??
                msg?.datos_grafico_moneda_mercado ??
                msg?.data?.data?.data ??
                msg?.data?.data ??
                msg?.data ??
                null;

              let normalized = normalizeToChartPayload(rawChart);
              if (!normalized && typeof rawChart === "string") {
                normalized = normalizeToChartPayload(parseWeirdJson(rawChart));
              }

              if (normalized) {
                setDataById((prev) => ({
                  ...prev,
                  [msg.id]: normalized,
                  [CHART_CANONICAL_ID]: normalized,
                }));
              }
              // 👉 importantísimo: sal aquí para NO ejecutar el bloque genérico
              return;
            }

            // ✅ Solo para mensajes NO‑chart
            if (msg.data !== undefined) {
              setDataById((prev) => ({ ...prev, [msg.id]: msg.data }));
            }
          } catch (err) {
            console.error("❌ Error al parsear mensaje WebSocket", err);
          }
        });
      } catch (err) {
        console.error("❌ Error al conectar WebSocket:", err?.message || err);
      }
    };

    connectWebSocket();

    return () => {
      if (typeof unsub === "function") {
        try {
          unsub();
        } catch {}
      }
      try {
        webSocketServices.disconnect?.();
      } catch {}
    };
  }, []);

  /* ========= Carga vía HTTP (lo que pide el gráfico) ========= */
  const loadChart = async (range) => {
    if (DEBUG_WS) console.log(`${TAG} loadChart(${range}) [HTTP]`);
    try {
      const json = await fetchChartHttp(range); // <-- ya no pasamos getToken
      const id = json?.id ?? CHART_CANONICAL_ID;
      const normalized = normalizeToChartPayload(json);
      if (!normalized) {
        console.warn("[HTTP] Respuesta no normalizable:", json);
        return;
      }
      currentRangeRef.current = range;
      setChartByRange((prev) =>({...prev, [range]: normalized}));
      setDataById((prev) => ({
        ...prev,
        [id]: normalized,
        [CHART_CANONICAL_ID]: normalized,
      }));
    } catch (e) {
      console.error("❌ HTTP chart error:", e?.message || e);
    }
  };

  return (
    <WebSocketDataContext.Provider value={{ dataById, chartByRange, loadChart, updateData, currentRangeRef }}>
      {children}
    </WebSocketDataContext.Provider>
  );
};
