"use client";

import NavBar from "./components/NavBar";
import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionCards, SectionCardsRight } from "./components/section-cards";
import PromoPage from "./components/PromoPage";
import InfoPage from "./components/InfoPage";
import FooterPage from "./components/Footer";
import { useWebSocketData } from "./services/WebSocketDataProvider";
import DollarChart from "./components/DollarChart"

const LandingPage = () => {

  const { dataById } = useWebSocketData();
  const promedio = dataById["1007"];

  return (
    <>
      <NavBar />
      <div className="h-full bg-backgroundtwo">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full mx-auto p-1 py-6">
          <div className="md:col-span-1 lg:col-span-1 lg:row-span-5 row-span-1">
            <SectionCards/>
          </div>

          <div className="md:col-span-2 lg:col-span-3 lg:col-start-2 lg:row-start-1 top-8">
            <div className="flex flex-col sm:flex-row justify-center sm:justify-evenly items-center gap-6 sm:gap-16 px-1">
              <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-green-600 bg-custom-colortwo border-none">
                <h3 className="text-xl text-white">CIERRE</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">
                  {promedio?.close || "-"}
                </h1>
              </Card>

              <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-red-600 bg-custom-colortwo border-none">
                <h3 className="text-xl text-white">PROMEDIO</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">
                  {promedio?.avg || "-"}
                </h1>
              </Card>
            </div>

            <div className="lg:row-span-4">
              <DollarChart/>
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-1 lg:col-start-5 lg:row-span-5">
            <SectionCardsRight />
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