"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { tokenServices, webSocketServices } from "./socketService";
import { useChannel } from "./ChannelService";
import { useMarketFilter, matchesMarket } from "./MarketFilterService";

const WebSocketDataContext = createContext();
export const useWebSocketData = () => useContext(WebSocketDataContext);

export const WebSocketDataProvider = ({ children }) => {
    const [dataById, setDataById] = useState({});
    const [dataByHour, setDataByHour] = useState({});
    const { channel } = useChannel();           // <-- canal activo: "delay" | "dolar"
    const { market } = useMarketFilter();       // <-- market activo: 71 | 76 | null
    const mountedRef = useRef(false);

    // Conectar (y reconectar) cuando cambia el canal
    useEffect(() => {
        let active = true;

        const connectWebSocket = async () => {
            try {
                const username = "sysdev";
                const password = "$MasterDev1972*";
                localStorage.removeItem("auth-token");

                let token = await tokenServices.fetchToken(username, password);
                if (!token || token.length < 30) throw new Error("Token inválido");

                await webSocketServices.connect(token, channel);

                // Registrar un solo listener (idempotente)
                webSocketServices.addListener((raw) => {
                    if (!active) return;
                    try {
                        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                        if (!parsed || !parsed.id) return;

                        // --- Filtro por market ---
                        if (!matchesMarket(parsed, market)) return;

                        // Chart especial id: 1000
                        if (parsed.id === 1000) {
                            const result = parsed.result?.[0] || {};

                            const dataStr =
                                result.datos_grafico_moneda_mercado ||
                                result.datos_grafico_moneda_mercado_rt ||
                                null;

                            if (dataStr) {
                                const formatted = ChartData(dataStr);
                                if (formatted) {
                                    setDataById((prev) => ({ ...prev, [parsed.id]: formatted }));
                                }
                            }

                            return;
                        }

                        // Mensajes comunes con 'data'
                        if (parsed.data) {
                            setDataById((prev) => ({
                                ...prev,
                                [parsed.id]: parsed.data,
                            }));

                            // ID horario (1007) → levantar dataByHour
                            if (parsed.id === 1007 && parsed.data?.time) {
                                const time = parsed.data.time;
                                const hourKey = time.substring(0, 2) + ":00";
                                setDataByHour((prev) => (prev[hourKey] ? prev : { ...prev, [hourKey]: parsed.data }));
                            }
                        }
                    } catch (err) {
                        console.error("Error al parsear mensajes del WS", err);
                    }
                });
            } catch (err) {
                console.error("❌ Error al conectar WebSocket:", err?.message || err);
            }
        };

        connectWebSocket();
        mountedRef.current = true;

        return () => {
            active = false;
            // No cerramos aquí para permitir un hot-switch suave;
            // si quieres cierre duro por desmontaje, descomenta:
            // webSocketServices.disconnect();
        };
    }, [channel, market]); // <- si prefieres no reconectar al cambiar market, quita 'market' de deps

    // Parser para id=1000
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

    // API expuesta: update manual (se mantiene)
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
        <WebSocketDataContext.Provider value={{ dataById, updateData, dataByHour }}>
            {children}
        </WebSocketDataContext.Provider>
    );
};
