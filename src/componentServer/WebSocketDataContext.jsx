
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
    // 1. BORRAR token si existe (para regenerarlo limpio SIEMPRE)
    if (localStorage.getItem("auth-token")) {
      console.warn("🔁 Token existente encontrado. Eliminando para regenerar limpio.");
      localStorage.removeItem("auth-token");
    }

    // 2. Generar SIEMPRE un nuevo token
    const username = "sysdev";
    const password = "$MasterDev1972*";
    let token;

    try {
      token = await TokenService.fetchToken(username, password);
      localStorage.setItem("auth-token", token);
      console.log("✅ Token nuevo generado:", token);
    } catch (error) {
      console.error("❌ Error al generar nuevo token:", error);
      return;
    }

    // 3. Intentar conectar con WebSocket
    try {
      await websocketService.connect(token);

      websocketService.addListener((data) => {
        if (!data || !data.id || !data.data) return;
        updateData(data.id, data);
      });
    } catch (err) {
      console.error("❌ Error conectando WebSocket:", err);

      // 4. Si fue error de autenticación: eliminar token y recargar solo una vez
      if (
        err instanceof Event ||
        err.message?.includes("Authentication failed")
      ) {
        console.warn("⚠️ Token inválido. Eliminando y recargando...");
        localStorage.removeItem("auth-token");

        if (!sessionStorage.getItem("reloaded-after-auth-error")) {
          sessionStorage.setItem("reloaded-after-auth-error", "true");
          window.location.reload();
        } else {
          console.error("❌ Recarga ya intentada. Deteniendo para evitar bucle.");
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
