import "./globals.css";
import { WebSocketDataProvider } from "./services/WebSocketDataProvider";
import { InfoDataProvider } from "./services/InfoDataProvider";

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
        {/* HTML raíz: lang="es" para SEO y accesibilidad; 
           suppressHydrationWarning evita warnings por diferencias SSR/CSR controladas */}
        <html lang="es" suppressHydrationWarning>
          <body className="min-h-screen flex flex-col">
            {/* Contenedor principal; el texto global se muestra en blanco (tema oscuro) */}
            <main className="flex-1 w-full text-white">{children} </main>
          </body>
        </html>
      </WebSocketDataProvider>
    </InfoDataProvider>
  );
}
