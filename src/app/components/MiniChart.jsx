/**
 * components/MiniChart.jsx (o ruta equivalente)
 *
 * MiniChart — Gráfico de áreas apiladas y responsivo usando Recharts.
 *
 * Descripción:
 * - Renderiza un pequeño gráfico de áreas apiladas (desktop/mobile/other) por mes.
 * - Usa `stackOffset="expand"` para mostrar contribución relativa (porcentual 0..1) por categoría.
 * - Es responsivo gracias a `ResponsiveContainer` (requiere alto explícito del contenedor padre).
 *
 * Tecnologías:
 * - Recharts: AreaChart, Area, XAxis, CartesianGrid, ResponsiveContainer.
 * - TailwindCSS: utilidades de layout/espaciado (el alto visual se define con clases).
 * - Colores: se leen de variables CSS (`--chart-1`, `--chart-2`, `--chart-3`).
 *
 * Notas importantes:
 * - Recharts calcula el porcentaje por pila cuando `stackOffset="expand"`.
 * - Para que `ResponsiveContainer` funcione, el contenedor que lo envuelve debe tener un `height` calculable.
 * - Este componente no recibe props en esta versión; si deseas parametrizar `data` o `colors`,
 *   expón `chartData` y `chartConfig` como props.
 */
"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis } from "recharts";
/**
 * Datos de ejemplo: tráfico/canales por mes.
 * Estructura: { month: string, desktop: number, mobile: number, other: number }
 * - Puedes conectar datos reales sustituyendo este arreglo por props o por un fetch externo.
 */
const chartData = [
  { month: "January", desktop: 186, mobile: 80, other: 45 },
  
  { month: "February", desktop: 305, mobile: 200, other: 100 },
  { month: "March", desktop: 237, mobile: 120, other: 150 },
  { month: "April", desktop: 73, mobile: 190, other: 50 },
  { month: "May", desktop: 209, mobile: 130, other: 100 },
  { month: "June", desktop: 214, mobile: 140, other: 160 },
];
/**
 * Config visual por serie.
 * - label: nombre legible (tooltip/leyenda)
 * - color: usa variables CSS definidas en tu tema (e.g. :root { --chart-1: 120 60% 50%; })
 */
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-3))",
  },
};
/**
 * MiniChart — Gráfico de áreas apiladas (proporciones) por mes.
 *
 * @returns {JSX.Element}
 */
export function MiniChart() {
  return (
    <>
    {/* Contenedor con alto explícito (crítico para ResponsiveContainer). 
          Asegúrate de que `h-50` y `mt-25` existan en tu setup de Tailwind; de lo contrario, 
          usa clases estándar (ej.: h-40, mt-6) o styles inline. */}
      <div className="h-50 w-full pt-4 mt-25">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ left: 12, right: 12, top: 12 }}
            stackOffset="expand"
            width={500}
            height={300}
          >
            {/* Grid horizontal sutil */}
            <CartesianGrid vertical={false} />
          {/* Eje X: muestra meses abreviados */}
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            {/* Serie: Other */}
            <Area
              dataKey="other"
              type="natural" // Curva natural (D3 curveNatural)
              fill="hsl(var(--chart-3))"
              fillOpacity={0.1}
              stroke="hsl(var(--chart-3))" 
              stackId="a"  // Misma pila para apilar con las otras áreas
              name={chartConfig.other.label} // Usado por tooltip/legend si se agregan
            />
          {/* Serie: Mobile */}
            <Area
              dataKey="mobile"
              type="natural"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-2))"
              stackId="a"
              name={chartConfig.mobile.label}
            />
            {/* Serie: Desktop */}
            <Area
              dataKey="desktop"
              type="natural"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.4}
              stroke="hsl(var(--chart-1))"
              stackId="a"
              name={chartConfig.desktop.label}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
