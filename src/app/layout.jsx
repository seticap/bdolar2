/**
 * src/app/layout.jsx (o app/layout.js en App Router de Next.js 13+)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * RootLayout — Layout raíz de la aplicación.
 *
 * Responsabilidades:
 *  - Define `metadata` (título, favicon/icons) para todas las rutas hijas.
 *  - Importa estilos globales (tailwind/utilidades en `globals.css`).
 *  - Provee el árbol con dos contextos globales:
 *      * InfoDataProvider: carga empresas, índices y noticias vía fetch en cliente.
 *      * WebSocketDataProvider: autentica y consume datos en tiempo real por WebSocket.
 *  - Estructura semántica <html>/<body>/<main>, con idioma `es` y modo flex.
 *
 * ⚠️ Importante (Next.js App Router):
 *  - `layout.jsx` es **Server Component** por defecto (no lleva "use client").
 *  - Por reglas de Next.js, la etiqueta `<html>` y `<body>` deben ser renderizadas
 *    por un **Server Component**. Los **Client Components no pueden** renderizarlas.
 *  - En este archivo, los Providers (que son Client Components) envuelven a `<html>`.
 *    Eso puede romper la restricción. La práctica recomendada es anidar los Providers
 *    **dentro** de `<body>` para evitar errores de compilación/hidratación.
 *    (No modificamos tu lógica aquí; solo lo documentamos).
 */
import "./globals.css";
import { WebSocketDataProvider } from "./services/WebSocketDataProvider";
import { InfoDataProvider } from "./services/InfoDataProvider";
/**
 * `metadata` — metadatos a nivel de aplicación (App Router).
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
 */
export const metadata = {
  /** Título por defecto del sitio (puede ser enriquecido por rutas hijas) */
  title: "Dollar Set-FX",
  /** Favicon(s) del sitio */
   icons: {
    icon: "/favicon.png", // asegúrate de tener el archivo en /public
  },
};
/**
 * RootLayout — layout raíz que envuelve a todas las páginas.
 *
 * Props:
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 *
 * Estructura:
 * InfoDataProvider
 *   └─ WebSocketDataProvider
 *        └─ <html lang="es">  ← ver nota de compatibilidad en el encabezado
 *            └─ <body>
 *                └─ <main> {children} </main>
 */

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
