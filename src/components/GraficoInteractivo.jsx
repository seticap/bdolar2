"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const chartData = [
  { browser: "chrome", visitors: 2360, fill: "hsl(var(--chart-1))" },
  { browser: "safari", visitors: 1200, fill: "hsl(var(--chart-2))" },
];

export function GraficoInteractivo() {
  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors, 0);
  }, []);

  return (
    <Card className="w-[300px] h-[320px] p-3 text-white bg-custom-colortwo border-none flex flex-col">
      {/* Encabezado más compacto */}
      <CardHeader className="p-2 text-center">
        <CardTitle className="text-md font-medium">VOLUMEN TRANSADO</CardTitle>
      </CardHeader>

      {/* Gráfico con dimensiones exactas */}
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="w-[180px] h-[180px]">
          <PieChart width={180} height={150}>
            <Pie
              data={chartData}
              dataKey="visitors"
              nameKey="browser"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              strokeWidth={0}
            >
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
                          className="text-2xl font-bold fill-current"
                        >
                          {totalVisitors.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy + 20}
                          className="text-xs fill-current opacity-80"
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
        </div>
      </CardContent>

      {/* Pie de tarjeta más compacto */}
      <CardFooter className="p-1 pt-0 flex justify-between items-start text-[15px] mt-[-10px]">
        <div className="flex flex-col items-start gap-0">
          <div className="flex items-center gap-1 text-white justify-center">
            <TrendingUp className="h-3 w-3" />
            <span>COMPRA</span>
          </div>
          <span className="text-green-400">53,7%</span>
        </div>
        <div className="flex flex-col items-end gap-0">
          <div className="flex items-center gap-1 text-white justify-end">
            <TrendingDown className="h-3 w-3" />
            <span>VENTA</span>
          </div>
          <span className="text-red-400">46,3%</span>
        </div>
      </CardFooter>
    </Card>
  );
}

export default GraficoInteractivo;
