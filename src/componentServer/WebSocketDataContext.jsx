"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
      localStorage.setItem(`ayer-${id}`, current); // almacena la version anterior
    }

    localStorage.setItem(`fecha-${id}`, today);
    localStorage.setItem(`hoy-${id}`, JSON.stringify(newData));
  };

  const guardarPorHora = (id, data) => {
    if (!data.time) return;

    const hora = data.time.split(":")[0] + ":00";
    const clave = `historico-${id}`;
    const fechaClave = `historico-fecha-${id}`;
    const hoy = new Date().toISOString().slice(0, 10);

    const ultimaFecha = localStorage.getItem(fechaClave);
    if (ultimaFecha && ultimaFecha != hoy) {
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
      setHisotrico({ ...parsed });
    }
  };

  return (
    <WebSocketDataContext.Provider value={{ dataById, updateData, historico }}>
      {children}
    </WebSocketDataContext.Provider>
  );
};
