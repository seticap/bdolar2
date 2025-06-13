"use client";

import { useEffect, useState, useRef } from "react";
import {
  BaselineSeries,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
} from "lightweight-charts";
import WebSocketService from "../services/websocketdelay";
import TokenService from "../services/TokenService";
import { useWebSocketData } from "./WebSocketDataContext";

const WSLiveView = () => {
  const { updateData } = useWebSocketData();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const priceSeriesRef = useRef(null);
  const mountSeriesRef = useRef(null);
  const inicioLineRef = useRef(null);

  // Estados
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [lastUpdateLabel, setLastUpdateLabel] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const isMounted = useRef(true);

  // Detección de dispositivo mejorada
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Inicialización del gráfico
  useEffect(() => {
    isMounted.current = true;

    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: "solid", color: "#202026" },
          textColor: "lightgray",
        },
        grid: {
          vertLines: "",
          horzLines: "",
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: "rgba(200, 200, 200, 0.5)",
            width: 1,
            style: LineStyle.Dashed,
          },
          horzLine: {
            color: "rgba(200, 200, 200, 0.5)",
            width: 1,
            style: LineStyle.Dashed,
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
          secondsVisible: true,
          tickMarkFormatter: (time, tickIndex) => {
            const date = new Date(time * 1000);
            const hours = date.getUTCHours().toString().padStart(2, "0");
            const minutes = date.getUTCMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`;
          },
        },
        width: isMobile
          ? window.innerWidth - 40
          : isTablet
          ? window.innerWidth * 0.9
          : 1100,
        height: isMobile ? 400 : isTablet ? 500 : 705,
        leftPriceScale: {
          visible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        rightPriceScale: {
          visible: false,
          scaleMargins: {
            top: 0.9,
            bottom: 0,
          },
        },
        localization: {
          priceFormatter: (price) => price.toFixed(2),
        },
      });

      priceSeriesRef.current = chart.addSeries(BaselineSeries, {
        topLineColor: "rgba(34, 139, 34, 1)",
        topFillColor1: "rgba(34, 139, 34, 0.25)",
        topFillColor2: "rgba(34, 139, 34, 0.05)",
        bottomLineColor: "rgba(165, 42, 42, 1)",
        bottomFillColor1: "rgba(165, 42, 42, 0.05)",
        bottomFillColor2: "rgba(165, 42, 42, 0.25)",
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

      // Tooltip para el crosshair
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.zIndex = "1000";
      tooltip.style.background = "black";
      tooltip.style.color = "#fff";
      tooltip.style.padding = "6px 10px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.display = "none";
      tooltip.style.fontSize = "12px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.transition = "all 0.1s ease";
      tooltip.style.border = "1px solid rgba(255, 255, 255, 0.1)";
      chartContainerRef.current.appendChild(tooltip);

      chart.subscribeCrosshairMove((param) => {
        if (param.point === undefined || !param.seriesData || !param.time) {
          tooltip.style.display = "none";
          return;
        }

        const price = param.seriesData.get(priceSeriesRef.current)?.value;
        const mount = param.seriesData.get(mountSeriesRef.current)?.value;

        if (price !== undefined || mount !== undefined) {
          const date = new Date(param.time * 1000);
          const timeStr = date.toISOString().substr(11, 8);

          tooltip.innerHTML = `
            <div><strong>Hora:</strong> ${timeStr}</div>
            ${
              price !== undefined
                ? `<div><strong>Precio:</strong> ${price.toFixed(2)}</div>`
                : ""
            }
            ${
              mount !== undefined
                ? `<div><strong>Montos:</strong> ${mount.toFixed(2)}</div>`
                : ""
            }
          `;

          tooltip.style.display = "block";
          tooltip.style.left = `${Math.min(
            param.point.x + 10,
            window.innerWidth - 150
          )}px`;
          tooltip.style.top = `${param.point.y + 30}px`;
        }
      });

      const handleResize = () => {
        if (
          chartRef.current &&
          chartContainerRef.current &&
          isMounted.current
        ) {
          chartRef.current.applyOptions({
            width: isMobile
              ? window.innerWidth - 40
              : isTablet
              ? window.innerWidth * 0.9
              : chartContainerRef.current.clientWidth,
            height: isMobile
              ? 400
              : isTablet
              ? 500
              : chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        isMounted.current = false;
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (error) {
            console.warn("Error durante la limpieza del gráfico:", error);
          }
          chartRef.current = null;
          priceSeriesRef.current = null;
          mountSeriesRef.current = null;
        }
      };
    }
  }, [isMobile, isTablet]);

  // Manejo de WebSocket
  useEffect(() => {
    const token =
      TokenService.getToken() || localStorage.getItem("token-socket");
    if (!token) {
      console.error("Token no disponible");
      return;
    }

    WebSocketService.connect(token, "delay");

    const handleMessage = (msg) => {
      if (!isMounted.current) return;

      try {
        const parsed = JSON.parse(msg);
        if (
          parsed.id === 1000 &&
          parsed.result?.[0]?.datos_grafico_moneda_mercado
        ) {
          const dataStr = parsed.result[0].datos_grafico_moneda_mercado;

          const pricesMatch = dataStr.match(/data:\s*\[([^\]]+)\]/);
          const amountsMatches = dataStr.match(/data:\s*\[([^\]]+)\]/g) || [];
          const labelsMatch = dataStr.match(/labels:\s*\[([^\]]+)\]/);

          if (pricesMatch && amountsMatches.length >= 2 && labelsMatch) {
            const amountsMatch = amountsMatches[1];

            const prices = (pricesMatch[1]?.split(",") || [])
              .map(Number)
              .filter((n) => !isNaN(n));

            const amounts = (
              amountsMatch.match(/\[([^\]]+)\]/)?.[1]?.split(",") || []
            )
              .map(Number)
              .filter((n) => !isNaN(n));

            const labels = (labelsMatch[1]?.split(",") || [])
              .map((label) => label.trim().replace(/["']/g, ""))
              .filter(Boolean);

            const minLength = Math.min(
              prices.length,
              amounts.length,
              labels.length
            );
            const validPrices = prices.slice(0, minLength);
            const validAmounts = amounts.slice(0, minLength);
            const validLabels = labels.slice(0, minLength);

            if (minLength > 0 && isMounted.current) {
              updateChart(validPrices, validAmounts, validLabels);
              setLastUpdateTime(Date.now());
              setLastUpdateLabel(validLabels[validLabels.length - 1]);
            }
          }
        } else if (parsed.id !== 1000) {
          updateData(parsed.id, parsed);
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
      }
    };

    WebSocketService.addListener(handleMessage);

    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  const updateChart = (prices, amounts, labels) => {
    if (
      !isMounted.current ||
      !chartRef.current ||
      !priceSeriesRef.current ||
      !mountSeriesRef.current
    ) {
      return;
    }

    try {
      const dataWithTimestamps = labels
        .map((timeStr, i) => {
          const [hours, minutes, seconds] = timeStr.split(":").map(Number);
          const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

          return {
            time: timeInSeconds,
            price: prices[i],
            amount: amounts[i],
            originalTime: timeStr,
          };
        })
        .filter(
          (item) =>
            !isNaN(item.time) && !isNaN(item.price) && !isNaN(item.amount)
        )
        .sort((a, b) => a.time - b.time);

      // Eliminar duplicados manteniendo el último valor
      const uniqueData = [];
      const seenTimestamps = new Set();

      for (let i = dataWithTimestamps.length - 1; i >= 0; i--) {
        if (!seenTimestamps.has(dataWithTimestamps[i].time)) {
          seenTimestamps.add(dataWithTimestamps[i].time);
          uniqueData.unshift(dataWithTimestamps[i]);
        }
      }

      const priceData = uniqueData.map((item) => ({
        time: item.time,
        value: item.price,
      }));

      const mountData = uniqueData.map((item) => ({
        time: item.time,
        value: item.amount,
      }));

      if (priceData.length > 0 && mountData.length > 0) {
        priceSeriesRef.current.setData(priceData);
        mountSeriesRef.current.setData(mountData);

        chartRef.current.timeScale().fitContent();

        const totalBars = priceData.length;
        chartRef.current.timeScale().applyOptions({
          minVisibleBarCount: 5,
          maxVisibleBarCount: totalBars,
        });

        if (inicioLineRef.current) {
          priceSeriesRef.current.removePriceLine(inicioLineRef.current);
        }

        const firstValue = priceData[0]?.value;

        if (firstValue !== undefined) {
          inicioLineRef.current = priceSeriesRef.current.createPriceLine({
            price: firstValue,
            color: "rgba(200, 200, 200, 0.7)",
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
    } catch (error) {
      console.error("Error al actualizar gráfico:", error);
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
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          width: isTablet ? "90%" : "100%",
          height: isMobile ? "50vh" : isTablet ? "60vh" : "73vh",
          minHeight: "400px",
          maxWidth: "1100px",
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

export default WSLiveView;
