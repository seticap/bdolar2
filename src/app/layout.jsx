import "./globals.css";
import { WebSocketDataProvider } from "./services/WebSocketDataProvider";

export const metadata = {
  title: "Dollar Set-FX",
   icons: {
    icon: "/favicon.png", // o "/favicon.png"
  },
};


export default function RootLayout({ children }) {
  return (
  <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <WebSocketDataProvider>
          <main className="flex-1 w-full text-white">{children}</main>
        </WebSocketDataProvider>
      </body>
    </html>
  );
}
