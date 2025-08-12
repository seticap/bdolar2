/**
 * CardEstadistica.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Componente visual que representa una tarjeta de estadisticas del mercado cambiario.
 *  Se usa comúnmente en dashboards para mostrar información de una fila de datos en formato limpio y agrupado.
 * 
 * Caracteristicas:
 *  - Diseño responsive y moderno con hover scaling.
 *  - Agrupa los datos en 3 columnas según semantica: valores positivos, negativos y neutros.
 *  - Valores codificados por color: rojo (Valores negativos), verde(positivos).
 * 
 *  Props:
 *  - Fila(object): objeto de datos con estructura esperada de campos como:
 *    - Merc, moneda, plazo, fecha
 *    - Apertura, cierre
 *    - Monto, ultimo, montoMaximo, transacciones, max, montoPromedio, min, precio, montoMinimo
 * 
 *  Estructura:
 *  - Encabezado superior con metadatos
 *  - Valores organizados en grillas dentro de subcomponentes `InfoGroup` y `InfoRow`
 */

"use client";
import React from "react";

/**
 * Componente principal de la tarjeta
 */

const CardEstadistica = ({ fila }) => {
  return (
    <div className="bg-[#1f1f2e] border border-[#2e2e3d] rounded-xl p-4 md:p-6 shadow-md transition-transform duration-300 hover:shadow-xl hover:scale-[1.02] min-h-[340px] w-full">
      {/* ENCABEZADO: datos principales del mercado*/}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 text-sm text-white/90">
        {/** Información del mercado */}
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-white/80">Mercado:</span>{" "}
            {fila.merc}
          </p>
          <p>
            <span className="font-semibold text-white/80">Moneda:</span>{" "}
            {fila.moneda}
          </p>
          <p>
            <span className="font-semibold text-white/80">Plazo:</span>{" "}
            {fila.plazo}
          </p>
          <p>
            <span className="font-semibold text-white/80">Fecha:</span>{" "}
            {fila.fecha}
          </p>
        </div>
        {/**Valores de apertura y cierre */}
        <div className="space-y-1 text-left sm:text-right">
          <p>
            <span className="font-semibold text-white/80">Apertura:</span>{" "}
            <span className="text-red-400">{fila.apertura}</span>
          </p>
          <p>
            <span className="font-semibold text-white/80">Cierre:</span>{" "}
            <span className="text-red-400">{fila.cierre}</span>
          </p>
        </div>
      </div>

      {/* GRILLA DE VALORES AGRUPADOS*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-white/90 w-full">
        {/**Grupo 1: valores positivos */}
        <InfoGroup
          data={[
            { label: "Monto", value: fila.monto, color: "green" },
            { label: "Último", value: fila.ultimo, color: "green" },
            { label: "Monto máximo", value: fila.montoMaximo, color: "green" },
          ]}
        />
        {/**Grupo 2: valores mixtos o neutros */}
        <InfoGroup
          data={[
            { label: "Transacciones", value: fila.transacciones },
            { label: "Max", value: fila.max, color: "green" },
            {
              label: "Monto promedio",
              value: fila.montoPromedio,
              color: "green",
            },
          ]}
        />
        {/**Grupo 3: valores negativos */}
        <InfoGroup
          data={[
            { label: "Min", value: fila.min, color: "red" },
            { label: "Precio", value: fila.precio, color: "red" },
            { label: "Monto mínimo", value: fila.montoMinimo, color: "red" },
          ]}
        />
      </div>
    </div>
  );
};
/**
 * Subcomponente para renderizar una columna de valores
 */
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
/**
 * Subcomponente para una fila de informacion (Etiqueta + valor)
 */
const InfoRow = ({ label, value, color }) => {
  //Determina el color del texto según tipo de dato
  const colorClass =
    color === "green"
      ? "text-[#1EC94C]" // Verde brillante
      : color === "red"
      ? "text-[#E53935]" // Rojo brillante
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
