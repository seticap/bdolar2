"use client"

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
    
  // Referencias y estado del componente
  // Contexto: función para actualizar datos que no son de tipo 1000
  const { updateData } = useWebSocketData();

  // Referencias para almacenar el contenedor del gráfico y las series
  const chartContainerRef = useRef(null); // Referencia al contenedor HTML del gráfico
  const chartRef = useRef(null); // Referencia al gráfico creado
  const priceSeriesRef = useRef(null); // Referencia a la serie de precios
  const mountSeriesRef = useRef(null); // Referencia a la serie de montos (volúmenes)
  const inicioLineRef = useRef(null); // Línea de referencia para el precio inicial

  // Estado para información de actualización (Estados del componente)
  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Marca de tiempo de la última actualización
  const [lastUpdateLabel, setLastUpdateLabel] = useState(""); // Etiqueta de la última actualización
  const [isMobile, setIsMobile] = useState(false); // Bandera para detectar si es un dispositivo móvil
  const [isTablet, setIsTablet] = useState(false); // Bandera para detectar si es tablet
  const isMounted = useRef(true); // Controla si el componente sigue montado para evitar actualizaciones inválidas

  // Hook para detectar el tamaño del dispositivo y ajustar el diseño
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768); // Menor a 768px = móvil
      setIsTablet(width >= 768 && width < 1024); // Entre 768px y 1024px = tablet
    };

    checkDevice(); // Verifica inicialmente
    window.addEventListener("resize", checkDevice); // Y al redimensionar la ventana
    return () => window.removeEventListener("resize", checkDevice); // Limpieza
  }, []);

  // Hook para inicializar el gráfico cuando el componente se monta
  useEffect(() => {
    isMounted.current = true; // Marca como montado

    // Solo se ejecuta si hay un contenedor disponible y aún no se creó el gráfico
    if (chartContainerRef.current && !chartRef.current) {
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: "solid", color: "#202026" }, // Fondo oscuro
          textColor: "lightgray", // Texto en gris claro
        },
        grid: {
          vertLines: "", // Sin líneas verticales
          horzLines: "", // Sin líneas horizontales
        },
        crosshair: {
          // Configuración del puntero cruzado
          mode: CrosshairMode.Normal, // Modo normal (muestra líneas vertical y horizontal)
          vertLine: {
            color: "rgba(200, 200, 200, 0.5)", // Color semitransparente
            width: 1,
            style: LineStyle.Dashed, // Línea punteada
          },
          horzLine: {
            color: "rgba(200, 200, 200, 0.5)",
            width: 1,
            style: LineStyle.Dashed,
          },
        },
        timeScale: {
          // Configuración del eje X (tiempo)
          rightOffset: 0, // Espacio adicional a la derecha del gráfico
          barSpacing: 5, // Espacio entre barras o puntos del gráfico
          fixLeftEdge: true, // Fija el borde izquierdo cuando se hace zoom
          lockVisibleTimeRangeOnResize: true, // Mantiene el rango visible al redimensionar
          rightBarStaysOnScroll: false, // El gráfico no se ajusta automáticamente al final con scroll
          borderVisible: false, // Oculta el borde del eje X
          timeVisible: true, // Muestra las etiquetas del eje X
          secondsVisible: true, // Muestra segundos en la escala de tiempo
          tickMarkFormatter: (time) => {
            // Función personalizada para mostrar marcas de tiempo
            const date = new Date(time * 1000); // Convierte timestamp en objeto Date
            const hours = date.getUTCHours().toString().padStart(2, "0");
            const minutes = date.getUTCMinutes().toString().padStart(2, "0");
            return `${hours}:${minutes}`; // Devuelve la hora en formato hh:mm
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: isMobile ? 400 : isTablet ? 500 : 705, // Ajuste de alto según dispositivo
        leftPriceScale: {
          visible: true, // Muestra la escala de precios a la izquierda
          scaleMargins: {
            top: 0.1, // Margen superior
            bottom: 0.1, // Margen inferior
          },
        },
        rightPriceScale: {
          visible: false, // Oculta la escala derecha (montos se grafican sin escala visible)
          scaleMargins: {
            top: 0.9, // Deja margen para evitar que los montos se sobrepongan arriba
            bottom: 0,
          },
        },
        localization: {
          priceFormatter: (price) => price.toFixed(2), // Formato para precios con 2 decimales
        },
      });

      // Agrega serie de precios (Baseline)
      priceSeriesRef.current = chart.addSeries(BaselineSeries, {
        topLineColor: "rgba(34, 139, 34, 1)", // Verde para precios superiores al base
        topFillColor1: "rgba(34, 139, 34, 0.25)",
        topFillColor2: "rgba(34, 139, 34, 0.05)",
        bottomLineColor: "rgba(165, 42, 42, 1)", // Rojo para precios inferiores al base
        bottomFillColor1: "rgba(165, 42, 42, 0.05)",
        bottomFillColor2: "rgba(165, 42, 42, 0.25)",
        lineWidth: 2, // Grosor de la línea de precios
        priceScaleId: "left", // Asocia esta serie a la escala izquierda
        priceLineVisible: false, // Oculta línea de precio actual
        lastValueVisible: false, // Oculta etiqueta del último valor
      });

      // Agrega serie de montos (Histogram)
      mountSeriesRef.current = chart.addSeries(HistogramSeries, {
        color: "gray", // Color del histograma (montos)
        priceFormat: { type: "volume" }, // Formato de volumen para la escala
        priceScaleId: "right", // Se asociaría a escala derecha (aunque no visible)
      });

      chartRef.current = chart; // Guarda referencia al gráfico

      // Tooltip para el crosshair (puntero del gráfico)
      // Se crea un elemento HTML flotante para mostrar datos dinámicos cuando el usuario pasa el mouse sobre el gráfico
      const tooltip = document.createElement("div");
      tooltip.style.position = "absolute"; // Posición absoluta para colocarse encima del gráfico
      tooltip.style.zIndex = "1000"; // Se asegura de estar por encima de otros elementos
      tooltip.style.background = "black"; // Fondo negro para contraste
      tooltip.style.color = "#fff"; // Texto blanco
      tooltip.style.padding = "6px 10px"; // Espaciado interno
      tooltip.style.borderRadius = "4px"; // Bordes redondeados
      tooltip.style.display = "none"; // Oculto por defecto
      tooltip.style.fontSize = "12px"; // Tamaño del texto
      tooltip.style.pointerEvents = "none"; // No interfiere con otros eventos del mouse
      tooltip.style.transition = "all 0.1s ease"; // Animación suave
      tooltip.style.border = "1px solid rgba(255, 255, 255, 0.1)"; // Borde tenue
      chartContainerRef.current.appendChild(tooltip); // Se agrega el tooltip al contenedor del gráfico

      // Suscribe una función al evento de movimiento del crosshair (puntero en forma de cruz)
      chart.subscribeCrosshairMove((param) => {
        // Si no hay punto del cursor, datos de series o tiempo válido, oculta el tooltip
        if (param.point === undefined || !param.seriesData || !param.time) {
          tooltip.style.display = "none";
          return; // Termina ejecución si no hay datos válidos
        }

        // Obtiene el valor de la serie de precios en la posición actual del cursor
        const price = param.seriesData.get(priceSeriesRef.current)?.value;
        // Obtiene el valor de la serie de montos en la posición actual del cursor
        const mount = param.seriesData.get(mountSeriesRef.current)?.value;

        // Si hay al menos un valor (precio o monto), construye el contenido del tooltip
        if (price !== undefined || mount !== undefined) {
          const date = new Date(param.time * 1000); // Convierte el timestamp a objeto Date
          const timeStr = date.toISOString().substr(11, 8); // Formato 'hh:mm:ss'

          // Construcción dinámica del HTML para el tooltip, mostrando hora, precio y monto
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

          // Muestra el tooltip
          tooltip.style.display = "block";
          // Posiciona el tooltip a la derecha del cursor (con margen de 10px), limitado a la pantalla
          tooltip.style.left = `${Math.min(
            param.point.x + 10,
            window.innerWidth - 150
          )}px`;
          // Posiciona el tooltip 30px debajo del cursor
          tooltip.style.top = `${param.point.y + 30}px`;
        }
      });

      // Función que se ejecuta cuando cambia el tamaño de la ventana para actualizar dimensiones del gráfico
      const handleResize = () => {
        // Verifica que el gráfico esté montado y que existan las referencias necesarias
        if (
          chartRef.current &&
          chartContainerRef.current &&
          isMounted.current
        ) {
          // Aplica nuevas dimensiones según el tipo de dispositivo
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth, // Ancho igual al contenedor en escritorio
            height: isMobile
              ? 400 // Altura fija para móviles
              : isTablet
              ? 500 // Altura para tablets
              : chartContainerRef.current.clientHeight, // Altura igual al contenedor en escritorio
          });
        }
      };

      // Agrega el event listener para ejecutar handleResize al cambiar tamaño de ventana
      window.addEventListener("resize", handleResize);

      // Función de limpieza al desmontar el componente
      return () => {
        isMounted.current = false; // Marca que el componente ya no está activo
        window.removeEventListener("resize", handleResize); // Quita el listener de resize

        // Si el gráfico existe, intenta removerlo correctamente
        if (chartRef.current) {
          try {
            chartRef.current.remove(); // Limpia recursos internos del gráfico
          } catch (error) {
            console.warn("Error durante la limpieza del gráfico:", error);
          }
          // Limpia referencias para liberar memoria y evitar errores
          chartRef.current = null;
          priceSeriesRef.current = null;
          mountSeriesRef.current = null;
        }
      };
    }
    // useEffect dependiente del tipo de dispositivo (actualiza cuando cambia isMobile o isTablet)
  }, [isMobile, isTablet]);

  // Manejo de WebSocket para recibir datos en tiempo real del gráfico
  useEffect(() => {
    // Obtiene el token de autenticación desde el servicio o del almacenamiento local
    const token =
      tokenServices.getToken() || localStorage.getItem("auth-token");
    // Si no hay token disponible, muestra error y detiene la ejecución
    if (!token) {
      console.error("Token no disponible");
      return;
    }

    // Conecta al WebSocket utilizando el token y especificando el canal "delay"
    webSocketServices.connect(token, "delay");

    // Función para manejar cada mensaje recibido desde el WebSocket
    const handleMessage = (msg) => {
      // Si el componente ya no está montado, no se procesan los datos
      if (!isMounted.current) return;

      try {
        // Intenta convertir el mensaje (que viene como string JSON) en un objeto
        const parsed = JSON.parse(msg);
        // Verifica si el mensaje corresponde al ID 1000 y contiene datos del gráfico
        if (
          parsed.id === 1000 &&
          parsed.result?.[0]?.datos_grafico_moneda_mercado
        ) {
          // Extrae el string que contiene los datos del gráfico
          const dataStr = parsed.result[0].datos_grafico_moneda_mercado;

          // Usa expresiones regulares para encontrar los datos de precios, montos y etiquetas
          
          const pricesMatch = dataStr.match(/data:\s*\[([^\]]+)\]/);
          const amountsMatches = dataStr.match(/data:\s*\[([^\]]+)\]/g) || [];
          const labelsMatch = dataStr.match(/labels:\s*\[([^\]]+)\]/);

          // Si encuentra al menos dos series y etiquetas, continúa el procesamiento
          if (pricesMatch && amountsMatches.length >= 2 && labelsMatch) {
            const amountsMatch = amountsMatches[1]; // Segunda aparición de "data", que contiene los montos

            // Convierte los precios de string a número
            const prices = (pricesMatch[1]?.split(",") || [])
              .map(Number)
              .filter((n) => !isNaN(n));

            // Convierte los montos de string a número
            const amounts = (
              amountsMatch.match(/\[([^\]]+)\]/)?.[1]?.split(",") || []
            )
              .map(Number)
              .filter((n) => !isNaN(n));

            // Limpia las etiquetas (horas) quitando comillas y espacios
            const labels = (labelsMatch[1]?.split(",") || [])
              .map((label) => label.trim().replace(/["']/g, ""))
              .filter(Boolean);

            // Determina la cantidad mínima de datos entre precios, montos y etiquetas
            const minLength = Math.min(
              prices.length,
              amounts.length,
              labels.length
            );
            // Corta las tres series para que tengan el mismo tamaño y evitar errores
            const validPrices = prices.slice(0, minLength);
            const validAmounts = amounts.slice(0, minLength);
            const validLabels = labels.slice(0, minLength);

            // Si hay datos válidos y el componente sigue montado, actualiza el gráfico
            if (minLength > 0 && isMounted.current) {
              updateChart(validPrices, validAmounts, validLabels); // Llama a función que actualiza el gráfico
              setLastUpdateTime(Date.now()); // Actualiza el timestamp de la última actualización
              setLastUpdateLabel(validLabels[validLabels.length - 1]); // Muestra la última hora
            }
          }
        } else if (parsed.id !== 1000) {
          // Si el mensaje no es del ID 1000, lo pasa a la función general para otros IDs
          updateData(parsed.id, parsed);
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error); // Manejo de errores al parsear el mensaje
      }
    };

    // Registra la función como listener de mensajes del WebSocket
    webSocketServices.addListener(handleMessage);

    // Limpieza al desmontar el componente: desconecta el WebSocket
    return () => {
      webSocketServices.disconnect();
    };
  }, []); // Se ejecuta una sola vez al montar el componente

  //Actuaizacion del gráfico con nuevos datos
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

        // Línea de referencia para el primer valor
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
        height: "100%", // <-- Nuevo
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "100%", // <-- Nuevo
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