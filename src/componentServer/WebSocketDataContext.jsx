
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
  try {
    const username = "sysdev";
    const password = "$MasterDev1972*";

    let token = await TokenService.fetchToken(username, password);
    if (!token || token.length < 30) {
      console.warn("⚠️ Token inválido. Reintentando...");
      token = await TokenService.fetchToken(username, password); // Segundo intento
    }

    localStorage.setItem("auth-token", token);
    console.log("✅ Token válido generado:", token);

    try {
      await websocketService.connect(token);
      websocketService.addListener((data) => {
        if (!data || !data.id || !data.data) return;
        updateData(data.id, data);
      });
    } catch (wsError) {
      console.error("❌ WebSocket error:", wsError);

      // Si el WebSocket falla, intenta regenerar token y reconectar una vez
      if (
        wsError instanceof Event ||
        wsError.message?.includes("Authentication failed")
      ) {
        console.warn("🔁 Token rechazado por WebSocket. Regenerando...");

        localStorage.removeItem("auth-token");
        const newToken = await TokenService.fetchToken(username, password);

        if (newToken && newToken.length >= 30) {
          localStorage.setItem("auth-token", newToken);
          console.log("✅ Segundo token generado:", newToken);
          await websocketService.connect(newToken);
        } else {
          console.error("❌ Falló el segundo intento de generación de token.");
        }
      }
    }
  } catch (err) {
    console.error("❌ Error general en fetchAndConnect:", err);
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
