'use client';

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

function HeaderStats() {
  const { dataById } = useWebSocketData();
  /** @type {{ close?: number; avg?: number } | undefined} */
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

export default function spotPage() {

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
                {/* Provider DEDICADO a los gráficos, derivando 1007 → 1001..1004 */}
                <WebSocketDataGraficosProvider range={range}>
                  <PrincesPanel
                    height={520}
                    range={range}
                    onRangeChange={setRange}
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