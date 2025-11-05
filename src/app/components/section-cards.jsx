"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const GraficoInteractivo1 = dynamic(() => import("./CakeCount"), {
  ssr: false,
});

const StockdioForexWidget = () => {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    setIsProduction(window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1');
    
    if (isProduction && typeof window !== 'undefined' && typeof window.stockdio_events === "undefined") {
      window.stockdio_events = true;
      const stockdio_eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
      const stockdio_eventer = window[stockdio_eventMethod];
      const stockdio_messageEvent = stockdio_eventMethod == "attachEvent" ? "onmessage" : "message";
      
      stockdio_eventer(stockdio_messageEvent, function (e) {
        if (typeof(e.data) != "undefined" && typeof(e.data.method) != "undefined") {
          try {
            eval(e.data.method);
          } catch (error) {
            console.error('Error ejecutando método Stockdio:', error);
          }
        }
      }, false);
    }
  }, [isProduction]);

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

export function SectionCards() {
  const { dataById, dataByHour } = useWebSocketData();
  const precios = dataById["1006"];
  const montos = dataById["1005"];

  const { yesterday } = useDailySheets();

  const limpiarNumero = (valor) => {
    if (typeof valor === "string") {
      return parseFloat(valor.replace(/,/g, ""));
    }
    return parseFloat(valor);
  };

  const NF2 = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toNum = (v) => {
    if (v === null || v === undefined || v === "-") return NaN;
    const n = Number(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : NaN;
  };

  const fmt2 = (v) => (Number.isFinite(toNum(v)) ? NF2.format(toNum(v)) : "-");

  const getVar = (hoy, ayer) => {
    const a = toNum(hoy),
      b = toNum(ayer);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return "-";
    return (((a - b) / b) * 100).toFixed(2);
  };

  return (
    <div className="container max-w-screen-xl flex flex-wrap mx-auto justify-center gap-3 px-2">
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
                  const row = dataByHour?.[hora] || {};
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

      <Card className="flex-1 min-w-[280px] sm:min-w-[300px] bg-custom-colortwo text-white border-none p-3 sm:p-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-3 sm:mb-2">MONEDAS EN TIEMPO REAL</div>
          <StockdioForexWidget />
        </CardContent>
      </Card>

    </div>
  );
}

export function SectionCardsRight() {
  const { dataById } = useWebSocketData();
  const datos = dataById["1000"];
  const operaciones =
    datos?.labels?.map((hora, index) => ({
      hora,
      precio: datos.prices[index],
      monto: datos.amounts[index],
    })) || [];
  
  const ultimas7 = operaciones.slice(-6);

  return (
    <div className="flex flex-wrap justify-center w-full">
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-[1600px]">
        <div className="flex-1 min-w-[240px] grow mr-2">
          <GraficoInteractivo1 />
        </div>

        <Card className="flex flex-col flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2 mr-2">
          <CardHeader className="p-0 mb-[-30px]">
            <CardTitle className="text-lg font-semibold">
              Últimas Transacciones
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto scrollbar-custom">
              <table className="w-full text-sm">
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
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      <span className="text-white">{notificacion}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                        onClick={() => console.log("Eliminar", index)}
                      >
                        {item.cambio}
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