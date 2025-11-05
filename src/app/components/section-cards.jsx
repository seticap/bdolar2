"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import dynamic from "next/dynamic";
import { useDailySheets } from "../services/useDailySheets";
import { useIntradaySheets } from "../services/IntradaySheetsProvider";

const GraficoInteractivo1 = dynamic(() => import("./CakeCount"), {
  ssr: false,
});

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
    <div className="container max-w-screen-xl flex flex-wrap justify-center gap-3 ">
      {/* === CARD: PRECIOS === */}
      <Card className="w-full flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2 ml-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2">PRECIOS</div>
          <div className="w-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left pb-2 w-auto"></th>
                  <th className="text-right pb-2 w-auto">HOY</th>
                  <th className="text-right pb-2 w-auto">AYER</th>
                  <th className="text-right pb-2 w-auto">VAR%</th>
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
                      <td className="py-3">{label}</td>
                      <td className="text-right">{fmt2(hoy)}</td>
                      <td className="text-right">{fmt2(ayer)}</td>
                      <td
                        className="text-right"
                        style={{
                          color: Number(varp) < 0 ? "#FF5252" : "#4CAF50",
                        }}
                      >
                        {varp === "-" ? "-" : varp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: MONTOS USD === */}
      <Card className="flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2 ml-2">
        <CardContent className="p-0">
          <div className="font-bold text-white mb-2">MONTOS USD:</div>
          <div>
            <table className="w-full text-sm min-w-[225px]">
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
                    <td className="py-3">{label}</td>
                    <td className="text-center">{hoy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: TABLA HORARIA === */}
      <Card className="w-full flex-1 min-w-[240px] bg-custom-colortwo text-white border-none p-2 ml-2">
        <CardContent className="p-0">
          <div>
            <table className="w-full text-sm min-w-[230px] border-separate border-spacing-y-2 sm:border-spacing-y-1">
              <thead>
                <tr>
                  <th className="text-center border-gray-600 border-b px-2 py-1">
                    HORA
                  </th>
                  <th className="text-center border-gray-600 border-b px-2 py-1">
                    PROMEDIO
                  </th>
                  <th className="text-center border-gray-600 border-b px-2 py-1">
                    CIERRE
                  </th>
                </tr>
              </thead>
              <tbody>
                {horasFijas.map((hora) => {
                  const row = dataByHour?.[hora] || {};
                  return (
                    <tr key={hora}>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">
                        {hora}
                      </td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">
                        {row.avg || "-"}
                      </td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">
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
                      <td className="py-2">{operacion.hora || "-"}</td>
                      <td className="text-right">
                        {operacion.precio?.toFixed(2) || "-"}
                      </td>
                      <td className="text-right">{operacion.monto || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* === CARD: MONEDAS === (EN ESPERA DE HACERLO FUNCIONAL) */}
        <Card className="flex-1 min-w-[280px] bg-custom-colortwo text-white border-none p-2 mr-2">
          <CardContent className="p-0 overflow-y-auto scrollbar-custom">
            <div className="font-bold text-white mb-0.9">MONEDAS</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[250px]">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left pb-2 w-1/2">DIVISAS</th>
                    <th className="text-right pb-2 w-1/4">VALOR</th>
                    <th className="text-right pb-2 w-1/4">%</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { moneda: "DÓLAR OBS", valor: "0,9537", cambio: "-0.1160" },
                    { moneda: "EURO", valor: "5,7042", cambio: "+0.0009" },
                    { moneda: "PESO COL", valor: "20,2880", cambio: "-0.1160" },
                    { moneda: "DÓLAR CAD", valor: "5,7042", cambio: "-0.0059" },
                    {
                      moneda: "LIBRA ESTERLINA",
                      valor: "20,2880",
                      cambio: "-0.0059",
                    },
                  ].map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="w-[55%] py-2">{item.moneda}</td>
                      <td className="w-[25%] text-right">{item.valor}</td>
                      <td
                        className={`w-[20%] text-right font-mono ${
                          item.cambio.startsWith("+")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {item.cambio}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
