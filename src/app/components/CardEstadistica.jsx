"use client";
import React from "react";

const CardEstadistica = ({ fila }) => {
  return (
    <div className="bg-[#1f1f2e] border border-[#2e2e3d] rounded-xl p-4 md:p-6 shadow-md transition-transform duration-300 hover:shadow-xl hover:scale-[1.02] min-h-[340px] w-full">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 text-sm text-white/90">
        <div className="space-y-1">
          <p><span className="font-semibold text-white/80">Mercado:</span> {fila.merc}</p>
          <p><span className="font-semibold text-white/80">Moneda:</span> {fila.moneda}</p>
          <p><span className="font-semibold text-white/80">Plazo:</span> {fila.plazo}</p>
          <p><span className="font-semibold text-white/80">Fecha:</span> {fila.fecha}</p>
        </div>
        <div className="space-y-1 text-left sm:text-right">
          <p><span className="font-semibold text-white/80">Apertura:</span> <span className="text-red-400">{fila.apertura}</span></p>
          <p><span className="font-semibold text-white/80">Cierre:</span> <span className="text-red-400">{fila.cierre}</span></p>
        </div>
      </div>

      {/* GRILLA DE DATOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-white/90 w-full">
        <InfoGroup
          data={[
            { label: "Monto", value: fila.monto, color: "green" },
            { label: "Último", value: fila.ultimo, color: "green" },
            { label: "Monto máximo", value: fila.montoMaximo },
          ]}
        />
        <InfoGroup
          data={[
            { label: "Transacciones", value: fila.transacciones },
            { label: "Max", value: fila.max, color: "green" },
            { label: "Monto promedio", value: fila.montoPromedio },
          ]}
        />
        <InfoGroup
          data={[
            { label: "Min", value: fila.min, color: "red" },
            { label: "Precio", value: fila.precio },
            { label: "Monto mínimo", value: fila.montoMinimo },
          ]}
        />
      </div>
    </div>
  );
};

const InfoGroup = ({ data }) => (
  <div className="space-y-1 w-full min-w-0">
    {data.map((item, idx) => (
      <InfoRow
        key={idx}
        label={item.label}
        value={item.value}
        color={item.color}
      />
    ))}
  </div>
);



const InfoRow = ({ label, value, color }) => {
  const colorClass =
    color === "green"
      ? "text-green-300"
      : color === "red"
      ? "text-red-300"
      : "";

  return (
    <div className="flex justify-between items-center gap-2 py-1 border-b border-white/10 last:border-none w-full">
      <span className="text-white/60 text-left whitespace-nowrap">{label}</span>
      <span
        className={`text-right font-mono tabular-nums truncate max-w-[150px] ${colorClass}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
};




export default CardEstadistica;
