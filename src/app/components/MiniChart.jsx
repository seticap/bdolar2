"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useInfoData } from "../services/InfoDataProvider";

export function MiniChart() {
  const { grafica = [] } = useInfoData();

  const data = useMemo(
    () =>
      (grafica ?? []).map((d) => ({
        label: String(d.label),
        value: Number(d.value),
      })),
    [grafica]
  );

  const [minY, maxY] = useMemo(() => {
    if (!data.length) return [0, 0];
    let min = data[0].value,
      max = data[0].value;
    for (const d of data) {
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    }
    const pad = Math.max(1, Math.round((max - min) * 0.05));
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [data]);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            domain={[minY, maxY]}
            allowDecimals={false}
            width={56}
            tick={{ fill: "#6b7280" }}
          />
          <Tooltip
            formatter={(v) =>
              Number(v).toLocaleString("es-CO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
            labelFormatter={(l) => l}
            contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.25}
            name="IGBC"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
