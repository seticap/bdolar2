"use client";

import { useMemo } from "react";
import { useWebSocketData } from "../../services/WebSocketDataProvider";

import Footer from "../../components/Footer";
import PrincesPanel from "../../components/PrincesPanel";
import { SectionCards, SectionCardsRight } from "../../components/section-cards";
import NewsPage from "../../components/NewsPage";
import { Card } from "../../../components/ui/card";
import DollarChart from "../../components/DollarChart";

export default function NexdayPage() {
  // 👇 leer datos del WS
const { dataById } = useWebSocketData();
  const promedio = dataById["1007"];

 return (
    <>
      <div className="bg-backgroundtwo">
        {/* Fila superior: cards izq + chart centro + cards der */}
        <div className="grid grid-cols-1 xl:grid-cols-8 lg:grid-cols-4 gap-6 w-full mx-auto p-1 py-6">
          <div className="xl:col-span-2 lg:col-span-1">
            <SectionCards />
          </div>

          <div className="xl:col-span-4 xl:col-start-3 lg:col-span-2 lg:col-start-2 top-8">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-16 px-1">
              <Card className="min-w-[230px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-green-600 bg-custom-colortwo border-none">
                <h3 className="text-xl text-white">CIERRE</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">
                  {promedio?.close || "-"}
                </h1>
              </Card>

              <Card className="min-w-[230px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-red-600 bg-custom-colortwo border-none">
                <h3 className="text-xl text-white">PROMEDIO</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">
                  {promedio?.avg || "-"}
                </h1>
              </Card>
            </div>

            <div className="lg:row-span-4">
              <DollarChart />
            </div>
          </div>

          <div className="xl:col-span-2 xl:col-start-7 lg:col-span-1 lg:col-start-4">
            <SectionCardsRight />
          </div>
        </div>

        {/* Fila inferior: PrincesPanel (2/3) + NewsPage (1/3) lado a lado */}
        <div className="w-full mx-auto px-1 lg:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2">
              <div className="rounded-xl border border-slate-700 bg-[#0d0f16]">
                <PrincesPanel height={520} />
              </div>
            </section>

            <aside className="lg:col-span-1">
              <div className="rounded-xl border border-slate-700 bg-[#0d0f16]">
                <NewsPage height={520} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
