"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenServices, webSocketServices } from "./socketService";

const WebSocketDataContext = createContext();
export const useWebSocketData = () => useContext(WebSocketDataContext);

export const WebSocketDataProvider = ({ children }) => {
  const [dataById, setDataById] = useState({});
  const [dataByHour, setDataByHour] = useState({});
  const [chartById, setChartById] = useState({}); // <- series por id/lapso

  // === util para 1000 (string raro) ===
  const ChartData = (dataStr) => {
    const pricesMatch = dataStr.match(/data:\s*\[([^\]]+)\]/);
    const amountsMatches = dataStr.match(/data:\s*\[([^\]]+)\]/g) || [];
    const labelsMatch = dataStr.match(/labels:\s*\[([^\]]+)\]/);
    if (!pricesMatch || amountsMatches.length < 2 || !labelsMatch) return null;

    const amountsMatch = amountsMatches[1];
    const prices = pricesMatch[1]?.split(",").map(Number).filter((n) => !isNaN(n));
    const amounts = amountsMatch.match(/\[([^\]]+)\]/)?.[1]?.split(",").map(Number).filter((n) => !isNaN(n));
    const labels = labelsMatch[1]?.split(",").map((l) => l.trim().replace(/["']/g, "")).filter(Boolean);
    const minLength = Math.min(prices.length, amounts.length, labels.length);
    return {
      prices: prices.slice(0, minLength),
      amounts: amounts.slice(0, minLength),
      labels: labels.slice(0, minLength),
    };
  };

  // === conectar y enrutar mensajes ===
  useEffect(() => {
    const connectWebSocket = async () => {
      const username = "sysdev";
      const password = "$MasterDev1972*";
      localStorage.removeItem("auth-token");
      try {
        let token = await tokenServices.fetchToken(username, password);
        if (!token || token.length < 30) throw new Error("Token inválido");

        await webSocketServices.connect(token);

        webSocketServices.addListener((data) => {
          try {
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            if (!parsed || !parsed.id) return;

            // 1000 intradía (string raro)
            if (parsed.id === 1000 && parsed.result?.[0]?.datos_grafico_moneda_mercado) {
              const formatted = ChartData(parsed.result[0].datos_grafico_moneda_mercado);
              // lo guardamos como serie también (clave RT)
              if (formatted) {
                setChartById((p) => ({
                  ...p,
                  1000: { ...(p[1000] || {}), RT: { labels: formatted.labels, datasets: [
                    { label: "Precio", data: formatted.prices },
                    { label: "Montos", data: formatted.amounts },
                  ]}}
                }));
              }
              setDataById((prev) => ({ ...prev, [parsed.id]: formatted }));
              return;
            }

            // 1001/1004: Chart.js-like => parsed.data?.data
            if (parsed.id === 1001 || parsed.id === 1004) {
              const lapse = (parsed.lapse || "1D").toUpperCase();
              const chart = parsed?.data?.data || null;
              if (chart) {
                setChartById((p) => ({
                  ...p,
                  [parsed.id]: { ...(p[parsed.id] || {}), [lapse]: chart },
                }));
              }
              return;
            }

            // 1003: velas (también viene en data.data)
            if (parsed.id === 1003) {
              const lapse = (parsed.lapse || "1D").toUpperCase();
              const chart = parsed?.data?.data || null;
              if (chart) {
                setChartById((p) => ({
                  ...p,
                  1003: { ...(p[1003] || {}), [lapse]: chart },
                }));
              }
              return;
            }

            // 1005/1006/1007: objetos planos
            if (parsed.data) {
              setDataById((prev) => ({ ...prev, [parsed.id]: parsed.data }));
              // opcional: capturar horas de 1007
              if (parsed.id === 1007 && parsed.data?.time) {
                const t = parsed.data.time;
                const hourKey = t.substring(0, 2) + ":00";
                setDataByHour((prev) => (prev[hourKey] ? prev : { ...prev, [hourKey]: parsed.data }));
              }
            }
          } catch (err) {}
        });
      } catch (err) {}
    };

    connectWebSocket();
  }, []);

  useEffect(() =>{
    window._ws = { dataById, chartById };
    console.log('[WS state]', {
      has1000: !!dataById[1000],
      Keys1001: Object.keys (chartById[1001] || {}),
      len1001_1D: chartById[1001]?.['1D']?.datasets?.[0]?.data?.length,
      keys1003: Object.keys(chartById[1003] || {}),
    });
  }, [dataByHour, chartById]);

  // === request para pedir por ID + lapso ===
  const request = useCallback(({ id, lapse="1D", ...extra } = {}) => {
    if (!id) return;
    // Ajusta esto si tu backend exige otros campos (action, market, etc.)
    // Aquí re-enviamos el mismo shape que el servidor nos devuelve (id + lapse).
    const payload = { id, lapse, ...extra };
    try { webSocketServices.send(JSON.stringify(payload)); } catch {}
  }, []);

  // (tu updateData lo dejo por compatibilidad con otras partes)
  const updateData = (id, payload) => {
    if (id === 1000) return;
    setDataById((prev) => ({ ...prev, [id]: payload }));
    if (id === 1007 && payload.data?.time) {
      const time = payload.data.time;
      const hourKey = time.substring(0, 2) + ":00";
      setDataByHour((prev) => (prev[hourKey] ? prev : { ...prev, [hourKey]: payload.data }));
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
