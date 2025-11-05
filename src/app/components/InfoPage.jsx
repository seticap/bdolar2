/**
 * components/InfoPage.jsx (o ruta equivalente)
 *
 * InfoPage — Panel informativo de 3 columnas:
 *   1) EMPRESAS: tabla simple con nombre, valor y variación (%)
 *   2) ÍNDICES ACCIONARIOS: tabla simple + MiniChart embebido
 *   3) NOTICIAS ACTUALES: feed de noticias (NewsPage)
 *
 * Características:
 * - Client Component (Next.js App Router) — usa hooks de contexto para datos.
 * - Layout responsive con Tailwind:
 *     - 1 columna en móviles
 *     - 6 columnas en `lg`, con spans: (2 / 1 / 3)
 * - Scroll interno en tarjetas, encabezados pegados visualmente con altura fija.
 * - Color theme oscuro y clases utilitarias personalizadas (bg-custom-colortwo, bg-backgroundtwo).
 *
 * Dependencias:
 * - TailwindCSS (estilos utilitarios)
 * - UI local (`@/components/ui/card`): Card, CardHeader, CardTitle, CardContent
 * - `useInfoData`: proveedor de datos para empresas e índices
 * - `MiniChart`: micro gráfico para índices
 * - `NewsPage`: feed de noticias (contenido principal de la tercera columna)
 *
 * Contrato de datos esperado desde `useInfoData()`:
 *   const { empresas, indices } = useInfoData();
 *   - empresas: Array<{ nombre: string; valor: string|number; variacion: string }>
 *   - indices:  Array<{ nombre: string; valor: string|number; variacion: string }>
 *
 *   Notas sobre `variacion`:
 *   - Se asume string con signo (ej.: "-0.54%" o "0.73%").
 *   - Se pinta en rojo si empieza con "-", en verde en caso contrario.
 *
 * Accesibilidad:
 * - Las listas están renderizadas como `div` flex por diseño; si requieres semántica tabular, considera <table>.
 * - Imágenes con `alt` descriptivo (BVC y LR).
 *
 * Rutas de imágenes:
 * - Aquí se usa `img src="images/..."`
 * - En Next.js, si las imágenes están en `/public/images`, usa rutas absolutas `/images/...`
 *   para evitar problemas de path relativos en nested routes.
 */
"use client"; // Directiva para Next.js (indica que este componente se ejecuta en el cliente).

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewsPage from "./NewsPage";
import { useInfoData } from "../services/InfoDataProvider";
import { MiniChart } from "./MiniChart";
/**
 * InfoPage — Panel informativo (Empresas / Índices / Noticias)
 *
 * Datos:
 * - `empresas` e `indices` provienen del contexto `useInfoData()`.
 * - Cada ítem debe incluir `nombre`, `valor` y `variacion` (string con posible "-").
 *
 * @returns {JSX.Element}
 */

const InfoPage = () => {
  const { empresas, indices } = useInfoData();

  return (
    <div className="w-full grid grid-cols-6 px-3 py-5 bg-backgroundtwo">
      {/* EMPRESAS */}
      {/* <div className="col-span-2 px-0">
        <Card className="bg-custom-colortwo text-white border-none h-[70vh] w-[60vh]">
          <CardHeader className="bg-black max-h-10 mt-[-24px]">
            <CardTitle className="flex justify-between text-xl font-semibold">
              <span>BOLSA DE VALORES DE COLOMBIA</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100%-40px)] scrollbar-custom">
            {empresas.map((e, i) => (
              <div
                key={i}
                className={`flex justify-between py-1 sm:py-2 px-1 sm:px-2 border-b border-black ${
                  i % 2 === 0 ? "bg-black bg-opacity-20" : ""
                }`}
              >
                <span className="w-1/3 truncate text-xs sm:text-base">
                  {e.nombre}
                </span>
                <span className="w-1/3 text-center text-xs sm:text-base">
                  {e.valor}
                </span>
                <span
                  className={`w-1/3 text-right text-xs sm:text-base ${
                    e.variacion.startsWith("-")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {e.variacion}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div> */}

      {/* ÍNDICES */}
      <div className="col-span-2">
        <Card className="bg-custom-colortwo text-white border-none h-[46vh] w-full pt-0">
          <CardHeader className="bg-red-700 flex justify-between items-center h-10">
            <CardTitle className="text-xl font-semibold">
              INDICE GENERAL BVC
            </CardTitle>
          </CardHeader>
          <div>
            <MiniChart />
          </div>
          {/* <CardHeader className="bg-black flex justify-between items-center h-8 mt-[-24px]">
            <CardTitle className="text-xl font-semibold truncate">
              ÍNDICES ACCIONARIOS
            </CardTitle>
            <img
              src="images/bvclogo.png"
              alt="BVC"
              className="h-4 sm:h-6"
            />{" "}
          </CardHeader>
          <CardContent className="overflow-y-auto max-h-[calc(100%-40px)] scrollbar-custom">
            {indices.map((ind, i) => (
              <div
                key={i}
                className={`flex justify-between py-1 sm:py-2 px-1 sm:px-2 ${
                  i % 2 === 0 ? "bg-black bg-opacity-20" : ""
                }`}
              >
                <span className="w-1/3 truncate text-xs sm:text-base">
                  {ind.nombre}
                </span>
                <span className="w-1/3 text-center text-xs sm:text-base">
                  {ind.valor}
                </span>
                <span
                  className={`w-1/3 text-right text-xs sm:text-base ${
                    ind.variacion.startsWith("-")
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {ind.variacion}
                </span>
              </div>
            ))}
            <div className="mt-4">
              <MiniChart />
            </div>
          </CardContent> */}
        </Card>
      </div>

      {/* NOTICIAS */}
      <div className="col-span-4 p-0 pl-2 mr-0 w-full">
        <Card className="bg-custom-colortwo text-white border-none h-auto min-h-[46vh]">
          <CardHeader className="bg-red-700 flex justify-between items-center mt-[-24px] h-8 sm:h-10">
            <CardTitle className="text-sm sm:text-xl font-semibold">
              NOTICIAS ACTUALES
            </CardTitle>
            <img src="images/larepublica.png" alt="LR" className="h-4 sm:h-6" />
          </CardHeader>
          <CardContent className="h-full overflow-y-auto max-h-[calc(100%-40px)] scrollbar-custom">
            <NewsPage />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InfoPage;
