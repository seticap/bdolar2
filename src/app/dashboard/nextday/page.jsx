/**
 * src/app/dashboard/nextday.jsx
 * -- Juan Jose Peña Quiñonez
 * -- CC: 1000273604
 */
"use client";

/**
 * Página principal de "Nexday" (Dashboard).
 *
 * Esta versión mantiene toda la estructura, pero en la columna derecha
 * reemplaza el render directo de <NewsPage /> por la **tarjeta de noticias**
 * usada en InfoPage (header rojo + logo + NewsPage dentro del Card).
 */

import Footer from "../../components/Footer";
import PrincesPanel from "../../components/PrincesPanel";
import { SectionCards, SectionCardsRight } from "../../components/section-cards";
import NewsPage from "../../components/NewsPage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import DollarChart from "../../components/DollarChart";

import {
  WebSocketDataProvider,
  useWebSocketData,
} from "../../services/WebSocketDataProvider";
import { WebSocketDataGraficosProvider } from "../../services/WebSocketDataProviderGraficos";
import { useState } from "react";

/* ────────────────────────────── Subcomponente ────────────────────────────── */
/**
 * HeaderStats
 * Muestra métricas en vivo (CIERRE y PROMEDIO) a partir del canal `1007`.
 * Debe renderizarse dentro de `WebSocketDataProvider` para acceder a `useWebSocketData`.
 */
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

/* ──────────────────────────────── Página ───────────────────────────────── */
/**
 * NexdayPage
 * Envuelve toda la UI con `WebSocketDataProvider` y gestiona el `range`
 * compartido para el panel de gráficos.
 */
export default function NexdayPage() {
  // Rango temporal compartido para los gráficos (1D, 5D, 1M, 6M, 1A)
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
                {/* === Tarjeta de noticias idéntica a InfoPage === */}
                <Card
                  className="bg-custom-colortwo text-white border-none h-auto min-h-[60vh]"
                  style={{ minHeight: "520px" }}
                >
                  <CardHeader className="bg-red-700 flex justify-between items-center mt-[-24px] h-8 sm:h-10">
                    <CardTitle className="text-sm sm:text-xl font-semibold">
                      NOTICIAS ACTUALES
                    </CardTitle>
                    {/* Usa ruta absoluta si está en /public/images */}
                    <img src="/images/larepublica.png" alt="LR" className="h-4 sm:h-6" />
                  </CardHeader>
                  <CardContent className="h-full overflow-y-auto max-h-[calc(100%-40px)] scrollbar-custom">
                    <NewsPage />
                  </CardContent>
                </Card>
                {/* === Fin tarjeta de noticias === */}
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
