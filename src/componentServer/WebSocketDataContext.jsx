
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import websocketService from "@/services/websocketdelay";
import TokenService from "@/services/TokenService";

const WebSocketDataContext = createContext();
export const useWebSocketData = () => useContext(WebSocketDataContext);

export const WebSocketDataProvider = ({ children }) => {
  const [dataById, setDataById] = useState({});
  const [historico, setHistorico] = useState({});

useEffect(() => {
  const raw = localStorage.getItem("historico-1007");
  try {
    setHistorico(raw ? JSON.parse(raw) : {});
  } catch {
    setHistorico({});
  }

    const fetchAndConnect = async () => {
      const username = "sysdev";
      const password = "$MasterDev1972*";

      // 🔁 Siempre borrar el token existente antes de iniciar
      localStorage.removeItem("auth-token");

      let token = null;

      try {
        // 🧾 Intentar generar nuevo token
        token = await TokenService.fetchToken(username, password);

        if (!token || token.length < 30) {
          throw new Error("Token inválido al primer intento");
        }

        localStorage.setItem("auth-token", token);
        console.log("✅ Token generado:", token);

        // 🔗 Conectar WebSocket
        await websocketService.connect(token);
        websocketService.addListener((data) => {
          if (!data || !data.id || !data.data) return;
          updateData(data.id, data);
        });
      } catch (err) {
        console.error("❌ Error al generar token o conectar WebSocket:", err);

        // 🚨 Si fue por token inválido o rechazado por WebSocket
        if (
          err instanceof Event || // WebSocket error genérico
          err.message?.includes("Authentication failed") ||
          err.message?.includes("Token inválido")
        ) {
          console.warn("⚠️ Token inválido. Reintentando...");

          try {
            // 🔁 Generar un segundo token y reconectar
            const retryToken = await TokenService.fetchToken(
              username,
              password
            );
            if (retryToken && retryToken.length >= 30) {
              localStorage.setItem("auth-token", retryToken);
              console.log("✅ Segundo token generado:", retryToken);
              await websocketService.connect(retryToken);
            } else {
              throw new Error("Segundo token inválido");
            }
          } catch (secondError) {
            console.error("❌ Falló el segundo intento:", secondError);
          }
        }
      }
    };


  fetchAndConnect();
}, []);

  

  const updateData = (id, payload) => {
    if (id === 1000) return;
    setDataById((prev) => ({ ...prev, [id]: payload }));

    if (id === 1006) {
      saveAsYesterdayIfNeeded(id, payload.data);
    }

    if (id === 1007) {
      guardarPorHora(id, payload.data);
    }
  };

  const saveAsYesterdayIfNeeded = (id, newData) => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSaveDate = localStorage.getItem(`fecha-${id}`);
    const current = JSON.stringify(newData);

    localStorage.setItem(`hoy-${id}`, current);

    if (lastSaveDate && lastSaveDate !== today && current) {
      localStorage.setItem(`ayer-${id}`, current);
    }

    localStorage.setItem(`fecha-${id}`, today);
  };

  const guardarPorHora = (id, data) => {
    if (!data.time) return;

    const hora = data.time.split(":")[0] + ":00";
    const clave = `historico-${id}`;
    const fechaClave = `historico-fecha-${id}`;
    const hoy = new Date().toISOString().slice(0, 10);
    const ultimaFecha = localStorage.getItem(fechaClave);

    if (ultimaFecha && ultimaFecha !== hoy) {
      localStorage.removeItem(clave);
    }

    localStorage.setItem(fechaClave, hoy);
    const historicoRaw = localStorage.getItem(clave);
    const parsed = historicoRaw ? JSON.parse(historicoRaw) : {};

    if (!parsed[hora]) {
      parsed[hora] = {
        avg: data.avg,
        close: data.close,
        time: data.timem,
      };
      localStorage.setItem(clave, JSON.stringify(parsed));
      setHistorico({ ...parsed });
    }
  };

  return (
    <WebSocketDataContext.Provider value={{ dataById, updateData, historico }}>
      {children}
    </WebSocketDataContext.Provider>
  );
};  
