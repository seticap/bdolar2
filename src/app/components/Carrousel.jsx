"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useInfoData } from "@/app/services/InfoDataProvider";

const Marquee = dynamic(() => import("react-fast-marquee"), { ssr: false });

function formatEsNumber(
  n,
  opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 }
) {
  if (n === null || n === undefined || Number.isNaN(Number(n)))
    return String(n ?? "");
  return Number(n).toLocaleString("es-CO", opts);
}

function parseEsNumber(str) {
  if (typeof str !== "string") return Number(str);
  // Remove percentage signs and other non-numeric characters except dots and commas
  const cleaned = str.replace(/[^\d,-.]/g, '').replace(',', '.');
  return Number(cleaned);
}

function normalizeRow(row) {
  const label =
    row.sigla ||
    row.ticker ||
    row.symbol ||
    row.nombre ||
    row.name ||
    row.indice ||
    row.index ||
    row.label;

  const priceRaw =
    row.precio ??
    row.price ??
    row.valor ??
    row.value ??
    row.ultimo ??
    row.last ??
    row.cierre;

  const changeRaw =
    row.variacion ?? row.change ?? row.delta ?? row.diff ?? row.variation;

  let trend = row.trend || row.tendencia;
  if (!trend && (changeRaw || changeRaw === 0)) {
    const changeNum =
      typeof changeRaw === "number" ? changeRaw : parseEsNumber(changeRaw);
    if (Number.isFinite(changeNum)) {
      if (changeNum > 0) trend = "up";
      else if (changeNum < 0) trend = "down";
      else trend = "flat";
    }
  }

  const unit = row.unit || (row.moneda ? ` ${row.moneda}` : "");
  const url = row.url;

  if (!label || priceRaw === undefined || priceRaw === null) return null;

  const priceNum =
    typeof priceRaw === "number" ? priceRaw : parseEsNumber(priceRaw);
  const price = Number.isFinite(priceNum)
    ? formatEsNumber(priceNum)
    : String(priceRaw);

  let changeDisplay = "";
  if (typeof changeRaw === "string" && changeRaw.includes("%")) {
    changeDisplay = changeRaw.trim();
  } else {
    const cNum =
      typeof changeRaw === "number" ? changeRaw : parseEsNumber(changeRaw);
    changeDisplay = Number.isFinite(cNum)
      ? formatEsNumber(cNum)
      : String(changeRaw ?? "");
  }

  return { label, price, change: changeDisplay, trend, unit, url };
}

function defaultFormatter(row) {
  return normalizeRow(row);
}

function TickerChip({ item }) {
  const { label, price, change, trend, unit, url } = item || {};
  const up = trend === "up";
  const down = trend === "down";

  const changeColor = up
    ? "text-emerald-400"
    : down
    ? "text-red-400"
    : "text-gray-300";

  const core = (
    <span className="mx-5 inline-flex items-center gap-3 text-sm whitespace-nowrap">
      {/*Etiqueta*/}
      <span className="font-semibold">{label}</span>
      {/*Precio*/}
      <span>
        {price}
        {unit}
      </span>
      {/*Variación*/}
      <span className={`tabular-nums ${changeColor} flex items-center gap-1`}>
        {up && <span aria-hidden="true">▲</span>}
        {down && <span aria-hidden="true">▼</span>}
        <span>{change}</span>
      </span>
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

function Skeleton() {
  return (
    <div className="h-10 flex items-center px-4 text-sm text-white/60 border-white/10 bg-custom-colortwo">
      Cargando…
    </div>
  );
}

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
          <TickerChip key={`${it?.label ?? "item"}-${i}`} item={it} />
        ))}
      </Marquee>
    </div>
  );
}

export function CarrouselEmpresas(props) {
  const { empresas = [] } = useInfoData();
  return <Carrousel data={empresas} {...props}/>;
}

export function CarrouselIndices(props) {
  const { indices = [] } = useInfoData();
  return <Carrousel data={indices} {...props}/>;
}