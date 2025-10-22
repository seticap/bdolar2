/**
 * src/app/dashboard/spot.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
'use client';

/**
 * Página "Spot" del dashboard.
 *
 * Objetivo:
 *  - Mostrar un overview del mercado USD/COP en tiempo real.
 *  - Integrar métricas live (cierre/promedio), gráfico principal y panel de gráficos derivados.
 *  - Incluir tarjetas informativas y feed de noticias.
 *
 * Estructura general:
 *  <WebSocketDataProvider>           ← proveedor global: expone dataById y request WS
 *    └─ Wrapper de la página
 *       ├─ Fila superior (grid):
 *       │   ├─ Izquierda: <SectionCards />               (tarjetas informativas)
 *       │   ├─ Centro:    <HeaderStats /> + <DollarChart /> (métricas live + gráfico principal)
 *       │   └─ Derecha:   <SectionCardsRight />          (tarjetas adicionales)
 *       ├─ Fila inferior (grid):
 *       │   ├─ Panel de gráficos (2/3):
 *       │   │   └─ <WebSocketDataGraficosProvider range={range}>
 *       │   │       └─ <PrincesPanel range onRangeChange /> (línea, velas, promedios, bollinger)
 *       │   └─ Columna de noticias (1/3): <NewsPage />
 *       └─ <Footer />
 *
 * Providers:
 *  - WebSocketDataProvider:
 *      Provee useWebSocketData() para acceder a dataById (mapa por id de canal).
 *      En particular, el id 1007 emite ticks en tiempo real con valores { close, avg }.
 *
 *  - WebSocketDataGraficosProvider (anidado solo para el panel de gráficos):
 *      Deriva datos del id 1007 y realiza cargas HTTP/caché para producir bloques consumibles
 *      por los gráficos (ids lógicos 1001..1004). Recibe `range` (1D/5D/1M/6M/1A)
 *      para gestionar qué conjunto cargar/mostrar.
 *
 * Estado local:
 *  - range: controla el rango temporal del panel de gráficos (1D por defecto).
 *
 * Responsividad (Tailwind):
 *  - Fila superior usa grid con:
 *      - base: 1 columna
 *      - lg:   4 columnas
 *      - xl:   8 columnas
 *    Para posicionar izquierda/centro/derecha con spans y starts distintos por breakpoint.
 *
 * Dependencias visibles:
 *  - Footer, PrincesPanel, SectionCards, SectionCardsRight, NewsPage, Card, DollarChart
 *  - WebSocketDataProvider, useWebSocketData
 *  - WebSocketDataGraficosProvider
 */

import Footer from '../../components/Footer'
import PrincesPanel from "../../components/PrincesPanel";
import { SectionCards, SectionCardsRight } from "../../components/section-cards";
import NewsPage from "../../components/NewsPage";
import { Card } from "../../../components/ui/card";
import DollarChart from "../../components/DollarChart";

import {
  WebSocketDataProvider,
  useWebSocketData,
} from "../../services/WebSocketDataProvider";

import { WebSocketDataGraficosProvider } from "../../services/WebSocketDataProviderGraficos";
import { useState } from "react";

/**
 * HeaderStats
 *  - Lee datos en vivo del canal WS id = 1007 mediante useWebSicketData().
 *  - Muestra  2 Métricas principales:
 *    * CIERRE (close)
 *    * PROMEDIO (avg)
 * 
 * Si no hay datos todavía, muestra "-". 
 */

function HeaderStats() {
  const { dataById } = useWebSocketData();

  /**
   *Estructura esperada para dataById["1007"]:
   * {
   *  close?: number, // último precio/cierre o tick actual
   *  avg?: number,  // promedio del periodo actual (definición depende del backend)
   * } 
   */

  const promedio = dataById["1007"]; // tick en vivo: se espera { close, avg }

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-16 px-1">
      {/* Card: CIERRE */}
      <Card className="min-w-[230px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-green-600 bg-custom-colortwo border-none">
        <h3 className="text-xl text-white">CIERRE</h3>
        <h1 className="text-5xl font-bold mt-0 leading-1">
          {promedio?.close ?? "-"}
        </h1>
      </Card>

      {/* Card: PROMEDIO */}
      <Card className="min-w-[230px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-red-600 bg-custom-colortwo border-none">
        <h3 className="text-xl text-white">PROMEDIO</h3>
        <h1 className="text-5xl font-bold mt-0 leading-1">
          {promedio?.avg ?? "-"}
        </h1>
      </Card>
    </div>
  );
}
/**
 * spotPage
 *  - Página principal del dashboard Spot.
 *  - Maneja el estado `range` (1D|5D|1M|6M|1A) para el panel de gráficos.
 *  - Envuelve el contenido con WebSocketDataProvider (proveedor global de datos).
 *  - Sección superior: tarjetas informativas + métricas en vivo + gráfico central.
 *  - Sección inferior: panel de gráficos (con provider dedicado) + noticias.
 */

export default function spotPage() {
/** Rango temporal para el panel de gráficos. */
  const [range, setRange] = useState("1D");
 return (
    <WebSocketDataProvider>
      <div className="bg-backgroundtwo">
        {/* ───────────── Fila superior: cards izq + chart centro + cards der ───────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-8 lg:grid-cols-4 gap-6 w-full mx-auto p-1 py-6">
          {/* Columna izquierda: tarjetas informativas */}
          <div className="xl:col-span-2 lg:col-span-1">
            <SectionCards />
          </div>

          {/* Columna central: métricas en vivo + gráfico principal */}
          <div className="xl:col-span-4 xl:col-start-3 lg:col-span-2 lg:col-start-2 top-8">
            <HeaderStats />
            <div className="lg:row-span-4">
              {/* Gráfico principal (fuera del provider de gráficos derivados) */}
              <DollarChart />
            </div>
          </div>

          {/* Columna derecha: tarjetas informativas adicionales */}
          <div className="xl:col-span-2 xl:col-start-7 lg:col-span-1 lg:col-start-4">
            <SectionCardsRight />
          </div>
        </div>

        {/* ───────────── Fila inferior: panel de gráficos + noticias ───────────── */}
        <div className="w-full mx-auto px-1 lg:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de gráficos (2/3 del ancho en ≥lg) */}
            <section className="lg:col-span-2">
              <div className="rounded-xl border border-slate-700 bg-[#0d0f16]">
                {/* 
                  Provider DEDICADO a los gráficos:
                    - Consume el tick 1007 y/o carga HTTP para construir bloques para:
                        1001 (línea), 1002(promedios), 1003(velas), 1004(bollinger).
                    - El prop `range` define qué periodo se visualiza/carga.
                */}
                <WebSocketDataGraficosProvider range={range}>
                  <PrincesPanel
                    height={520}
                    range={range}
                    onRangeChange={setRange} // Cambia el rango desde tabs/controles del panel
                  />
                </WebSocketDataGraficosProvider>
              </div>
            </section>

            {/* Columna de noticias (1/3 del ancho en ≥lg) */}
            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-slate-700 bg-[#0d0f16]">
                <NewsPage height={520} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Footer global */}
      <Footer />
    </WebSocketDataProvider>
  );
}