/**
 * components/Carrousel.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Carrousel — Marquee/ticker horizontal para mostrar empresas e índices.
 *
 * Descripción:
 * - Consume datos desde `useInfoData()` (empresas, índices) y los concatena.
 * - Formatea cada elemento usando un `formatter` externo o el `defaultFormatter`.
 * - Calcula una velocidad automática basada en la cantidad de items (puede
 *   ajustarse vía prop `speed`).
 * - Renderiza un scroll continuo con `react-fast-marquee` (sin SSR).
 *
 * Props:
 * @typedef {Object} CarrouselProps
 * @property {number} [speed]              Velocidad del marquee (px/seg); si no se pasa, se calcula automáticamente según la cantidad de items.
 * @property {(row:any)=>FormattedItem|null} [formatter]  Función opcional para transformar cada fila de entrada a un objeto `FormattedItem`.
 * @property {string} [className=""]       Clases adicionales para el contenedor externo.
 *
 * Tipos:
 * @typedef {Object} FormattedItem
 * @property {string} label    Etiqueta visible (ej. ticker/sigla/nombre).
 * @property {string|number} value  Valor formateado o literal.
 * @property {string} [unit]  Unidad opcional (ej. " COP", " USD").
 * @property {"up"|"down"|undefined} [trend]  Tendencia visual: 'up' → ▲, 'down' → ▼.
 * @property {string} [url]    URL opcional para enlazar el chip.
 *
 * Dependencias:
 * - next/dynamic: para cargar `react-fast-marquee` solo en cliente (ssr:false).
 * - react-fast-marquee: marquee performant para React (pausa con hover, sin gradiente).
 * - useInfoData: proveedor de datos con `empresas` e `indices`.
 *
 * Accesibilidad:
 * - El componente `Chip` agrega `aria-label` a los símbolos de tendencia (▲/▼).
 * - Enlaces (si `url` está presente) usan `rel="noopener noreferrer"` y `target="_blank"`.
 *
 * Notas:
 * - `toArray` permite aceptar arrays u objetos (tomando `Object.values`), protege ante `null/undefined`.
 * - `defaultFormatter` es tolerante a múltiples esquemas de datos (sigla/ticker/symbol/nombre/index y precio/valor/etc.).
 * - Si no hay items, se muestra un `Skeleton` mínimo.
 */
"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useInfoData } from "@/app/services/InfoDataProvider";
/** Carga diferida del marquee para evitar SSR en Next.js. */
const Marquee = dynamic(() => import("react-fast-marquee"), { ssr: false });
/**
 * Carrousel — Ticker continuo con empresas e índices.
 * @param {CarrouselProps} props
 * @returns {JSX.Element}
 */
export default function Carrousel({ speed, formatter, className = "" }) {
/** Datos base: `empresas` e `indices` provienen del InfoDataProvider. */
  const { empresas = [], indices = [] } = useInfoData();
  /** Normaliza a array si viene un objeto plano (Object.values) o null-safe. */
  const toArray = (x) => (Array.isArray(x) ? x : x ? Object.values(x) : []);
  /** `raw`: unión de empresas + índices, filtrando falsy. */
  const raw = useMemo(
    () => [...toArray(empresas), ...toArray(indices)].filter(Boolean),
    [empresas, indices]
  );
  /**
   * `items`: array de objetos normalizados a `FormattedItem`.
   * - Si se provee `formatter`, se usa; si no, `defaultFormatter`.
   * - Se filtran resultados nulos (cuando el formatter no puede crear el item).
   */
  const items = useMemo(() => {
    return raw
      .map((r) => (formatter ? formatter(r) : defaultFormatter(r)))
      .filter(Boolean);
  }, [raw, formatter]);
  /**
   * Velocidad automática:
   * - Si se pasa `speed` → la respeta.
   * - Si no, calcula en base a la cantidad de items: n*6 con límites [20..70].
   */
  const autoSpeed = useMemo(() => {
    if (speed) return speed;
    const n = items.length || 1;
    return Math.max(20, Math.min(70, n * 6));
  }, [items.length, speed]);
/** Sin items → placeholder simple. */
  if (!items.length) return <Skeleton />;

  return (
    <div className={`w-full border-y border-white/10 bg-custom-colortwo ${className}`}>
      <Marquee
        pauseOnHover
        gradient={false}
        speed={autoSpeed}
        loop={0}
        className="py-0.5"
      >
        {items.map((it, i) => (
          <Chip key={`${it?.label ?? "item"}-${i}`} item={it} />
        ))}
      </Marquee>
    </div>
  );
}
/**
 * Chip — Cápsula individual mostrada dentro del marquee.
 * - Si `item.url` existe, se convierte en enlace.
 * @param {{ item: FormattedItem }} props
 */
function Chip({ item }) {
  const { label, value, unit, trend, url } = item || {};
  const up = trend === "up";
  const down = trend === "down";

  const core = (
    <span className="mx-5 inline-flex items-center gap-2 text-sm whitespace-nowrap">
      <span className="font-semibold">{label}</span>
      <span className="tabular-nums">
        {value}
        {unit}
      </span>
      {up && <span aria-label="sube">▲</span>}
      {down && <span aria-label="baja">▼</span>}
    </span>
  );

  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      {core}
    </a>
  ) : (
    core
  );
}

/**
 * defaultFormatter — Intenta mapear distintos esquemas de datos a `FormattedItem`.
 * - Busca un label en: sigla/ticker/symbol/nombre/name/indice/index
 * - Busca un valor en: precio/price/valor/value/ultimo/last/cierre
 * - Determina `trend` a partir de: variacion/change/delta/diff (si es number)
 * - Usa `es-CO` para formateo numérico con 2 decimales.
 * @param {any} row
 * @returns {FormattedItem|null}
 */
function defaultFormatter(row) {
  const label =
    row.sigla ||
    row.ticker ||
    row.symbol ||
    row.nombre ||
    row.name ||
    row.indice ||
    row.index;
  const valueRaw =
    row.precio ??
    row.price ??
    row.valor ??
    row.value ??
    row.ultimo ??
    row.last ??
    row.cierre;

  if (!label || valueRaw === undefined || valueRaw === null) return null;

  const num = Number(valueRaw);
  const value = Number.isNaN(num)
    ? String(valueRaw)
    : num.toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const delta = row.variacion ?? row.change ?? row.delta ?? row.diff;
  const trend =
    typeof delta === "number" ? (delta >= 0 ? "up" : "down") : undefined;

  return {
    label,
    value,
    unit: row.unit || (row.moneda ? ` ${row.moneda}` : ""),
    trend,
    url: row.url,
  };
}
/**
 * Skeleton — Placeholder minimalista cuando no hay items.
 */
function Skeleton() {
  return (
    <div className="h-10 flex items-center px-4 text-sm text-white/60 border-white/10 bg-custom-colortwo">
    </div>
  );
}