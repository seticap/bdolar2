"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocketData } from "@/componentServer/WebSocketDataContext";
import { useEffect, useState } from "react";

export function SectionCards() {
  const { dataById } = useWebSocketData();
  const { historico } = useWebSocketData();
  const preciosHoy = dataById[1006]?.data || {};
  const [preciosAyer, setPreciosAyer] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("ayer-1006");
      if (data) {
        try {
          setPreciosAyer(JSON.parse(data));
        } catch (e) {
          console.warn("Error al parsear ayer-1006:", e);
        }
      }
    }
  }, []);

  //LOG INFORMACION DE PRECIOS
  // console.log(preciosHoy);
  // console.log(preciosAyer);
  
  const montos = dataById[1005]?.data || {};
  const promedio = dataById[1007]?.data || {};

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

  const horasOrdenas = Object.keys(historico || {})
    .filter((h) => {
      const hNum = parseInt(h.split(":")[0]);
      return hNum >= 9 && hNum <= 12;
    })
    .sort();

  return (
    <div className="text-white grid grid-cols-1 gap-4 px-4 lg:px-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="w-[320px] bg-custom-colortwo text-white border-none p-4">
        <CardContent className="p-0 space-y-4">
          {/* Tabla de Precios */}
          <div className="font-medium mb-2 text-[18px]">PRECIOS</div>
          <div className="text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left pb-1"></th>
                  <th className="text-right pb-1">HOY</th>
                  <th className="text-right pb-1">AYER</th>
                  <th className="text-right pb-1">VAR%</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: "CIERRE",
                    hoy: "4,168.03",
                    ayer: "965,50",
                  },
                  {
                    label: "MÁXIMO",
                    hoy: preciosHoy.high,
                    ayer: preciosAyer.high,
                  },
                  {
                    label: "MÍNIMO",
                    hoy: preciosHoy.low,
                    ayer: preciosAyer.low,
                  },
                  {
                    label: "APERTURA",
                    hoy: preciosHoy.open,
                    ayer: preciosAyer.open,
                  },
                ].map(({ label, hoy, ayer }) => (
                  <tr key={label} className="border-b border-gray-600">
                    <td className="py-1.5">{label}</td>
                    <td className="text-right">{hoy}</td>
                    <td className="text-right">{ayer}</td>
                    <td className="text-right"
                      style={{ color: getVar(hoy, ayer) < 0 ? "red" : "green" }}
                    >
                      {getVar(hoy, ayer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Montos USD y Transacciones */}
          <div className=" mb-2 ">
            <div className="text-sm">
              <div className="font-medium mb-1">MONTOS USD:</div>
              <table className="w-full">
                <thead>
                  <tr>
                    <th></th>

                    <th className="text-right px-5">HOY</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "NEGOCIADO", hoy: montos.sum },
                    { label: "ULTIMO", hoy: montos.close },
                    { label: "PROMEDIO", hoy: montos.avg },
                    { label: "MAXIMO", hoy: montos.high },
                    { label: "MINIMO", hoy: montos.low },
                    { label: "TRANSACCIONES", hoy: montos.count },
                  ].map(({ label, hoy }) => (
                    <tr key={label} className="border-b border-gray-600">
                      <td className="py-1">{label}</td>
                      <td className="text-right">{hoy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Tabla Actual */}
          <div className="text-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left pb-1"></th>
                  <th className="text-left pb-1">HORA</th>
                  <th className="text-left pb-1">PROMEDIO</th>
                  <th className="text-left pb-1">CIERRE</th>
                </tr>
              </thead>
              <tbody>
                {horasOrdenas.map((hora) => (
                  <tr key={hora} className="text-center border-b border-gray-700">
                    <td className="py-1.5">{hora}</td>
                    <td className="text-right ">${historico[hora].avg}</td>
                    <td className="text-right ">${historico[hora].close}</td>
                  </tr>
                ))}
                
                
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* MONEDAS */}
      <Card className="w-[320px] h-[200px] text-white bg-custom-colortwo border-none p-4">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="text-lg font-semibold">MONEDAS</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-auto h-[calc(100%-40px)] scrollbar-custom">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-400 text-xs p-1 border-b border-gray-600">
              <span className="w-[55%]">DIVISAS</span>
              <span className="w-[25%] text-right">VALOR</span>
              <span className="w-[20%] text-right">%</span>
            </div>

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
              <div
                key={index}
                className="flex justify-between items-center border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
              >
                <span className="w-[55%]">{item.moneda}</span>
                <span className="w-[25%] text-right font-mono">
                  {item.valor}
                </span>
                <span
                  className={`w-[20%] text-right font-mono ${
                    item.cambio.startsWith("+")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {item.cambio}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
