/**
 * components/section-cards.jsx
 *
 * Secciones laterales de la UI principal:
 * - StockdioForexWidget: widget (tabla mock en dev / iframe en prod) para Forex.
 * - SectionCards: panel izquierdo con tarjetas (Precios, Montos, Tabla horaria, Forex).
 * - SectionCardsRight: panel derecho con gráfico (dinámico), últimas transacciones y notificaciones.
 *
 * Tecnologías:
 * - Next.js (Client Components) y dynamic import (sin SSR) para gráficos.
 * - Contexto de WebSocket (`useWebSocketData`) para datos en tiempo real.
 * - TailwindCSS para estilos utilitarios.
 * - lucide-react para íconos.
 *
 * Seguridad:
 * - El widget de Stockdio (prod) escucha `postMessage` y ejecuta `eval` (según guía del proveedor).
 *   Esto es riesgoso; ver notas en el README técnico para mitigaciones.
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellIcon, Trash2 } from "lucide-react";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Gráfico dinámico (client-only).
 * - `ssr: false` porque el gráfico (o sus dependencias) requiere `window`/DOM.
 * - Debe existir `./CakeCount` que exporte el componente por defecto.
 */
const GraficoInteractivo1 = dynamic(() => import("./CakeCount"), {
  ssr: false,
});

/**
 * Widget de Forex basado en Stockdio.
 *
 * - Desarrollo: muestra una tabla con datos de ejemplo para acelerar iteración local.
 * - Producción: renderiza un `<iframe>` con la "QuoteBoard" de Stockdio (FOREX en tiempo real).
 *
 * Seguridad:
 * - Se instala un listener global de `message` y se ejecuta `eval(e.data.method)`.
 *   Esto sigue el patrón de Stockdio, pero es riesgoso. Se recomienda:
 *   1) Validar `e.origin` para permitir solo dominios de Stockdio.
 *   2) Cambiar `eval` por una tabla de funciones permitidas (whitelist).
 *   3) Considerar `sandbox` en el iframe (ej.: `allow-scripts allow-same-origin`).
 *   4) Remover el listener en cleanup del efecto.
 */
