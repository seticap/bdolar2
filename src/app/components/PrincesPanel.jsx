/**
 * app/components/PrincesPanel.jsx
 * Autor: Juan Jose Peña Quiñonez — CC:1000273604
 *
 * Panel de visualización que orquesta cuatro tipos de gráficos:
 *  - Precios (línea)
 *  - Promedio
 *  - Velas (candlestick)
 *  - Bollinger
 *
 * Características:
 *  - Tabs conmutables (estado interno)
 *  - Selector de rango temporal propagado a cada gráfico y al proveedor WebSocket
 *  - Suscripción a 4 canales de datos WebSocket (ids: 1001..1004) según `range`
 *  - Estado de carga por pestaña (spinners) hasta recibir el payload
 *  - Contenedor estilizado y responsivo
 *
 * Dependencias:
 *  - React: useEffect, useState
 *  - useWebSocketDataGrafico: proveedor que expone `request` y `useChartPayload`
 *  - Componentes gráficos: PrecioGrafica, PromedioGrafico, VelasGrafico, BollingerGrafico
 *
 * Convenciones:
 *  - `range`: "1D" | "5D" | "1M" | "6M" | "1A"
 *  - Canales WebSocket:
 *      1001 → precios
 *      1002 → promedios
 *      1003 → velas
 *      1004 → bollinger (con params extra: sma=20, desv=2)
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";
import PrecioGrafica from "./PrecioGrafica";
import PromedioGrafico from "./PromedioGrafico";
import VelasGrafico from "./VelasGrafico";
import BollingerGrafico from "./BollingerGrafico";

/** Definición de pestañas disponibles en el panel. */
const TABS = [
  { key: "precios", label: "Precios" },
  { key: "promedio", label: "Promedio" },
  { key: "velas", label: "Velas" },
  { key: "bollinger", label: "Bollinger" },
];
/** Rangos temporales soportados por el proveedor de datos y los gráficos. */
const RANGES = ["1D", "5D", "1M", "6M", "1A"];

/**
 * @typedef {Object} PrincesPanelProps
 * @property {string}   [className=""] - Clases extra para el contenedor principal.
 * @property {any}      [baseDay=null] - Semilla opcional para componentes internos que lo soporten.
 * @property {number}   [height=360]   - Alto en píxeles para cada gráfico.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'|string} range - Rango temporal activo.
 * @property {(r:string)=>void} onRangeChange - Callback para cambiar el rango global.
 */

/**
 * Panel de gráficos con tabs y selector de rango; orquesta suscripciones WebSocket.
 * - Envía `request()` a 4 canales (1001..1004) al cambiar `range`.
 * - Lee payloads con `useChartPayload(channelId, range)`.
 * - Renderiza cada gráfico o un spinner si falta el payload.
 *
 * @param {PrincesPanelProps} props
 * @returns {JSX.Element}
 */
