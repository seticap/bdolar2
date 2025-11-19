"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
    BaselineSeries,
    createChart,
    CrosshairMode,
    HistogramSeries,
    LineStyle,
} from "lightweight-charts";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import { useChannel } from "../services/ChannelService";
import { useMarketFilter } from "../services/MarketFilterService";

const DollarChart = () => {
    // Datos centralizados del provider (id 1000 ya viene parseado)
    const { dataById } = useWebSocketData();
    const pack = useMemo(() => dataById?.[1000], [dataById?.[1000]]); // { prices, amounts, labels }
    const { channel } = useChannel();
    const { market } = useMarketFilter();

    // Refs del chart/series
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const priceSeriesRef = useRef(null);
    const mountSeriesRef = useRef(null);
    const inicioLineRef = useRef(null);

    // Estado UI
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const isMounted = useRef(true);

    // Detectar tamaño dispositivo
    useEffect(() => {
        const checkDevice = () => {
            const w = window.innerWidth;
            setIsMobile(w < 768);
            setIsTablet(w >= 768 && w < 1024);
        };
        checkDevice();
        window.addEventListener("resize", checkDevice);
        return () => window.removeEventListener("resize", checkDevice);
    }, []);

    // Crear gráfico una sola vez
    useEffect(() => {
        isMounted.current = true;

        if (chartContainerRef.current && !chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: "solid", color: "#202026" },
                    textColor: "lightgray",
                },
                grid: { vertLines: "", horzLines: "" },
                crosshair: {
                    mode: CrosshairMode.Normal,
                    vertLine: { color: "rgba(200,200,200,.5)", width: 1, style: LineStyle.Dashed },
                    horzLine: { color: "rgba(200,200,200,.5)", width: 1, style: LineStyle.Dashed },
                },
                timeScale: {
                    rightOffset: 0,
                    barSpacing: 5,
                    fixLeftEdge: true,
                    lockVisibleTimeRangeOnResize: true,
                    rightBarStaysOnScroll: false,
                    borderVisible: false,
                    timeVisible: true,
                    secondsVisible: true,
                    tickMarkFormatter: (t) => {
                        const d = new Date(t * 1000);
                        const hh = String(d.getUTCHours()).padStart(2, "0");
                        const mm = String(d.getUTCMinutes()).padStart(2, "0");
                        return `${hh}:${mm}`;
                    },
                },
                width: chartContainerRef.current.clientWidth,
                height: isMobile ? 400 : isTablet ? 500 : 705,
                leftPriceScale: { visible: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
                rightPriceScale: { visible: false, scaleMargins: { top: 0.9, bottom: 0 } },
                localization: { priceFormatter: (p) => Number(p).toFixed(2) },
            });

            priceSeriesRef.current = chart.addSeries(BaselineSeries, {
                topLineColor: "rgba(34,139,34,1)",
                topFillColor1: "rgba(34,139,34,.25)",
                topFillColor2: "rgba(34,139,34,.05)",
                bottomLineColor: "rgba(165,42,42,1)",
                bottomFillColor1: "rgba(165,42,42,.05)",
                bottomFillColor2: "rgba(165,42,42,.25)",
                lineWidth: 2,
                priceScaleId: "left",
                priceLineVisible: false,
                lastValueVisible: false,
            });

            mountSeriesRef.current = chart.addSeries(HistogramSeries, {
                color: "gray",
                priceFormat: { type: "volume" },
                priceScaleId: "right",
            });

            chartRef.current = chart;

            const handleResize = () => {
                if (!chartRef.current || !chartContainerRef.current || !isMounted.current) return;
                chartRef.current.applyOptions({
                    width: isMobile
                        ? window.innerWidth - 40
                        : isTablet
                            ? window.innerWidth * 0.9
                            : chartContainerRef.current.clientWidth,
                    height: isMobile ? 400 : isTablet ? 500 : chartContainerRef.current.clientHeight,
                });
            };
            window.addEventListener("resize", handleResize);

            return () => {
                isMounted.current = false;
                window.removeEventListener("resize", handleResize);
                if (chartRef.current) {
                    try { chartRef.current.remove(); } catch {}
                    chartRef.current = null;
                    priceSeriesRef.current = null;
                    mountSeriesRef.current = null;
                }
            };
        }
    }, [isMobile, isTablet]);

    // Actualizar el gráfico cuando llegan datos del id=1000 (sea delay o dólar)
    useEffect(() => {
        if (!pack) return;
        const { prices, amounts, labels } = pack;
        updateChart(prices, amounts, labels);
    }, [pack]);

    // Limpiar series al cambiar canal o market (evitas mezclar periodos)
    useEffect(() => {
        if (priceSeriesRef.current && mountSeriesRef.current) {
            priceSeriesRef.current.setData([]);
            mountSeriesRef.current.setData([]);
            if (inicioLineRef.current) {
                try { priceSeriesRef.current.removePriceLine(inicioLineRef.current); } catch {}
                inicioLineRef.current = null;
            }
        }
    }, [channel, market]);

    // --- función de pintado (idéntica a tu versión) ---
    const updateChart = (prices, amounts, labels) => {
        if (
            !isMounted.current ||
            !chartRef.current ||
            !priceSeriesRef.current ||
            !mountSeriesRef.current
        ) return;

        try {
            const dataWithTimestamps = labels
                .map((timeStr, i) => {
                    const [h, m, s] = String(timeStr).split(":").map(Number);
                    const t = h * 3600 + m * 60 + s;
                    return { time: t, price: prices[i], amount: amounts[i], originalTime: timeStr };
                })
                .filter((x) => !isNaN(x.time) && !isNaN(x.price) && !isNaN(x.amount))
                .sort((a, b) => a.time - b.time);

            // dedup por timestamp (mantén el último)
            const unique = [];
            const seen = new Set();
            for (let i = dataWithTimestamps.length - 1; i >= 0; i--) {
                const k = dataWithTimestamps[i].time;
                if (!seen.has(k)) { seen.add(k); unique.unshift(dataWithTimestamps[i]); }
            }

            const priceData = unique.map((x) => ({ time: x.time, value: x.price }));
            const mountData = unique.map((x) => ({ time: x.time, value: x.amount }));

            if (priceData.length && mountData.length) {
                priceSeriesRef.current.setData(priceData);
                mountSeriesRef.current.setData(mountData);

                chartRef.current.timeScale().fitContent();
                chartRef.current.timeScale().applyOptions({
                    minVisibleBarCount: 5,
                    maxVisibleBarCount: priceData.length,
                });

                if (inicioLineRef.current) {
                    try { priceSeriesRef.current.removePriceLine(inicioLineRef.current); } catch {}
                }
                const firstValue = priceData[0]?.value;
                if (firstValue !== undefined) {
                    inicioLineRef.current = priceSeriesRef.current.createPriceLine({
                        price: firstValue,
                        color: "rgba(200,200,200,.7)",
                        lineWidth: 1,
                        lineStyle: LineStyle.Dashed,
                        axisLabelVisible: true,
                        title: "Inicio",
                    });
                    priceSeriesRef.current.applyOptions({
                        baseValue: { type: "price", price: firstValue },
                    });
                }
            }
        } catch (err) {
            console.error("Error al actualizar gráfico:", err);
        }
    };

    return (
        <div
            style={{
                width: "100%",
                padding: isMobile ? "0 20px" : isTablet ? "0 40px" : "0",
                boxSizing: "border-box",
                display: "flex",
                justifyContent: "center",
                height: "100%",
            }}
        >
            <div
                ref={chartContainerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "500px",
                    display: "block",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "5px",
                    marginTop: "20px",
                    backgroundColor: "#202026",
                }}
            />
        </div>
    );
};

export default DollarChart;
