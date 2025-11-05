"use client"; // Ejecion del lado del cliente

/**
 * CakeCount.jsx
 * 
 * Gráfico de pastel interactivo que muestra distribución de volumen transado.
 * Diseñado para visualización rápida de proporciones con total integrado.
 * 
 * Características:
 * - Gráfico de dona con valor total centrado
 * - Diseño responsive con breakpoints personalizados
 * - Indicadores de compra/venta en el footer
 */
import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Label, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Datos simulados para el gráfico circular
const chartData = [
  { browser: "chrome", visitors: 2360, fill: "hsl(var(--chart-1))" },
  { browser: "safari", visitors: 1200, fill: "hsl(var(--chart-2))" },
];

export function GraficoInteractivo() {
  // Cálculo del total de visitantes al renderizar el componente
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  return (
    <>
      {/* Card que contiene todo el gráfico */}
      <Card className="w-full h-full min-h-[200px] p-2 text-white bg-custom-colortwo border-none flex flex-col">
        {/* Encabezado de la tarjeta con el título */}
        <CardHeader className="p-1 text-center">
          <CardTitle className="text-md font-medium">
            VOLUMEN TRANSADO
          </CardTitle>
        </CardHeader>

        {/* Gráfico en el centro de la card */}
        <CardContent className="flex-1 flex items-center justify-center p-0">
          <div className="w-full h-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="visitors"
                  nameKey="browser"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {/* Etiqueta personalizada en el centro del círculo */}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox?.cx && viewBox?.cy) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-white"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="text-2xl @sm:text-xl @lg:text-2xl font-bold fill-current"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy + 20}
                              className="text-xs @sm:text-sm fill-current opacity-80"
                            >
                              TOTAL M.USD
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>

        {/* Footer con indicadores de compra/venta */}
        <CardFooter className="p-1 pt-0 flex justify-between items-start text-[15px] mt-[-10px]">
          {/* Indicador de Compra */}
          <div className="flex flex-col items-start gap-0">
            <div className="flex items-center gap-1 text-white justify-center">
              <TrendingUp className="h-3 w-3" />
              <span>COMPRA</span>
            </div>
            <span className="text-green-400">53,7%</span>
          </div>

          {/* Indicador de Venta */}
          <div className="flex flex-col items-end gap-0">
            <div className="flex items-center gap-1 text-white justify-end">
              <TrendingDown className="h-3 w-3" />
              <span>VENTA</span>
            </div>
            <span className="text-red-400">46,3%</span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

export default GraficoInteractivo;