const StockdioForexWidget = () => {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    // Detecta entorno producción vs local
    setIsProduction(window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    
     // Listener de eventos de Stockdio (solo en producción)
    if (isProduction && typeof window !== 'undefined' && typeof window.stockdio_events === "undefined") {
      window.stockdio_events = true;
      const stockdio_eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      const stockdio_eventer = window[stockdio_eventMethod];
      const stockdio_messageEvent = stockdio_eventMethod == "attachEvent" ? "onmessage" : "message";
      
      stockdio_eventer(stockdio_messageEvent, function (e) {
        if (typeof(e.data) != "undefined" && typeof(e.data.method) != "undefined") {
          try {
            // Riesgoso: idealmente reemplazar por una tabla de métodos permitidos.
            // eslint-disable-next-line no-eval
            eval(e.data.method);
          } catch (error) {
            console.error('Error ejecutando método Stockdio:', error);
          }
        }
      }, false);
    }
  }, [isProduction]);

  // Datos de ejemplo para desarrollo
  const forexData = [
    { symbol: "EUR/USD", price: "1.0832", change: "+0.12%", value: "+0.0013" },
    { symbol: "GBP/USD", price: "1.2645", change: "-0.08%", value: "-0.0010" },
    { symbol: "USD/JPY", price: "149.32", change: "+0.25%", value: "+0.3730" },
    { symbol: "USD/CHF", price: "0.8834", change: "+0.15%", value: "+0.0013" },
    { symbol: "AUD/USD", price: "0.6521", change: "-0.05%", value: "-0.0003" },
    { symbol: "USD/CAD", price: "1.3589", change: "+0.18%", value: "+0.0024" },
  ];

  if (isProduction) {
    return (
      <div className="w-full h-full">
        <iframe 
          id='st_1c6c27217f7c478ca8d904cd86b5b94d'
          frameBorder='0' 
          scrolling='no' 
          width='100%' 
          height='350'
          // 🔒 Opcional: sandbox para aislar el contenido del iframe
          // sandbox="allow-scripts allow-same-origin"
          src='https://api.stockdio.com/visualization/financial/charts/v1/QuoteBoard?app-key=395DFC50D7D9415DA5A662933D57E22F&stockExchange=FOREX&symbols=EUR%2FUSD;GBP%2FUSD;USD%2FJPY;USD%2FCHF;AUD%2FUSD&includeCompany=false&includeChange=false&culture=Spanish-LatinAmerica&palette=Financial-Light&title=Watch%20List&borderColor=444444&backgroundColor=1a1a1a&captionColor=252525&titleColor=ffffff&labelsColor=cccccc&interlacedColor=252525&positiveColor=05ff05&negativeColor=ff0000&headerColor=cccccc&headerBackgroundColor=2d2d2d&onload=st_1c6c27217f7c478ca8d904cd86b5b94d'
          style={{ 
            border: 'none',
            minHeight: '350px',
            borderRadius: '8px'
          }}
          title="Cotizaciones de Forex en Tiempo Real"
        />
      </div>
    );
  }

  // Vista de desarrollo con datos de ejemplo
  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left pb-2 w-2/5 text-gray-300">DIVISA</th>
              <th className="text-right pb-2 w-1/5 text-gray-300">PRECIO</th>
              <th className="text-right pb-2 w-1/5 text-gray-300">CAMBIO</th>
              <th className="text-right pb-2 w-1/5 text-gray-300">VAR%</th>
            </tr>
          </thead>
          <tbody>
            {forexData.map((item, index) => (
              <tr 
                key={index} 
                className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-2 text-white font-medium">{item.symbol}</td>
                <td className="text-right font-mono text-white">{item.price}</td>
                <td className={`text-right font-mono ${
                  item.value.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.value}
                </td>
                <td className={`text-right font-mono ${
                  item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Datos de ejemplo - En producción se mostrarán datos en tiempo real de Stockdio
        </div>
      </div>
    </div>
  );
};

/**
 * Sección izquierda: tarjetas de resumen (Precios, Montos, Resumen, Horario, Forex).
 * Consume datos del contexto WebSocket
 */
export function SectionCards() {
  const { dataById, dataByHour } = useWebSocketData();
  const precios = dataById["1006"];
  const montos = dataById["1005"];

  //Horas visibles en la tabla horaria
  const horasFijas = ["09:00", "10:00", "11:00", "12:00"];

  /**
   * Normaliza un número que puede venir como string con comas
   */
  const limpiarNumero = (valor) => {
    if (typeof valor === "string") {
      return parseFloat(valor.replace(/,/g, ""));
    }
    return parseFloat(valor);
  };

  /**
   * Calcula la variación porcentual (hoy vs ayer).
   * Devuelve "-" si los datos no son válidos.
   */
  const getVar = (hoy, ayer) => {
    const numHoy = limpiarNumero(hoy);
    const numAyer = limpiarNumero(ayer);

    if (isNaN(numHoy) || isNaN(numAyer) || numAyer === 0) return "-";

    const varp = ((numHoy - numAyer) / numAyer) * 100;
    return varp.toFixed(2);
  };

  return (
    <div className="container max-w-screen-xl flex flex-wrap mx-auto justify-center gap-3 px-2">
      {/* === CARD: PRECIOS === */}
      <Card className="w-full flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2">PRECIOS</div>
          <div className="w-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left pb-2 w-auto text-gray-300"></th>
                  <th className="text-right pb-2 w-auto text-gray-300">HOY</th>
                  <th className="text-right pb-2 w-auto text-gray-300">AYER</th>
                  <th className="text-right pb-2 w-auto text-gray-300">VAR%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "CIERRE", hoy: "4,168.03", ayer: "4502.12" },
                  { label: "MÁXIMO", hoy: precios?.high, ayer: "4502.12" },
                  { label: "MÍNIMO", hoy: precios?.low, ayer: "4810.10" },
                  { label: "APERTURA", hoy: precios?.open, ayer: "4450.10" },
                ].map(({ label, hoy, ayer }) => (
                  <tr key={label} className="border-b border-gray-600">
                    <td className="py-2 text-white">{label}</td>
                    <td className="text-right text-white">{hoy}</td>
                    <td className="text-right text-white">{ayer}</td>
                    <td className={`text-right ${
                      getVar(hoy, ayer) < 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {getVar(hoy, ayer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: MONTOS USD === */}
      <Card className="flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2">MONTOS USD:</div>
          <div>
            <table className="w-full text-sm min-w-[225px]">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left w-auto text-gray-300"></th>
                  <th className="text-center w-auto text-gray-300">HOY</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "NEGOCIADO", hoy: montos?.sum || "-" },
                  { label: "ULTIMO", hoy: montos?.close || "-" },
                  { label: "PROMEDIO", hoy: montos?.avg || "-" },
                  { label: "MÁXIMO", hoy: montos?.high || "-" },
                  { label: "MÍNIMO", hoy: montos?.low || "-" },
                  { label: "TRANSACCIONES", hoy: montos?.count || "-" },
                ].map(({ label, hoy }) => (
                  <tr key={label} className="border-b border-gray-600">
                    <td className="py-1 text-white">{label}</td>
                    <td className="text-right text-white">{hoy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: TABLA HORARIA === */}
      <Card className="w-full flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2">
        <CardContent className="p-0">
          <div>
            <table className="w-full text-sm min-w-[230px] border-separate border-spacing-y-2 sm:border-spacing-y-1">
              <thead>
                <tr>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-gray-300">HORA</th>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-gray-300">PROMEDIO</th>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-gray-300">CIERRE</th>
                </tr>
              </thead>
              <tbody>
                {horasFijas.map((hora) => {
                  const dato = dataByHour[hora] || {};
                  return (
                    <tr key={hora}>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2 text-white">{hora}</td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2 text-white">{dato.avg || "-"}</td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2 text-white">{dato.close || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: MONEDAS === */}
      <Card className="flex-1 min-w-[280px] sm:min-w-[300px] bg-custom-colortwo text-white border-none p-3 sm:p-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-3 sm:mb-2">MONEDAS EN TIEMPO REAL</div>
          <StockdioForexWidget />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Sección derecha: gráfico, últimas transacciones y ultimas notificaciones.
 * Obtiene las operaciones del canal "1000".
 */
export function SectionCardsRight() {
  const { dataById } = useWebSocketData();
  const datos = dataById["1000"];
  /** Normaliza la estructura (hora, precio, monto) desde 3 arrays correlacionados*/
  const operaciones =
    datos?.labels?.map((hora, index) => ({
      hora,
      precio: datos.prices[index],
      monto: datos.amounts[index],
    })) || [];
  
  /** Últimas 6 operaciones para la tabla*/
  const ultimas7 = operaciones.slice(-6);

  return (
    <div className="flex flex-wrap justify-center gap-4 px-4 w-full">
      <div className="flex flex-wrap justify-center gap-4 w-full max-w-[1600px]">
        <div className="flex-1 min-w-[240px] grow">
          <GraficoInteractivo1 />
        </div>

        <Card className="flex flex-col flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-4">
          <CardHeader className="p-0 mb-[-30px]">
            <CardTitle className="text-lg font-semibold">
              Últimas Transacciones
            </CardTitle>
          </CardHeader>

          <CardContent className="p-2">
            <div className="overflow-auto scrollbar-custom">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-600 text-gray-400">
                    <th className="text-left pb-1">HORA</th>
                    <th className="text-right pb-1">PRECIO</th>
                    <th className="text-right pb-1">MONTO USD</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimas7.map((operacion, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-1.5 text-white">{operacion.hora || "-"}</td>
                      <td className="text-right text-white">
                        {operacion.precio?.toFixed(2) || "-"}
                      </td>
                      <td className="text-right text-white">{operacion.monto || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col flex-1 min-w-[240px] h-auto bg-custom-colortwo text-white border-none p-4">
          <CardHeader className="p-0 flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-yellow-400" />
            <CardTitle className="text-lg font-semibold">
              Últimas Notificaciones
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0 mt-2 max-h-[130px]">
            <div className="overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-custom">
              <div className="space-y-1 pr-1">
                {Array(10)
                  .fill("El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am")
                  .map((notificacion, index) => (
                    <div
                      key={index}
                      className="text-sm border-b border-gray-700 pb-2 flex justify-between items-center group"
                    >
                      <span className="text-white">{notificacion}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                        onClick={() => console.log("Eliminar", index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}