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

// Componente CustomTooltip más compacto
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const currentValue = payload[0].value;
  
  // Calcular variación respecto al primer valor del dataset
  const firstPrice = payload[0].payload.firstPrice || currentValue;
  const variation = firstPrice ? ((currentValue - firstPrice) / firstPrice * 100) : 0;
  const isPositive = variation >= 0;

  return (
    <div
      style={{
        padding: '10px', // REDUCIDO de 14px a 10px
        background: 'rgba(15, 23, 42, 0.98)',
        color: 'white',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '6px', // REDUCIDO de 8px a 6px
        fontSize: '12px', // REDUCIDO de 14px a 12px
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'none',
        zIndex: 1000,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        minWidth: '170px', // REDUCIDO de 210px a 170px
      }}
    >
      <div style={{ marginBottom: '8px' }}> {/* REDUCIDO de 10px a 8px */}
        <div style={{ 
          fontWeight: 600, 
          fontSize: '13px', // REDUCIDO de 15px a 13px
          marginBottom: '2px', // REDUCIDO de 3px a 2px
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ color: 'white' }}>IGBC</span>
          <span style={{ color: 'white', fontSize: '11px' }}>{label}</span> {/* REDUCIDO de 13px a 11px */}
        </div>
      </div>
      
      {/* SECCIÓN DE PRECIO DESTACADA */}
      <div style={{ marginBottom: '8px' }}> {/* REDUCIDO de 10px a 8px */}
        <div style={{ 
          fontSize: '11px', // REDUCIDO de 13px a 11px
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '2px' // REDUCIDO de 3px a 2px
        }}>
          Precio:
        </div>
        <div style={{ 
          fontSize: '14px', // REDUCIDO de 17px a 14px
          fontWeight: 700,
          color: 'white'
        }}>
          {currentValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* VARIACIÓN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}> {/* REDUCIDO gap y fontSize */}
        <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Variación:</span>
        <span style={{ 
          textAlign: 'right', 
          color: isPositive ? '#10b981' : '#ef4444', 
          fontWeight: 600 
        }}>
          {isPositive ? '+' : ''}{variation.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export function MiniChart() {
  const { grafica = [] } = useInfoData();

  const data = useMemo(
    () =>
      (grafica ?? []).map((d, index, array) => ({
        label: String(d.label),
        value: Number(d.value),
        // Agregar firstPrice para calcular variación (primer valor del array)
        firstPrice: array[0]?.value || Number(d.value)
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
          {/* Tooltip personalizado */}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.25}
            name="IGBC"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}