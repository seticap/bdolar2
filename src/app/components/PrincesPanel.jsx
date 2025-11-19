"use client";

import { useEffect, useState } from "react";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";
import PrecioGrafica from "./PrecioGrafica";
import PromedioGrafico from "./PromedioGrafico";
import VelasGrafico from "./VelasGrafico";
import BollingerGrafico from "./BollingerGrafico";

const TABS = [
  { key: "precios", label: "Precios" },
  { key: "promedio", label: "Promedio" },
  { key: "velas", label: "Velas" },
  { key: "bollinger", label: "Bollinger" },
];
const RANGES = ["1D", "5D", "1M", "6M", "1A"];

export default function PrincesPanel({
  className = "",
  baseDay = null,
  height = 360,
  range,
  onRangeChange,
}) {
  const [activeTab, setActiveTab] = useState("precios");
  const [isLoading, setIsLoading] = useState({
    precios: true,
    promedio: true,
    velas: true,
    bollinger: true,
  });

  const { request, useChartPayload } = useWebSocketDataGrafico();

  useEffect(() => {
    const lapse = (range || "1D").toUpperCase();

    request?.({ id: 1001, market: 71, lapse });
    request?.({ id: 1002, market: 71, lapse });
    request?.({ id: 1003, market: 71, lapse });
    request?.({ id: 1004, market: 71, lapse, sma: 20, desv: 2 });
  }, [range, request]);

  const preciosPayload = useChartPayload(1001, range);
  const promediosPayload = useChartPayload(1002, range);
  const velasPayload = useChartPayload(1003, range);
  const bollingerPayload = useChartPayload(1004, range);

  useEffect(() => {
    setIsLoading((prev) => ({
      ...prev,
      precios: !preciosPayload,
      promedio: !promediosPayload,
      velas: !velasPayload,
      bollinger: !bollingerPayload,
    }));
  }, [preciosPayload, promediosPayload, velasPayload, bollingerPayload]);

  const handleRange = (r) => {
    onRangeChange(r);
  };

  return (
    <section className={`rounded-xl bg-[hsl(var(--backgroundtwo))]/40 ring-1 ring-[rgba(148,163,184,.18)] ring-inset backdrop-blur px-4 py-3 ${className}`}>
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <div className="inline-flex rounded-lg p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1 -ml-2">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] transition whitespace-nowrap ${active ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap ${
                range === r
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-frame rounded-xl p-2 min-h-[320px] bg-[hsl(var(--backgroundtwo))] relative" style={{ zIndex: 1000, width: "100%" }}>
        {activeTab === "precios" &&
          (preciosPayload ? (
            <PrecioGrafica payload={preciosPayload} height={height} range={range} title="Precios" />
          ) : (
            <LoadingPlaceholder message="Cargando datos de precios en vivo…" />
          ))}

        {activeTab === "promedio" &&
          (promediosPayload ? (
            <PromedioGrafico data={promediosPayload} fallbackDay={baseDay} height={height} range={range} forceSimulated={!promediosPayload} />
          ) : (
            <LoadingPlaceholder message="Cargando datos de promedio en vivo…" />
          ))}

        {activeTab === "velas" &&
          (velasPayload ? (
            <VelasGrafico payload={velasPayload} height={height} range={range} title="Gráfico de Velas USD/COP" forceSimulated={!velasPayload} />
          ) : (
            <LoadingPlaceholder message="Cargando datos de velas en vivo…" />
          ))}

        {activeTab === "bollinger" &&
          (bollingerPayload ? (
            <BollingerGrafico payload={bollingerPayload} baseDay={baseDay} height={height} range={range} maxPoints={1200} />
          ) : (
            <LoadingPlaceholder message="Cargando datos de Bollinger en vivo…" />
          ))}
      </div>
    </section>
  );
}

const LoadingPlaceholder = ({ message }) => (
  <div className="p-6 text-slate-400 text-sm flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-3"></div>
    {message}
  </div>
);
