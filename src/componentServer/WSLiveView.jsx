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

  //Estados
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [lastUpdateLabel, setLastUpdateLabel] = useState("");
  const isMounted = useRef(true);

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
        },
        timeScale: {
          rightOffset: 0,
          barSpacing: 5,
          fixLeftEdge: true,
          lockVisibleTimeRangeOnResize: true,
          rightBarStaysOnScroll: false,
          borderVisible: false,
          timeVisible: true,
          secondsVisible: true, // Mostrar segundos en el eje de tiempo
          tickMarkFormatter: (time, tickIndex) => {
            const date = new Date(time * 1000);
            const hours = date.getUTCHours().toString().padStart(2, "0");
            const minutes = date.getUTCMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`;
          },
        },
        width: chartContainerRef.current.clientWidth,
        hight: 500,

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
            top: 0.9, // ⬅ Control del tamaño
            bottom: 0,
          },
        },
      });

      priceSeriesRef.current = chart.addSeries(BaselineSeries, {
        topLineColor: "rgba(34, 139, 34, 1)", // ForestGreen (verde oscuro)
        topFillColor1: "rgba(34, 139, 34, 0.25)",
        topFillColor2: "rgba(34, 139, 34, 0.05)",
        bottomLineColor: "rgba(165, 42, 42, 1)", // Brown (rojo oscuro)
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

      // chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      //   const range = chart.timeScale().getVisibleRange();
      //   if (range) {
      //     console.log("🔍 Rango visible en el eje X:");
      //     console.log("From:", range.from);
      //     console.log("To:", range.to);
      //     console.log(chart);

      //   }
      // });

      //setVisibleRange
      {
        /*chart.timeScale().setVisibleRange({
        from: 1716561600, // Ejemplo: "2024-05-25 08:00:00" (en UNIX timestamp)
        to: 1716572400, // Ejemplo: "2024-05-25 11:00:00"
      }); */
      }

      //getVisibleLogicalRange
      {
        /*const logicalRange = chart.timeScale().getVisibleLogicalRange();
      console.log(logicalRange); */
      } // { from: 50.5, to: 200.5 }

      //setVisibleLogicalRange
      {
        /* chart.timeScale().setVisibleLogicalRange({ from: 10, to: 100 }); */
      }

      //suscribeVisibleLogicalRange
      {
        /* chart.timeScale().subscribeVisibleTimeRangeChange((newRange) => {
        console.log("Nuevo rango visible:", newRange);
      }); */
      }

      chartRef.current = chart;

      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute";
      tooltip.style.zIndex = "1000";
      tooltip.style.background = "red";
      tooltip.style.color = "#fff";
      tooltip.style.padding = "6px 10px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.display = "none";
      tooltip.style.fontSize = "12px";
      tooltip.style.pointerEvents = "none";
      tooltip.style.transition = "all 0.1s ease";
      chartContainerRef.current.appendChild(tooltip);

      chart.subscribeCrosshairMove((param) => {
        if (param.point === undefined || !param.seriesData || !param.time) {
          tooltip.style.display = "none";
          return;
        }

        const price = param.seriesData.get(priceSeriesRef.current)?.value;
        const mount = param.seriesData.get(mountSeriesRef.current)?.value;

        if (price !== undefined || mount !== undefined) {
          tooltip.innerHTML = `
          ${
            price !== undefined
              ? `<div><strong>Precio :</strong> ${price}</div>`
              : ""
          }
          ${
            mount !== undefined
              ? `<div><strong>Montos :</strong> ${mount}</div>`
              : ""
          }
          `;

          tooltip.style.display = "block";
          tooltip.style.left = param.point.x + 10 + "px";
          tooltip.style.top = param.point.y + 30 + "px";
        }
      });

      return () => {
        isMounted.current = false;
        if (chartRef.current && !chartRef.current._internal_isDestroyed) {
          try {
            if (!chartRef.current._internal_isDestroyed) {
              chartRef.current = null;
            }
          } catch (error) {
            console.warn("Error durante la limpieza del gráfico:", error);
          }
          chartRef.current.remove();
          chartRef.current = null;
          priceSeriesRef.current = null;
          mountSeriesRef.current = null;
        }
      };
    }
  }, []);

  //--------------------------- Manejo de WebSocket -----------------------------------//
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
              setLastUpdateLabel(validLabels[validLabels.length - 1]); // Guardar la última etiqueta
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
      !mountSeriesRef.current ||
      chartRef.current._internal_isDestroyed
    ) {
      return;
    }

    try {
      // Convertir HH:MM:SS a segundos desde inicio del día
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

      // Preparar datos para el gráfico
      const priceData = uniqueData.map((item) => ({
        time: item.time,
        value: item.price,
      }));

      const mountData = uniqueData.map((item) => ({
        time: item.time,
        value: item.amount,
      }));

      if (isMounted.current && priceData.length > 0 && mountData.length > 0) {
        priceSeriesRef.current.setData(priceData);
        mountSeriesRef.current.setData(mountData);

        chartRef.current.timeScale().fitContent();

        chartRef.current.timeScale().applyOptions({
          lockVisibleTimeRangeOnResize: true,
        });

        const totalBars = priceData.length;
        chartRef.current.timeScale().applyOptions({
          minVisibleBarCount: 5, // Zoom máximo (puedes ajustar este valor)
          maxVisibleBarCount: totalBars, // Zoom mínimo (no se puede alejar más allá del gráfico completo)
        });

        if (inicioLineRef.current) {
          priceSeriesRef.current.removePriceLine(inicioLineRef.current);
        }

        //Agregar linea que representa el primer valor
        const firstValue = priceData[0]?.value;

        if (firstValue !== undefined) {
          inicioLineRef.current = priceSeriesRef.current.createPriceLine({
            price: firstValue,
            color: "lightgray",
            lineWidth: 1,
            LineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            affectsScale: true,
          });
        }

        // Actualizar dinámicamente el baseValue con el primer valor recibido
        if (firstValue !== undefined) {
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
    <>
      <div
        ref={chartContainerRef}
        style={{
          width: "120vh",
          height: "680px",
          minHeight: "680px",
          display: "block",
          position: "relative",
          overflow: "hidden",
          borderRadius: "5px",
          marginTop: "20px",
        }}
      />
    </>
  );
};

export default WSLiveView;
