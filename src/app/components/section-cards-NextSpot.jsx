"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import dynamic from "next/dynamic";
import { useDailySheets } from "../services/useDailySheets";
import { useIntradaySheets } from "../services/IntradaySheetsProvider";
import { useEffect, useState } from "react";

const GraficoInteractivo1 = dynamic(() => import("./CakeCount"), {
  ssr: false,
});

const StockdioForexWidget = () => {
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    const isProd =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";
    setIsProduction(isProd);

    if (
      isProd &&
      typeof window !== "undefined" &&
      typeof window.stockdio_events === "undefined"
    ) {
      window.stockdio_events = true;
      const stockdio_eventMethod = window.addEventListener
        ? "addEventListener"
        : "attachEvent";
      const stockdio_eventer = window[stockdio_eventMethod];
      const stockdio_messageEvent =
        stockdio_eventMethod === "attachEvent" ? "onmessage" : "message";

      stockdio_eventer(
        stockdio_messageEvent,
        function (e) {
          if (
            typeof e.data !== "undefined" &&
            typeof e.data.method !== "undefined"
          ) {
            try {
              eval(e.data.method);
            } catch (error) {
              console.error("Error ejecutando método Stockdio:", error);
            }
          }
        },
        false
      );
    }
  }, []);

  const monedasData = [
    { symbol: "DÓLAR OBS", price: "0.9537", change: "-0.1160%" },
    { symbol: "EURO", price: "5.7042", change: "+0.0009%" },
    { symbol: "PESO COL", price: "20.2880", change: "-0.1160%" },
    { symbol: "DÓLAR CAD", price: "5.7042", change: "-0.0059%" },
    { symbol: "LIBRA ESTERLINA", price: "20.2880", change: "-0.0059%" },
  ];

  if (isProduction) {
    return (
      <div className="w-full h-full">
        <iframe
          id="st_1c6c27217f7c478ca8d904cd86b5b94d"
          frameBorder="0"
          scrolling="no"
          width="100%"
          height="320"
          src="https://api.stockdio.com/visualization/financial/charts/v1/QuoteBoard?app-key=395DFC50D7D9415DA5A662933D57E22F&stockExchange=FOREX&symbols=EUR%2FUSD;GBP%2FUSD;USD%2FJPY;USD%2FCHF;AUD%2FUSD&includeCompany=false&includeChange=false&culture=Spanish-LatinAmerica&palette=Financial-Light&title=Watch%20List&borderColor=444444&backgroundColor=1a1a1a&captionColor=252525&titleColor=ffffff&labelsColor=cccccc&interlacedColor=252525&positiveColor=05ff05&negativeColor=ff0000&headerColor=cccccc&headerBackgroundColor=2d2d2d&onload=st_1c6c27217f7c478ca8d904cd86b5b94d"
          style={{
            border: "none",
            minHeight: "320px",
            borderRadius: "8px",
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
              <th className="text-left pb-1 w-2/5 text-gray-300">DIVISA</th>
              <th className="text-right pb-1 w-1/5 text-gray-300">VALOR</th>
              <th className="text-right pb-1 w-1/5 text-gray-300">%</th>
            </tr>
          </thead>
          <tbody>
            {monedasData.map((item, index) => (
              <tr
                key={index}
                className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
              >
                <td className="py-1.5 text-white font-medium">{item.symbol}</td>
                <td className="text-right font-mono text-white">
                  {item.price}
                </td>
                <td
                  className={`text-right font-mono ${
                    item.change.startsWith("+")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {item.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-400 mt-1 text-center">
          Datos de ejemplo - En producción se mostrarán datos en tiempo real de Stockdio
        </div>
      </div>
    </div>
  );
};

const horasFijas = ["09:00", "10:00", "11:00", "12:00"];

export function SectionCards() {
  const { dataById } = useWebSocketData();
  const { dataByHour, guardarSlot } = useIntradaySheets() ?? { dataByHour: {} };
  const safeDataByHour = dataByHour ?? {};
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
    <div className="container max-w-screen-xl flex flex-wrap justify-center gap-3">
      <Card className="flex-1 min-w-[390px] max-w-[350px] bg-custom-colortwo text-white border-none p-3">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2 text-sm">PRECIOS</div>
          <div className="w-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left pb-1 w-auto"></th>
                  <th className="text-right pb-1 w-auto">HOY</th>
                  <th className="text-right pb-1 w-auto">AYER</th>
                  <th className="text-right pb-1 w-auto">VAR%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "CIERRE",
                    hoy: precios?.trm,
                    ayer: yesterday?.cierre || "-",
                  },
                  {
                    label: "MÁXIMO",
                    hoy: precios?.high,
                    ayer: yesterday?.maximo || "-",
                  },
                  {
                    label: "MÍNIMO",
                    hoy: precios?.low,
                    ayer: yesterday?.minimo || "-",
                  },
                  {
                    label: "APERTURA",
                    hoy: precios?.open,
                    ayer: yesterday?.apertura || "-",
                  },
                ].map(({ label, hoy, ayer }) => {
                  const varp = getVar(hoy, ayer);
                  return (
                    <tr key={label} className="border-b border-gray-600">
                      <td className="py-2 text-sm">{label}</td>
                      <td className="text-right text-sm">{fmt2(hoy)}</td>
                      <td className="text-right text-sm">{fmt2(ayer)}</td>
                      <td
                        className="text-right text-sm font-medium"
                        style={{
                          color: Number(varp) < 0 ? "#FF5252" : "#4CAF50",
                        }}
                      >
                        {varp === "-" ? "-" : `${varp}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 min-w-[390px] max-w-[350px] bg-custom-colortwo text-white border-none p-3">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2 text-sm">MONTOS USD:</div>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left w-auto"></th>
                  <th className="text-center w-auto">HOY</th>
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
                    <td className="py-2 text-sm">{label}</td>
                    <td className="text-center text-sm">{hoy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 min-w-[390px] max-w-[350px] bg-custom-colortwo text-white border-none p-3">
        <CardContent className="p-0">
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-sm">
                    HORA
                  </th>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-sm">
                    PROMEDIO
                  </th>
                  <th className="text-center border-gray-600 border-b px-2 py-1 text-sm">
                    CIERRE
                  </th>
                </tr>
              </thead>
              <tbody>
                {horasFijas.map((hora) => {
                  const row = dataByHour?.[hora] || {};
                  return (
                    <tr key={hora}>
                      <td className="text-center border-gray-600 border-b px-2 py-2 text-sm">
                        {hora}
                      </td>
                      <td className="text-center border-gray-600 border-b px-2 py-2 text-sm">
                        {row.avg || "-"}
                      </td>
                      <td className="text-center border-gray-600 border-b px-2 py-2 text-sm">
                        {row.close || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        <div className="flex-1 min-w-[390px] max-w-[380px]">
          <GraficoInteractivo1 />
        </div>

        <Card className="flex flex-col flex-1 min-w-[390px] max-w-[350px] bg-custom-colortwo text-white border-none p-3">
          <CardHeader className="p-0 mb-1">
            <CardTitle className="text-base font-semibold">
              Últimas Transacciones
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-auto scrollbar-custom">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600 text-gray-400">
                    <th className="text-left pb-1 text-sm">HORA</th>
                    <th className="text-right pb-1 text-sm">PRECIO</th>
                    <th className="text-right pb-1 text-sm">MONTO USD</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimas7.map((operacion, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-1.5 text-sm">{operacion.hora || "-"}</td>
                      <td className="text-right text-sm">
                        {operacion.precio?.toFixed(2) || "-"}
                      </td>
                      <td className="text-right text-sm">{operacion.monto || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-[390px] max-w-[350px] bg-custom-colortwo text-white border-none p-3">
          <CardContent className="p-0">
            <div className="font-bold text-white mb-2 text-sm">MONEDAS EN TIEMPO REAL</div>
            <StockdioForexWidget />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}