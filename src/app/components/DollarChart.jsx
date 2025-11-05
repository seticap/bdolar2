//src/app/components/DollarChart.jsx
"use client"

/**
 * DollarChart
 * -------------
 * Componente de gráfico intradía (USD/COP) basado en `lightweight-charts`.
 * Dibuja:
 *  - Serie principal de precio (BaselineSeries) con rellenos arriba/abajo.
 *  - Serie de montos (HistogramSeries) en escala derecha.
 *  - Línea de referencia en el primer valor del día (price line "Inicio").
 *  - Tooltip manual sincronizado con el crosshair.
 *
 * Datos:
 *  - Se consumen por WebSocket (id=1000) con un payload tipo string "raro"
 *    que contiene `labels`, `data` (precios) y `data` (montos). El payload
 *    es parseado aquí mismo y transformado a puntos con timestamp para
 *    alimentar las series.
 *
 * Interfaz / UX:
 *  - Ajuste responsive: detecta mobile/tablet para ancho/alto del chart.
 *  - Time scale muestra HH:mm en zona local del navegador (sin segundos).
 *  - Crosshair con líneas punteadas y tooltip flotante.
 *  - auto-fit al rango de datos y control min/max de barras visibles.
 *
 * Limpieza:
 *  - Desuscribe eventos y elimina el chart en unmount.
 *  - Desconecta el WS en unmount de este componente.
 *
 * NOTA: Este componente no persiste ni comparte datos de gráfico con el
 *       provider de gráficos. Sólo actualiza su propio canvas.
 */

import { useEffect, useState, useRef } from "react";
import {
    BaselineSeries,
    createChart,
    CrosshairMode,
    HistogramSeries,
    LineStyle,
} from "lightweight-charts";
import { webSocketServices, tokenServices } from "../services/socketService";
import { useWebSocketData } from "../services/WebSocketDataProvider";

