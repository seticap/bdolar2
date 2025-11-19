import "@/app/globals.css";
// app/layout.jsx (o src/app/layout.jsx)
import Script from "next/script";

// 👉 importa tus providers actuales
import { InfoDataProvider } from "./services/InfoDataProvider";
import { IntradaySheetsProvider } from "./services/IntradaySheetsProvider";
import DailySheetsAgent from "./components/DailySheetsAgent";

// 👉 importa los NUEVOS providers + WS
import { ChannelProvider } from "./services/ChannelService";
import { MarketFilterProvider } from "./services/MarketFilterService";
import { WebSocketDataProvider } from "./services/WebSocketDataProvider";

export const metadata = {
    title: "Dollar Set-FX",
    icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
        <body className="min-h-screen flex flex-col">

        {/* 👉 InfoDataProvider va FUERA del socket */}
        <InfoDataProvider>

            {/* 👉 Channel y Market afectan SOLO al WebSocket */}
            <ChannelProvider defaultChannel="delay">
                <MarketFilterProvider defaultMarket={71}>

                    {/* 👉 WS Provider debe estar SOLO, sin otros Providers dentro */}
                    <WebSocketDataProvider>

                        {/* 👉 Providers que leen el WS, NO LO ENVUELVEN */}
                        <IntradaySheetsProvider>
                            <DailySheetsAgent />

                            <main className="flex-1 w-full text-white">
                                {children}
                            </main>
                            <Script
                                src="https://checkout.epayco.co/checkout.js"
                                strategy="afterInteractive"
                            />

                        </IntradaySheetsProvider>

                    </WebSocketDataProvider>

                </MarketFilterProvider>
            </ChannelProvider>

        </InfoDataProvider>

        </body>
        </html>
    );
}
