"use client";

import NavBar from "./components/NavBar";
import React, {useEffect, useState} from "react";
import { Card } from "@/components/ui/card";
import { SectionCards, SectionCardsRight } from "./components/section-cards";
import InfoPage from "./components/InfoPage";
import FooterPage from "./components/Footer";
import { useWebSocketData } from "./services/WebSocketDataProvider";
import DollarChart from "./components/DollarChart";
import { CarrouselEmpresas, CarrouselIndices } from "./components/Carrousel";
import AlertBanner from "./components/AlertBanner";
import {useChannel} from "@/app/services/ChannelService";
import {useMarketFilter} from "@/app/services/MarketFilterService";

const LandingPage = () => {
    const { dataById } = useWebSocketData();
    const promedio = dataById["1007"];
    const [showAlert, setShowAlert] = useState(true);

    const { setChannel } = useChannel();
    const { setMarket } = useMarketFilter();

    useEffect(() => {
        setChannel("delay");
        setMarket(71);
    }, []);

    return (
        <>
            <NavBar />
            <CarrouselEmpresas />
            <div className="bg-backgroundtwo">
                <div className="grid xl:grid-cols-6 w-full mx-auto p-1">
                    <div className="xl:col-span-1">
                        <SectionCards />
                    </div>

                    <div className="xl:col-span-4 xl:col-start-2 lg:col-span-2 mx-2">
                        <div className="flex flex-row justify-center items-center gap-4 px-1">
                            <Card className="min-w-[400px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-green-600 bg-custom-colortwo border-none">
                                <h3 className="text-xl text-white">CIERRE</h3>
                                <h1 className="text-5xl font-bold mt-0 leading-1">
                                    {promedio?.close || "-"}
                                </h1>
                            </Card>

                            {showAlert && <AlertBanner onClose={() => setShowAlert(false)} />}

                            <Card className="min-w-[400px] w-auto flex-shrink-0 h-28 flex flex-col justify-start pt-4 items-center text-red-600 bg-custom-colortwo border-none">
                                <h3 className="text-xl text-white">PROMEDIO</h3>
                                <h1 className="text-5xl font-bold mt-0 leading-1">
                                    {promedio?.avg || "-"}
                                </h1>
                            </Card>
                        </div>
                        <div>
                            <DollarChart/>
                        </div>
                    </div>

                    <div className="col-span-1 xl:col-start-6">
                        <SectionCardsRight />
                    </div>
                </div>
            </div>
            <CarrouselIndices />
            <InfoPage />
            <FooterPage />
        </>
    );
};

export default LandingPage;
