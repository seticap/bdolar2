// app/components/PrincesPanel.jsx
"use client";

/**
 * Panel de graficos con pestañas para visualizar diferentes indicadores de mercado
 * (Precios, Promedio, Velas y Bandas de Bollinger) en tiempo real.
 * 
 * Se integra con un proveedor WebSocket (`useWebSocketDataGrafico`) que:
 *  - expone `request` para enviar suscripciones (por id de canal)
 *  - expone `useChartPayload` para leer el último payload de cada gráfico (memoizado por rango)
 *  
 * El componente NO altera la data recibida: únicamente suscribe y muestra.
 * 
 * ──────────────────────────────────────────────────────────────────────────────
 * PROPS
 * @typedef {Object} PrincesPanelProps
 * @property {string}   [className=""]   - Clases CSS externas para el contenedor.
 * @property {any}      [baseDay=null]   - Día base/semilla para gráficos que lo requieran.
 * @property {number}   [height=360]     - Alto en px de los gráficos.
 * @property {'1D'|'5D'|'1M'|'6M'|'1A'}  range          - Rango temporal seleccionado.
 * @property {(r: '1D'|'5D'|'1M'|'6M'|'1A') => void} onRangeChange - Callback al cambiar rango.
 * 
 * USO BÁSICO
 *  <PrincesPanel range="1D" onRangeChange={(r) => setRange(r)} />
 * 
 * NOTAS 
 *  - Mantiene estado interno para pestañas (`activeTab`), sin afectar el `range` externo.
 *  - Las suscripciones se envían en `useEffect` cada vez que cambia `range`.
 *  - No modifica la funcionalidad existente; solo agrega documentación/comentarios.
 */

import { useEffect, useMemo, useState } from "react";
import { useWebSocketDataGrafico } from "../services/WebSocketDataProviderGraficos";
import PrecioGrafica from "./PrecioGrafica";
import PromedioGrafico from "./PromedioGrafico";
import VelasGrafico from "./VelasGrafico";
import BollingerGrafico from "./BollingerGrafico";

  /**
 * Definición de pestañas disponibles en el panel.
 * - key: identificador interno para el tab activo
 * - label: texto mostrado en la UI
 */
const TABS = [
  { key: "precios", label: "Precios" },
  { key: "promedio", label: "Promedio" },
  { key: "velas", label: "Velas" },
  { key: "bollinger", label: "Bollinger" },
];

  /**
 * Rangos temporales soportados por la UI y el backend.
 * Se envían como `lapse` en las suscripciones WebSocket.
 */

const RANGES = ["1D", "5D", "1M", "6M", "1A"];

  /**
 * Componente principal del panel de gráficos con pestañas.
 * @param {PrincesPanelProps} props
 */

export default function PrincesPanel({
  className = "",
  baseDay = null,
  height = 360,
  range,
  onRangeChange,
}) {
  // Pestaña activa de la UI (controlado internamente)
  const [activeTab, setActiveTab] = useState("precios");
  // Proveedor WebSocket para enviar/recibir datos de los gráficos
  const { request, useChartPayload } = useWebSocketDataGrafico();

   /**
   * Efecto: envía suscripciones/renovaciones cada vez que cambia el `range`.
   * Las IDs (1001–1004) representan tipos de gráficos acorde a backend:
   *  - 1001: Precios
   *  - 1002: Promedios
   *  - 1003: Velas
   *  - 1004: Bollinger (requiere params extra: sma, desv)
   */
  useEffect(() => {
    const lapse = (range || "1D").toUpperCase();
    console.log("🔔 [PRINCES_PANEL] Enviando suscripciones para rango:", lapse);

    // Suscribirse a todos los gráficos necesarios (si `request` existe)
    request?.({ id: 1001, market: 71, lapse });
    request?.({ id: 1002, market: 71, lapse });
    request?.({ id: 1003, market: 71, lapse });
    request?.({ id: 1004, market: 71, lapse, sma: 20, desv: 2 });

    console.log("📤 [SUBSCRIPTIONS] Suscripciones enviadas:", {
      1001: "precios",
      1002: "promedios",
      1003: "velas",
      1004: "bollinger",
    });
  }, [range, request]);

   /**
   * Lectura de payloads por tipo de gráfico, vinculados al `range` actual.
   * `useChartPayload(id, range)` debe devolver el último estado recibido para esa llave.
   */
  const preciosPayload = useChartPayload(1001, range);
  const promediosPayload = useChartPayload(1002, range);
  const velasPayload = useChartPayload(1003, range);
  const bollingerPayload = useChartPayload(1004, range);

  /**
   * Handler de cambio de rango expuesto por la UI (burbujea al padre).
   * No muta estado interno salvo que el padre a su vez cambie `range`.
   * @param {'1D'|'5D'|'1M'|'6M'|'1A'} r
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
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1 -ml-2">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={[
                    "px-3 py-1.5 rounded-md text-[12px] transition",
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

          {/* ELIMINADO: Botón Debug Velas (intencionalmente ausente) */}
        </div>

            {/* Selector de Rango temporal */}
        <div className="inline-flex items-center gap-1 rounded-full p-1 bg-white/[0.04] ring-1 ring-white/10 -mt-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleRange(r)}
              className={[
                "px-3 py-1 rounded-full text-[11px] font-medium transition",
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
          minWidth: "800px",
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
            <div className="p-6 text-slate-400 text-sm">
              Cargando precios en vivo…
            </div>
          ))}

        {/* Pestaña: Promedio (permite simular si no hay data) */}
        {activeTab === "promedio" && (
          <PromedioGrafico
            data={promediosPayload}
            fallbackDay={baseDay}
            height={height}
            range={range}
            forceSimulated={!promediosPayload}
          />
        )}
        
        {/* Pestaña: Velas (permite simular si no hay data) */}
        {activeTab === "velas" && (
          <VelasGrafico
            payload={velasPayload}
            height={height}
            range={range}
            title="Gráfico de Velas USD/COP"
            forceSimulated={!velasPayload}
          />
        )}

        {/* Pestaña: Bandas de Bollinger */}
        {activeTab === "bollinger" && (
          <BollingerGrafico
            payload={bollingerPayload}
            baseDay={baseDay}
            height={height}
            range={range}
            maxPoints={1200}
          />
        )}
      </div>
    </section>
  );
}