const DollarChart = () => {
// Helper expuesto por el provider global para registrar datos de ids ≠ 1000
  const { updateData } = useWebSocketData();

  /** Contenedor DOM del chart. */
  const chartContainerRef = useRef(null);
  /** Instancia del chart (createChart). */
  const chartRef = useRef(null);
  /** Serie de precio (BaselineSeries). */
  const priceSeriesRef = useRef(null);
  /** Serie de montos (HistogramSeries). */
  const mountSeriesRef = useRef(null);
  /** Referencia a la price line de "Inicio" para poder removerla/recrear. */
  const inicioLineRef = useRef(null);

  /** Timestamp de la última actualización (ms). */
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  /** Última etiqueta (label) recibida HH:mm del WS 1000. */
  const [lastUpdateLabel, setLastUpdateLabel] = useState("");
  /** Flags de diseño responsive. */
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  /** Fecha actual (dd/MM/yyyy), UI opcional. */
  const [currentDate, setCurrentDate] = useState("");
  /** Flag de vida del componente para evitar sets en unmount. */
  const isMounted = useRef(true);

  /**
   * Retorna la fecha actual en formato dd/MM/yyyy.
   * @returns {string}
   */
  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

/* ───────────────────────────── Fecha actual (cada 60s) ───────────────────────────── */
  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(getCurrentDate());
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

/* ───────────────────────────── Flags responsive ───────────────────────────── */
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

/* ───────────────────────────── Inicialización del chart ───────────────────────────── */
  useEffect(() => {
    isMounted.current = true;
// Evitar recrear el chart si ya existe
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
          // ⬇️ sólo HH:mm (sin segundos)
          secondsVisible: false, // ✅ Cambiado a false para mostrar solo horas:minutos
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000);
            const hours = date.getHours().toString().padStart(2, "0"); // ✅ Cambiado a getHours() local
            const minutes = date.getMinutes().toString().padStart(2, "0"); // ✅ Cambiado a getMinutes() local
            return `${hours}:${minutes}`; // ✅ Solo muestra hora:minutos sin fecha
          },
        },
      // Dimensiones segun dispositivo
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

    /* Serie de PRECIO (Baseline) */
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

    /* Serie de MONTOS (Histogram) */
      mountSeriesRef.current = chart.addSeries(HistogramSeries, {
        color: "gray",
        priceFormat: { type: "volume" },
        priceScaleId: "right",
      });

      chartRef.current = chart;

    /* ───────── Tooltip custom anclado al crosshair ───────── */
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

    // Actualiza contenido/posición del tooltip en movimiento del crosshair
      chart.subscribeCrosshairMove((param) => {
        if (param.point === undefined || !param.seriesData || !param.time) {
          tooltip.style.display = "none";
          return;
        }

        const price = param.seriesData.get(priceSeriesRef.current)?.value;
        const mount = param.seriesData.get(mountSeriesRef.current)?.value;

        if (price !== undefined || mount !== undefined) {
          const date = new Date(param.time * 1000);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          const timeStr = `${hours}:${minutes}`; //  Solo hora:minutos en el tooltip

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

    /* ───────── Handler de resize (responsive) ───────── */
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

    /* Limpieza al desmontar: desuscribir y destruir chart */
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

/* ───────────────────────────── WebSocket (1000 live) ───────────────────────────── */
  useEffect(() => {
  // Token tomado del servicio o del localStorage (compat)
    const token =
      tokenServices.getToken() || localStorage.getItem("auth-token");
    if (!token) {
      console.error("Token no disponible");
      return;
    }
  // Conecta en canal "delay" (si backend lo soporta)
    webSocketServices.connect(token, "delay");

    /**
     * Listener principal del WS.
     *  - id=1000: parsea string con precios/montos/labels → actualiza chart
     *  - otros ids: reenvía a `updateData` del provider global
     */

    const handleMessage = (msg) => {
      if (!isMounted.current) return;

      try {
        const parsed = JSON.parse(msg);
      // Payload de gráfico intradía
        if (
          parsed.id === 1000 &&
          parsed.result?.[0]?.datos_grafico_moneda_mercado
        ) {
          const dataStr = parsed.result[0].datos_grafico_moneda_mercado;
      // Extrae primer `data:[...]` (precios), segundo `data:[...]` (montos), y `labels:[...]`
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

      // Alinea arrays por la menor longitud disponible
            const minLength = Math.min(
              prices.length,
              amounts.length,
              labels.length
            );
            const validPrices = prices.slice(0, minLength);
            const validAmounts = amounts.slice(0, minLength);
            const validLabels = labels.slice(0, minLength);
      
      // Actualiza el chart si hay datos válidos
            if (minLength > 0 && isMounted.current) {
              updateChart(validPrices, validAmounts, validLabels);
              setLastUpdateTime(Date.now());
              setLastUpdateLabel(validLabels[validLabels.length - 1]);
            }
          }
        } else if (parsed.id !== 1000) {
      // Otros IDs: delega a provider para que el resto de la app los consuma
          updateData(parsed.id, parsed);
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
      }
    };

    webSocketServices.addListener(handleMessage);
      // Desconecta el WS al desmontar este componente
    return () => {
      webSocketServices.disconnect();
    };
  }, []);

  /**
   * Actualiza el gráfico a partir de precios, montos y etiquetas de tiempo.
   * - Convierte cada `label` (HH:mm[:ss]) a timestamp unix del "hoy".
   * - Elimina timestamps duplicados conservando el último valor.
   * - Ajusta el timeScale a los datos (fitContent) y controla el visible range.
   * - Crea/actualiza la `priceLine` de referencia en el primer valor.
   *
   * @param {number[]} prices  - Valores de precio.
   * @param {number[]} amounts - Valores de montos.
   * @param {string[]} labels  - Etiquetas de tiempo ("HH:mm" o "HH:mm:ss").
   */

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
      // Mapea HH:mm(:ss) → timestamp unix de HOY
      const dataWithTimestamps = labels
        .map((timeStr, i) => {
          const [hours, minutes, seconds] = timeStr.split(":").map(Number);
          
          // Fecha actual (local) + hora del label
          const today = new Date();
          today.setHours(hours, minutes, seconds || 0, 0); // Usar 0 segundos si no vienen
          
          return {
            time: Math.floor(today.getTime() / 1000), //  Timestamp Unix correcto
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

     // Eliminar duplicados por timestamp conservando el último valor
      const uniqueData = [];
      const seenTimestamps = new Set();

      for (let i = dataWithTimestamps.length - 1; i >= 0; i--) {
        if (!seenTimestamps.has(dataWithTimestamps[i].time)) {
          seenTimestamps.add(dataWithTimestamps[i].time);
          uniqueData.unshift(dataWithTimestamps[i]);
        }
      }
    // Transformación a formato de series lightweight
      const priceData = uniqueData.map((item) => ({
        time: item.time,
        value: item.price,
      }));

      const mountData = uniqueData.map((item) => ({
        time: item.time,
        value: item.amount,
      }));
    // Pintar data si hay puntos válidos
      if (priceData.length > 0 && mountData.length > 0) {
        priceSeriesRef.current.setData(priceData);
        mountSeriesRef.current.setData(mountData);
    // Ajuste de tiempo al contenido
        chartRef.current.timeScale().fitContent();
    // Rango visible mínimo y máximo de barras
        const totalBars = priceData.length;
        chartRef.current.timeScale().applyOptions({
          minVisibleBarCount: 5,
          maxVisibleBarCount: totalBars,
        });

    // Línea de referencia en el primer valor (reinicia para evitar duplicados)
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
      // Establece el "baseline" de la serie en el primer precio
          priceSeriesRef.current.applyOptions({
            baseValue: { type: "price", price: firstValue },
          });
        }
      }
    } catch (error) {
      console.error("Error al actualizar gráfico:", error);
    }
  };

  /* ───────────────────────────── Render ───────────────────────────── */
  return (
    <div
      style={{
        width: "100%",
        padding: isMobile ? "0 20px" : isTablet ? "0 40px" : "0",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        height: "100%",
        position: 'relative',
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
}

export default DollarChart;