"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenServices, webSocketServices } from "./socketService";

const WebSocketDataContext = createContext();

export const useWebSocketData = () => useContext(WebSocketDataContext);

export const WebSocketDataProvider = ({ children }) => {
  const [dataById, setDataById] = useState({});

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
            // console.log("🧩 WebSocket message:", parsed);
            // console.log("data.id:", parsed.id);

            if (!parsed || !parsed.id || !parsed.data) return;

            if (
              parsed.id === 1000 &&
              parsed.result?.[0]?.datos_grafico_moneda_mercado
            ) {
              const formatted = ChartData(
                parsed.result[0].datos_grafico_moneda_mercado
              );
              setDataById((prev) => ({ ...prev, [parsed.id]: formatted }));
              return;
            }

            if (parsed.data) {
              setDataById((prev) => ({
                ...prev,
                [parsed.id]: parsed.data,
              }));
            }
          } catch (err) {
            console.error("Error al parsear mensajes del WS", err);
          }
        });
      } catch (err) {
        console.error("❌ Error al conectar WebSocket:", err.message);
      }
    };

    connectWebSocket();
  }, []);

  const ChartData = (dataStr) => {
    const pricesMatch = dataStr.match(/data:\s*\[([^\]]+)\]/);
    const amountsMatches = dataStr.match(/data:\s*\[([^\]]+)\]/g) || [];
    const labelsMatch = dataStr.match(/labels:\s*\[([^\]]+)\]/);

    if (!pricesMatch || amountsMatches.length < 2 || !labelsMatch) return null;

    const amountsMatch = amountsMatches[1];

    const prices = pricesMatch[1]?.split(",").map(Number).filter((n) => !isNaN(n));
    const amounts = amountsMatch.match(/\[([^\]]+)\]/)?.[1]?.split(",").map(Number).filter((n) => !isNaN(n));
    const labels = labelsMatch[1]?.split(",").map((label) => label.trim().replace(/["']/g, "")).filter(Boolean);

    const minLength = Math.min(prices.length, amounts.length, labels.length);

    return {
      prices: prices.slice(0, minLength),
      amounts: amounts.slice(0, minLength),
      labels: labels.slice(0, minLength),
    };
  };

  const updateData = (id, payload) => {
    if (id === 1000) return;
    setDataById((prev) => ({ ...prev, [id]: payload }));
  };

  return (
    <WebSocketDataContext.Provider value={{ dataById, updateData }}>
      {children}
    </WebSocketDataContext.Provider>
  );
};
