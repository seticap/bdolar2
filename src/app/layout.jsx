import "@/app/globals.css";
import { WebSocketDataProvider } from "./services/WebSocketDataProvider";
import { InfoDataProvider } from "./services/InfoDataProvider";
import DailySheetsAgent from "./components/DailySheetsAgent";
import { IntradaySheetsProvider } from "./services/IntradaySheetsProvider";
import Script from "next/script";

export const metadata = {
  title: "Dollar Set-FX",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <InfoDataProvider>
      <WebSocketDataProvider>
        <IntradaySheetsProvider>
          <html lang="es" suppressHydrationWarning>
            <body className="min-h-screen flex flex-col">
              <DailySheetsAgent />
              <main className="flex-1 w-full text-white">{children} </main>
              <Script
                src="https://checkout.epayco.co/checkout.js"
                strategy="afterInteractive"
              />
            </body>
          </html>
        </IntradaySheetsProvider>
      </WebSocketDataProvider>
    </InfoDataProvider>
  );
}