export default function PrincesPanel({
  className = "",
  baseDay = null,
  height = 360,
  range,
  onRangeChange,
}) {
  /** Pestaña activa de la UI (controlado internamente). */
  const [activeTab, setActiveTab] = useState("precios");
  
  /** Estado de carga por pestaña (true = esperando payload). */
  const [isLoading, setIsLoading] = useState({
    precios: true,
    promedio: true,
    velas: true,
    bollinger: true
  });

  // Proveedor WebSocket para enviar/recibir datos de los gráficos
  const { request, useChartPayload } = useWebSocketDataGrafico();

  /**
   * Suscripción a canales WebSocket al cambiar el rango.
   * - 1001: precios
   * - 1002: promedios
   * - 1003: velas
   * - 1004: bollinger (con SMA=20, desviación=2)
   */
   useEffect(() => {
    const lapse = (range || "1D").toUpperCase();
    console.log(" [PRINCES_PANEL] Enviando suscripciones para rango:", lapse);

    // Suscribirse a todos los gráficos necesarios (si `request` existe)
    request?.({ id: 1001, market: 71, lapse });
    request?.({ id: 1002, market: 71, lapse });
    request?.({ id: 1003, market: 71, lapse });
    request?.({ id: 1004, market: 71, lapse, sma: 20, desv: 2 });

    console.log(" [SUBSCRIPTIONS] Suscripciones enviadas:", {
      1001: "precios",
      1002: "promedios",
      1003: "velas",
      1004: "bollinger",
    });
  }, [range, request]);

  /** Payloads por canal, vinculados al `range` actual. */
  const preciosPayload = useChartPayload(1001, range);
  const promediosPayload = useChartPayload(1002, range);
  const velasPayload = useChartPayload(1003, range);
  const bollingerPayload = useChartPayload(1004, range);

  /**
   * Tracking de carga por pestaña, en función de si existe `payload`.
   * - Cuando el payload llega, desactiva el spinner correspondiente.
   */
  useEffect(() => {
    setIsLoading(prev => ({
      ...prev,
      precios: !preciosPayload,
      promedio: !promediosPayload,
      velas: !velasPayload,
      bollinger: !bollingerPayload
    }));
  }, [preciosPayload, promediosPayload, velasPayload, bollingerPayload]);

/**
   * Cambia el rango y propaga al componente padre.
   * @param {'1D'|'5D'|'1M'|'6M'|'1A'|string} r
   */
  const handleRange = (r) => {
    onRangeChange(r);
  };

  return (
    <section
      className={[
        "rounded-xl bg-[hsl(var(--backgroundtwo))]/40",
        "ring-1 ring-[rgba(148,163,184,.18)] ring-inset",
        "backdrop-blur px-4 py-3",
        className,
      ].join(" ")}
    >
      {/* ───────────────────────── Header: Tabs + Rango ───────────────────────── */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <div className="inline-flex rounded-lg p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1 -ml-2">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={[
                    "px-3 py-1.5 rounded-md text-[12px] transition whitespace-nowrap",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:text-white",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector de Rango temporal */}
        <div className="inline-flex items-center gap-1 rounded-full p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1 overflow-x-auto">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={[
                "px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap",
                range === r
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
              ].join(" ")}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────── Body ─────────────────────────────── */}
      <div
        className="chart-frame rounded-xl p-2 min-h-[320px] bg-[hsl(var(--backgroundtwo))] relative"
        style={{
          zIndex: 1000,
          width: "100%",
        }}
      >
        {/* Pestaña: Precios */}
        {activeTab === "precios" &&
          (preciosPayload ? (
            <PrecioGrafica
              payload={preciosPayload}
              height={height}
              range={range}
              title="Precios"
            />
          ) : (
            <div className="p-6 text-slate-400 text-sm flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-3"></div>
              Cargando datos de precios en vivo…
            </div>
          ))}

        {/* Pestaña: Promedio */}
        {activeTab === "promedio" && (
          promediosPayload ? (
            <PromedioGrafico
              data={promediosPayload}
              fallbackDay={baseDay}
              height={height}
              range={range}
              forceSimulated={!promediosPayload}
            />
          ) : (
            <div className="p-6 text-slate-400 text-sm flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-3"></div>
              Cargando datos de promedio en vivo…
            </div>
          )
        )}

        {/* Pestaña: Velas */}
        {activeTab === "velas" && (
          velasPayload ? (
            <VelasGrafico
              payload={velasPayload}
              height={height}
              range={range}
              title="Gráfico de Velas USD/COP"
              forceSimulated={!velasPayload}
            />
          ) : (
            <div className="p-6 text-slate-400 text-sm flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-3"></div>
              Cargando datos de velas en vivo…
            </div>
          )
        )}

        {/* Pestaña: Bollinger */}
        {activeTab === "bollinger" && (
          bollingerPayload ? (
            <BollingerGrafico
              payload={bollingerPayload}
              baseDay={baseDay}
              height={height}
              range={range}
              maxPoints={1200}
            />
          ) : (
            <div className="p-6 text-slate-400 text-sm flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mr-3"></div>
              Cargando datos de Bollinger en vivo…
            </div>
          )
        )}
      </div>
    </section>
  );
}