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

// Componente Tooltip con letras más grandes - SIN FECHA
function ChartTooltip({ visible, price, time, x, y, pointCount, firstPrice }) {
    if (!visible) return null;

    // Calcular variación respecto al primer precio
    const variation = price && firstPrice ? ((price - firstPrice) / firstPrice * 100) : 0;
    const isPositive = variation >= 0;

    // Calcular posición ajustada para evitar que se salga de la pantalla
    const tooltipWidth = 210; // AUMENTADO ligeramente de 200 a 210
    const tooltipHeight = 125; // AUMENTADO ligeramente de 120 a 125
    
    let adjustedX = x + 15;
    let adjustedY = y - 95; // Ajustado para compensar la mayor altura

    // Ajustar para no salirse del borde derecho
    if (adjustedX + tooltipWidth > window.innerWidth) {
        adjustedX = x - tooltipWidth - 15;
    }

    // Ajustar para no salirse del borde inferior
    if (adjustedY + tooltipHeight > window.innerHeight) {
        adjustedY = window.innerHeight - tooltipHeight - 10;
    }

    // Ajustar para no salirse del borde superior
    if (adjustedY < 10) {
        adjustedY = 10;
    }

    return (
        <div
            className="custom-tooltip"
            style={{
                position: 'fixed',
                padding: '14px',
                background: 'rgba(15, 23, 42, 0.98)',
                color: 'white',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '8px',
                fontSize: '14px', // AUMENTADO de 13px a 14px
                fontFamily: 'system-ui, -apple-system, sans-serif',
                pointerEvents: 'none',
                zIndex: 1000,
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.1s ease',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                minWidth: `${tooltipWidth}px`,
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
            }}
        >
            <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                    fontWeight: 600, 
                    fontSize: '15px', // AUMENTADO de 14px a 15px
                    marginBottom: '3px',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                }}>
                    <span style={{ color: 'white' }}>USD/COP</span>
                    <span style={{ color: 'white', fontSize: '13px' }}>{time}</span> {/* AUMENTADO de 12px a 13px */}
                </div>
            </div>
            
            {/* SECCIÓN DE PRECIO MÁS DESTACADA */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                    fontSize: '13px', // AUMENTADO de 12px a 13px
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '3px'
                }}>
                    Precio:
                </div>
                <div style={{ 
                    fontSize: '17px', // AUMENTADO de 16px a 17px
                    fontWeight: 700,
                    color: 'white'
                }}>
                    ${price?.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </div>
            </div>

            {/* VARIACIÓN Y PUNTOS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px' }}> {/* AUMENTADO de 12px a 13px */}
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Variación:</span>
                <span style={{ 
                    textAlign: 'right', 
                    color: isPositive ? '#10b981' : '#ef4444', 
                    fontWeight: 600 
                }}>
                    {isPositive ? '+' : ''}{variation.toFixed(2)}%
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Puntos:</span>
                <span style={{ textAlign: 'right', color: 'white', fontWeight: 500 }}>
                    {pointCount}
                </span>
            </div>
        </div>
    );
}
// Función para convertir hora HH:mm:ss a timestamp Unix con fecha actual
const timeToUnixTodayBogota = (timeStr) => {
    try {
        const [hh, mm, ss = 0] = String(timeStr).split(":").map(Number);
        if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
            console.warn(` [TIME_CONVERSION] Formato inválido: ${timeStr}`);
            return null;
        }

        // Crear fecha actual en Bogotá
        const now = new Date();
        const bogotaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
        
        const year = bogotaTime.getFullYear();
        const month = bogotaTime.getMonth();
        const day = bogotaTime.getDate();
        
        // Crear fecha completa con hora específica en Bogotá
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}-05:00`;
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
            // Fallback: usar UTC con offset
            const fallbackDate = new Date(Date.UTC(year, month, day, hh, mm, ss));
            return isNaN(fallbackDate.getTime()) ? null : Math.floor(fallbackDate.getTime() / 1000);
        }
        
        return Math.floor(date.getTime() / 1000);

    } catch (error) {
        console.error(` [TIME_CONVERSION] Error con ${timeStr}:`, error);
        return null;
    }
};

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
    const currentDataRef = useRef([]); // Para almacenar los datos actuales

    // Estado UI
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [tooltip, setTooltip] = useState({
        visible: false,
        price: null,
        time: '',
        x: 0,
        y: 0,
        pointCount: 0,
        firstPrice: null
    });
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
                    vertLine: { 
                        color: "rgba(200,200,200,.5)", 
                        width: 1, 
                        style: LineStyle.Dashed,
                        visible: true
                    },
                    horzLine: { 
                        color: "rgba(200,200,200,.5)", 
                        width: 1, 
                        style: LineStyle.Dashed,
                        visible: true
                    },
                },
                timeScale: {
                    rightOffset: 0,
                    barSpacing: 5,
                    fixLeftEdge: true,
                    lockVisibleTimeRangeOnResize: true,
                    rightBarStaysOnScroll: false,
                    borderVisible: false,
                    timeVisible: true,
                    secondsVisible: false,
                    tickMarkFormatter: (time) => {
                        const date = new Date(time * 1000);
                        // Usar zona horaria de Bogotá para el formateo
                        return date.toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Bogota'
                        });
                    },
                },
                width: chartContainerRef.current.clientWidth,
                height: isMobile ? 400 : isTablet ? 500 : 705,
                leftPriceScale: { visible: true, scaleMargins: { top: 0.1, bottom: 0.1 } },
                rightPriceScale: { visible: false, scaleMargins: { top: 0.9, bottom: 0 } },
                localization: { 
                    priceFormatter: (p) => Number(p).toFixed(2),
                    timeFormatter: (time) => {
                        const date = new Date(time * 1000);
                        return date.toLocaleDateString('es-CO', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'America/Bogota'
                        });
                    }
                },
                handleScroll: { mouseWheel: false },
                handleScale: { axisPressedMouseMove: false }
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

            // NUEVA IMPLEMENTACIÓN: Tooltip que sigue el puntero (crosshair)
            chart.subscribeCrosshairMove(param => {
                if (!param.point || param.point.x < 0 || param.point.y < 0) {
                    setTooltip(prev => ({ ...prev, visible: false }));
                    return;
                }

                const priceData = param.seriesData.get(priceSeriesRef.current);
                const mountData = param.seriesData.get(mountSeriesRef.current);

                if (priceData && param.time) {
                    // Obtener la posición del puntero (crosshair) en el gráfico
                    const crosshairX = param.point.x;
                    const crosshairY = param.point.y;

                    // Convertir coordenadas del gráfico a coordenadas de la pantalla
                    const chartContainer = chartContainerRef.current;
                    const containerRect = chartContainer.getBoundingClientRect();
                    
                    // Usar la posición del puntero del gráfico, no del mouse
                    const pointerX = containerRect.left + crosshairX;
                    const pointerY = containerRect.top + crosshairY;

                    // Encontrar el punto de datos exacto
                    const dataPoint = currentDataRef.current.find(item => item.time === param.time);
                    
                    if (dataPoint) {
                        const timeStr = typeof param.time === 'number' 
                            ? new Date(param.time * 1000).toLocaleTimeString('es-CO', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                timeZone: 'America/Bogota'
                            })
                            : dataPoint.originalTime || '--:--:--';

                        // Obtener el primer precio para calcular la variación real
                        const firstPrice = currentDataRef.current.length > 0 
                            ? currentDataRef.current[0].price 
                            : null;

                        setTooltip({
                            visible: true,
                            price: priceData.value,
                            time: timeStr,
                            x: pointerX,
                            y: pointerY,
                            pointCount: currentDataRef.current?.length || 0,
                            firstPrice: firstPrice
                        });
                        return;
                    }
                }
                
                setTooltip(prev => ({ ...prev, visible: false }));
            });

            // Hide tooltip when mouse leaves chart
            const hideTooltip = () => {
                setTooltip(prev => ({ ...prev, visible: false }));
            };

            chartContainerRef.current.addEventListener('mouseleave', hideTooltip);

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
                if (chartContainerRef.current) {
                    chartContainerRef.current.removeEventListener('mouseleave', hideTooltip);
                }
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

    // --- función de pintado (con almacenamiento de datos para tooltip) ---
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
                    // Usar la función mejorada que incluye la fecha actual
                    const t = timeToUnixTodayBogota(timeStr);
                    return { 
                        time: t, 
                        price: prices[i], 
                        amount: amounts[i], 
                        originalTime: timeStr 
                    };
                })
                .filter((x) => x.time !== null && !isNaN(x.time) && !isNaN(x.price) && !isNaN(x.amount))
                .sort((a, b) => a.time - b.time);

            console.log('Datos procesados con timestamps actuales:', dataWithTimestamps);

            // dedup por timestamp (mantén el último)
            const unique = [];
            const seen = new Set();
            for (let i = dataWithTimestamps.length - 1; i >= 0; i--) {
                const k = dataWithTimestamps[i].time;
                if (!seen.has(k)) { 
                    seen.add(k); 
                    unique.unshift(dataWithTimestamps[i]); 
                }
            }

            const priceData = unique.map((x) => ({ time: x.time, value: x.price }));
            const mountData = unique.map((x) => ({ time: x.time, value: x.amount }));

            // Store data for tooltip access
            currentDataRef.current = unique;

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
                position: "relative",
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
            {/* Tooltip mejorado que sigue el PUNTERO (crosshair) no el cursor */}
            <ChartTooltip {...tooltip} />
        </div>
    );
};

export default DollarChart;