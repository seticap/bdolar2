"use client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraficoInteractivo } from "./GraficoInteractivo";
import { BellIcon, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";


const GraficoInteractivo1 = dynamic(() => import("./GraficoInteractivo"), {
  ssr: false,
});
export function SectionCardsRight() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:px-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* grafico montos */}
      <GraficoInteractivo1 />

      {/* cuadro ultimas transacciones */}
      <Card className="w-[300px] h-60 text-white bg-custom-colortwo border-none p-4">
        <CardHeader className="p-0 mb-[-30]">
          <CardTitle className="text-lg font-semibold">
            Últimas Transacciones
          </CardTitle>
        </CardHeader>

        <CardContent className="p-2">
          <div className="overflow-auto max-h-[calc(100%-40px)] scrollbar-custom">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-600 text-gray-400">
                  <th className="text-left pb-1">HORA</th>
                  <th className="text-right pb-1">PRECIO</th>
                  <th className="text-right pb-1">MONTO USD</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { hora: "10:00:00", precio: 956.5, monto: 47 },
                  { hora: "10:00:00", precio: 956.5, monto: 517 },
                  { hora: "10:00:00", precio: 956.5, monto: 517 },
                  { hora: "10:00:00", precio: 956.5, monto: 217 },
                  { hora: "10:00:00", precio: 956.5, monto: 317 },
                  { hora: "10:00:00", precio: 956.5, monto: 517 },
                  { hora: "10:00:00", precio: 956.5, monto: 317 },
                ].map((transaccion, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-1.5">{transaccion.hora}</td>
                    <td className="text-right">
                      {transaccion.precio.toFixed(2)}
                    </td>
                    <td className="text-right">{transaccion.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* Notificaciones */}
      <Card className="w-[300px] h-58 text-white bg-custom-colortwo border-none p-4">
        <CardHeader className="p-0 flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-yellow-400" />
          <CardTitle className="text-lg font-semibold">
            Últimas Transacciones
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 h-[calc(100%-40px)]">
          <div className="overflow-auto h-full scrollbar-thin scrollbar-thumb-gray-600 scrollbar-custom">
            <div className="space-y-3 pr-2">
              {[
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
                "El dólar llegó a $976,65 el 06/11/2024 a las 12:54 am",
              ].map((notificacion, index) => (
                <div
                  key={index}
                  className="text-sm border-b border-gray-700 pb-2 flex justify-between items-center group"
                >
                  <span>{notificacion}</span>
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
  );
}
