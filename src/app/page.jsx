"use client";

import Navbar from "@/components/Navbar";
import { SectionCards } from "@/components/section-cards";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import React from "react";
import { Card } from "@/components/ui/card";
import { SectionCardsRight } from "@/components/section-cards-right";
import PromoPage from "./dashboard/PromoPage";
import InfoPage from "./information/InfoPage";
import FooterPage from "@/components/Footer";
import WSLiveView from "@/componentServer/WSLiveView";
import TokenTester from "@/componentServer/TokenTester";
import { useWebSocketData } from "@/componentServer/WebSocketDataContext";



const LandingPage = () => {
  const { dataById } = useWebSocketData();
  const promedio = dataById[1007]?.data || {};

  return (
    <>
      <Navbar />
      <SidebarProvider className="h-full">
        <SidebarInset>
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
              {/* Cards */}
              <div className="flex gap-60 justify-center pb-4 mt-3 overflow-x-auto">
                <Card className="min-w-[270px] flex-shrink-0 h-25 flex justify-center items-center text-green-600 bg-custom-colortwo border-none gap-0">
                  <h3 className="text-2xl text-white ">CIERRE</h3>
                  <h1 className="text-5xl font-bold tracking-tight first:mt-0">
                    {[promedio.close]}
                  </h1>
                </Card>
                <Card className="min-w-[270px] flex-shrink-0 h-25 flex justify-center items-center text-red-600 bg-custom-colortwo border-none gap-0">
                  <h3 className="text-2xl text-white">PROMEDIO</h3>
                  <h1 className="text-5xl font-bold tracking-tight first:mt-0">
                    {[promedio.avg]}
                  </h1>
                </Card>
              </div>
              {/* Gráfica */}
              {/* <ChartAreaInteractive /> */}
              <WSLiveView />
            </div>

            {/* Contenedor Derecho */}
            <div className="flex-1 flex flex-col gap-6 mt-3">
              <div className="w-full">
                <SectionCardsRight />
              </div>
            </div>
          </div>
          <TokenTester />
        </SidebarInset>
      </SidebarProvider>
      <PromoPage />
      <InfoPage />
      <FooterPage />
    </>
  );
};

export default LandingPage;
