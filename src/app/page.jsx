"use client";

import Navbar from "@/components/Navbar";
import { SectionCards } from "@/components/section-cards";

import React from "react";
import { Card } from "@/components/ui/card";
import { SectionCardsRight } from "@/components/section-cards-right";
import PromoPage from "./dashboard/PromoPage";
import InfoPage from "./information/InfoPage";
import FooterPage from "@/components/Footer";
import WSLiveView from "@/componentServer/WSLiveView";
import { useWebSocketData } from "@/componentServer/WebSocketDataContext";

const LandingPage = () => {
  const { dataById } = useWebSocketData();
  const promedio = dataById[1007]?.data || {};

  return (
    <>
      <Navbar />
      <div className="h-full bg-backgroundtwo">
        {/* Contenedor Principal */}
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Contenedor Izquierdo */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="p-4">
              <div className="flex flex-row gap-4 ">
                {/* <TablaResumen /> */}
                <SectionCards />
              </div>
            </div>
          </div>

          {/* Contenedor Central */}
          <div className="flex-1 flex flex-col">
            {/* Cards - Contenedor responsive con márgenes solo en móvil */}
            <div className="px-4 sm:px-0 flex flex-col sm:flex-row sm:gap-60 justify-center pb-4 mt-3 sm:overflow-x-auto overflow-hidden">
              {/* Card CIERRE */}
              <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-25 flex justify-center items-center text-green-600 bg-custom-colortwo border-none gap-0 mb-4 sm:mb-0">
                <h3 className="text-2xl text-white">CIERRE</h3>
                <h1 className="text-5xl font-bold tracking-tight first:mt-0">
                  {[promedio.close]}
                </h1>
              </Card>

              {/* Card PROMEDIO */}
              <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-25 flex justify-center items-center text-red-600 bg-custom-colortwo border-none gap-0">
                <h3 className="text-2xl text-white">PROMEDIO</h3>
                <h1 className="text-5xl font-bold tracking-tight first:mt-0">
                  {[promedio.avg]}
                </h1>
              </Card>
            </div>
            {/* Gráfica */}
            <WSLiveView />
          </div>

          {/* Contenedor Derecho */}
          <div className="flex-1 flex flex-col gap-6 mt-3">
            <div className="w-full">
              <SectionCardsRight />
            </div>
          </div>
        </div>
      </div>
      <PromoPage />
      <InfoPage />
      <FooterPage />
    </>
  );
};

export default LandingPage;
