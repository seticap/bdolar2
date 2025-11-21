"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenServices, webSocketServices } from "./socketService";
import { useChannel } from "./ChannelService";
import { useMarketFilter, matchesMarket } from "./MarketFilterService";

const WebSocketDataContext = createContext();
export const useWebSocketData = () => useContext(WebSocketDataContext);

export const WebSocketDataProvider = ({ children }) => {
    const [dataById, setDataById] = useState({});
    const [dataByHour, setDataByHour] = useState({});

    const { channel } = useChannel();
    const { market } = useMarketFilter();

    // --- Parser ID 1000 ---
    const parseGraph = (parsed) => {
        const r = parsed?.result?.[0];
        if (!r) return null;

        const raw =
            r.datos_grafico_moneda_mercado ||
            r.datos_grafico_moneda_mercado_rt ||
            null;

        if (!raw) return null;

        const pricesMatch = raw.match(/data:\s*\[([^\]]+)\]/);
        const arraysMatch = raw.match(/data:\s*\[([^\]]+)\]/g);
        const labelsMatch = raw.match(/labels:\s*\[([^\]]+)\]/);

        if (!pricesMatch || arraysMatch.length < 2 || !labelsMatch) return null;

        const amountsMatch = arraysMatch[1];

        const prices = pricesMatch[1]
            .split(",")
            .map(Number)
            .filter((n) => !isNaN(n));

        const amounts = amountsMatch
            .match(/\[([^\]]+)\]/)?.[1]
            ?.split(",")
            .map(Number)
            .filter((n) => !isNaN(n));

        const labels = labelsMatch[1]
            .split(",")
            .map((x) => x.trim().replace(/["']/g, ""));

        const min = Math.min(prices.length, amounts.length, labels.length);

        return {
            prices: prices.slice(0, min),
            amounts: amounts.slice(0, min),
            labels: labels.slice(0, min),
        };
    };

    // --- MAIN EFFECT ---
    useEffect(() => {
        let active = true;

        // listener único
        const listener = (frame) => {
            if (!active) return;
            if (frame.ns !== channel) return;

            let parsed;
            try {
                parsed = JSON.parse(frame.text);
            } catch {
                return;
            }
            if (!parsed?.id) return;

            // filtrar por market
            if (!matchesMarket(parsed, market)) return;

            // ID 1000
            if (parsed.id === 1000) {
                const graph = parseGraph(parsed);
                if (graph) {
                    setDataById((prev) => ({ ...prev, 1000: graph }));
                }
                return;
            }

            // IDs normales
            if (parsed.data) {
                setDataById((prev) => ({
                    ...prev,
                    [parsed.id]: parsed.data,
                }));

                // horario 1007
                if (parsed.id === 1007 && parsed.data?.time) {
                    const hour = parsed.data.time.substring(0, 2) + ":00";
                    setDataByHour((prev) =>
                        prev[hour] ? prev : { ...prev, [hour]: parsed.data }
                    );
                }
            }
        };

        webSocketServices.addListener(listener);

        const start = async () => {
            try {
                let token = tokenServices.getToken();

                if (!token) {
                    if (channel === "delay") {
                        const username = "sysdev";
                        const password = "$MasterDev1972*"

                        token = await tokenServices.fetchToken(username, password);
                    } else {
                        console.warn(
                            "[WS] No hay token de usuario para canal protegido:",
                            channel
                        );
                        return;
                    }
                }
                await webSocketServices.connect(token, channel);
            } catch (err) {
                console.error("[WS] Error al conectar:", err);
            }
        };

        start();

        return () => {
            active = false;
            webSocketServices.removeListener(listener);
        };
    }, [channel, market]);

    return (
        <WebSocketDataContext.Provider value={{ dataById, dataByHour }}>
            {children}
        </WebSocketDataContext.Provider>
    );
};
