"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useInfoData } from "@/app/services/InfoDataProvider";

const Marquee = dynamic(() => import("react-fast-marquee"), { ssr: false });

export default function Carrousel({ speed, formatter, className = "" }) {
  const { empresas = [], indices = [] } = useInfoData();
  const toArray = (x) => (Array.isArray(x) ? x : x ? Object.values(x) : []);
  const raw = useMemo(
    () => [...toArray(empresas), ...toArray(indices)].filter(Boolean),
    [empresas, indices]
  );

  const items = useMemo(() => {
    return raw
      .map((r) => (formatter ? formatter(r) : defaultFormatter(r)))
      .filter(Boolean);
  }, [raw, formatter]);

  const autoSpeed = useMemo(() => {
    if (speed) return speed;
    const n = items.length || 1;
    return Math.max(20, Math.min(70, n * 6));
  }, [items.length, speed]);

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

function Skeleton() {
  return (
    <div className="h-10 flex items-center px-4 text-sm text-white/60 border-white/10 bg-custom-colortwo">
    </div>
  );
}