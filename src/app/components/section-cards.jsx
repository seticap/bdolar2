"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellIcon, Trash2 } from "lucide-react";
import { useWebSocketData } from "../services/WebSocketDataProvider";
import dynamic from "next/dynamic";
import { use } from "react";

const GraficoInteractivo1 = dynamic(() => import("./CakeCount"), {
  ssr: false,
});

export function SectionCards() {
  const { dataById } = useWebSocketData();
  const { dataByHour } = useWebSocketData();
  const precios = dataById["1006"];
  const montos = dataById["1005"];

  const horasFijas = ["09:00", "10:00", "11:00", "12:00"];

  const limpiarNumero = (valor) => {
    if (typeof valor === "string") {
      return parseFloat(valor.replace(/,/g, ""));
    }
    return parseFloat(valor);
  };

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
                  <th className="text-left pb-2 w-auto"></th>
                  <th className="text-right pb-2 w-auto">HOY</th>
                  <th className="text-right pb-2 w-auto">AYER</th>
                  <th className="text-right pb-2 w-auto">VAR%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "CIERRE", hoy: "4,168.03", ayer: "4502.12" },
                  {
                    label: "MÁXIMO",
                    hoy: precios?.high,
                    ayer: "4502.12",
                  },
                  {
                    label: "MÍNIMO",
                    hoy: precios?.low,
                    ayer: "4810.10",
                  },
                  {
                    label: "APERTURA",
                    hoy: precios?.open,
                    ayer: "4450.10",
                  },
                ].map(({ label, hoy, ayer }) => (
                  <tr key={label} className="border-b border-gray-600">
                    <td className="py-2">{label}</td>
                    <td className="text-right">{hoy}</td>
                    <td className="text-right">{ayer}</td>
                    <td
                      className="text-right"
                      style={{
                        color: getVar(hoy, ayer) < 0 ? "#FF5252" : "#4CAF50",
                      }}
                    >
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
          <div className="font-bold text-white mb-2">
            MONTOS USD:
          </div>
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
                    <td className="py-1">{label}</td>
                    <td className="text-right">{hoy}</td>
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
                  const dato = dataByHour[hora] || {};
                  return (
                    <tr key={hora}>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">{hora}</td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">{dato.avg || "-"}</td>
                      <td className="text-center border-gray-600 border-b px-2 py-6 sm:py-2">{dato.close || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* === CARD: MONEDAS === (EN ESPERA DE HACERLO FUNCIONAL) */}
      <Card className="flex-1 min-w-[280px] sm:min-w-[200px] bg-custom-colortwo text-white border-none p-3 sm:p-2">
        <CardContent className="p-0 max-h-[190px] sm:max-h-[220px] lg:max-h-[110px] overflow-y-auto scrollbar-custom">
          <div className="font-bold text-white mb-3 sm:mb-2">MONEDAS</div>
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
                  { moneda: "DÓLAR SPOT", valor: "0,9537", cambio: "-0.1160" },
                  { moneda: "DÓLAR OBS", valor: "0,9537", cambio: "-0.1160" },
                  { moneda: "EURO", valor: "5,7042", cambio: "+0.0009" },
                  { moneda: "PESO COL", valor: "20,2880", cambio: "-0.1160" },
                  { moneda: "REAL BRL", valor: "152,1680", cambio: "+0.0013" },
                  { moneda: "PESO ARG", valor: "0,9537", cambio: "+0.0009" },
                  { moneda: "SOL PERUANO", valor: "5,7042", cambio: "-0.0059" },
                  { moneda: "PESO MXN", valor: "20,2880", cambio: "+0.0013" },
                  { moneda: "DÓLAR AUS", valor: "152,1680", cambio: "-0.0059" },
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
                    <td className="w-[25%] text-right font-mono">
                      {item.valor}
                    </td>
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
                      <td className="py-1.5">{operacion.hora || "-"}</td>
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

        {/* Tarjeta de Notificaciones  (EN ESPERA DE HACERLO FUNCIONAL)*/}
        <Card className="flex flex-col flex-1 min-w-[240px] h-auto bg-custom-colortwo text-white border-none p-4">
          <CardHeader className="p-0 flex items-center gap-2">
            <BellIcon className="h-4 w-4 text-yellow-400" />
            <CardTitle className="text-lg font-semibold">
              Últimas Notificaciones
            </CardTitle>
          </CardHeader>

          {/* Contenido desplazable para notificaciones */}
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
                      <span>{notificacion}</span>
                      {/* Botón de eliminar que solo se muestra al pasar el mouse */}
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
