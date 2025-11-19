"use client";

import Footer from "../../components/Footer";
import PrincesPanel from "../../components/PrincesPanel";
import {SectionCards, SectionCardsRight,} from "../../components/section-cards"
import NewsNextySpot from "../../components/NewsNextySpot";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import DollarChart from "../../components/DollarChart";
import AlertBanner from "../../components/AlertBanner";

import { useWebSocketData } from "../../services/WebSocketDataProvider";
import { WebSocketDataGraficosProvider } from "../../services/WebSocketDataProviderGraficos";
import { useChannel } from "@/app/services/ChannelService";
import { useMarketFilter } from "@/app/services/MarketFilterService";

import React, {useEffect, useState} from "react";

export default function nextdayPage() {
    const { dataById } = useWebSocketData();
    const promedio = dataById["1007"];
    const [showAlert, setShowAlert] = useState(true);
    const { setChannel } = useChannel();
    const { setMarket } = useMarketFilter();
    const [range, setRange] = useState("1D");

    useEffect(() => {
        setChannel("dolar");
        setMarket(71);
    }, []);


    return (
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
            <div className="w-full mx-auto px-3 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <section className="lg:col-span-2">
                        <div className="rounded-xl border border-slate-700 bg-[#0d0f16]">
                            <WebSocketDataGraficosProvider range={range}>
                                <PrincesPanel
                                    height={520}
                                    range={range}
                                    onRangeChange={setRange}
                                />
                            </WebSocketDataGraficosProvider>
                        </div>
                    </section>
                    <aside className="lg:col-span-1 h-full">
                        <Card className="bg-custom-colortwo text-white border-none h-full min-h-[46vh] flex flex-col">

                            <CardHeader className="bg-red-700 flex justify-between items-center mt-[-24px] h-8 sm:h-10">
                                <CardTitle className="text-sm sm:text-xl font-semibold">
                                    NOTICIAS ACTUALES
                                </CardTitle>
                                <img src="/images/larepublica.png" alt="LR" className="h-4 sm:h-6" />
                            </CardHeader>

                            <CardContent className="flex-1 overflow-y-auto scrollbar-custom">
                                <NewsNextySpot />
                            </CardContent>

                        </Card>
                    </aside>
                </div>
            </div>
            <Footer/>
        </div>
    )
}
