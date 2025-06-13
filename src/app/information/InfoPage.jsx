"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewsPage from "@/components/NewsPage";
import { MiniChart } from "./MiniChart";

const InfoPage = () => {
  // Datos de empresas
  const empresas = [
    { nombre: "FABRICATO", valor: "180", variacion: "0,000" },
    { nombre: "ECOPETROL", valor: "2.180,00", variacion: "+2,588" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "ECOPETROL", valor: "2.180,00", variacion: "+2,588" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "ECOPETROL", valor: "2.180,00", variacion: "+2,588" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "ECOPETROL", valor: "2.180,00", variacion: "+2,588" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
    { nombre: "BANCOLOMBIA", valor: "45.460,00", variacion: "-0,004" },
    { nombre: "GRUPO SURA", valor: "37.400,00", variacion: "-0,107" },
    { nombre: "GRUPO ARGOS", valor: "10.800,00", variacion: "0,000" },
  ];

  // Datos de índices
  const indices = [
    { nombre: "IGBC", valor: "13.290,88", variacion: "-0,000" },
    { nombre: "COLCAP", valor: "1.559,16", variacion: "+0,668" },
    { nombre: "COLOA", valor: "9.846,80", variacion: "-0,000" },
    { nombre: "IGBC", valor: "13.290,88", variacion: "-0,000" },
    { nombre: "COLCAP", valor: "1.559,16", variacion: "+0,668" },
    { nombre: "COLOA", valor: "9.846,80", variacion: "-0,000" },
    { nombre: "IGBC", valor: "13.290,88", variacion: "-0,000" },
    { nombre: "COLCAP", valor: "1.559,16", variacion: "+0,668" },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-6 gap-4 px-4 sm:px-6 bg-backgroundtwo py-4 sm:py-[10%]">
      {/* EMPRESAS */}
      <div className="lg:col-span-2 px-0 sm:px-4">
        <Card className="bg-custom-colortwo text-white border-none h-[60vh] sm:h-[80vh] w-full sm:w-[60vh]">
          <CardHeader className="bg-black max-h-10 mt-[-24px]">
            <CardTitle className="flex justify-between text-sm sm:text-xl font-semibold">
              <span className="truncate">EMPRESAS</span>
              <span className="truncate">VALOR</span>
              <span className="truncate">VAR. %</span>
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
                    e.variacion.startsWith("+")
                      ? "text-green-400"
                      : e.variacion.startsWith("-")
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {e.variacion}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ÍNDICES */}
      <div className="lg:col-span-1 px-0 sm:px-4">
        <Card className="bg-custom-colortwo text-white border-none h-[60vh] sm:h-[80vh] w-full sm:w-[45vh]">
          <CardHeader className="bg-black flex justify-between items-center h-8 mt-[-24px]">
            <CardTitle className="text-sm sm:text-xl font-semibold truncate">
              ÍNDICES ACCIONARIOS
            </CardTitle>
            <img src="images/bvclogo.png" alt="BVC" className="h-4 sm:h-6" />
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
                    ind.variacion.startsWith("+")
                      ? "text-green-400"
                      : ind.variacion.startsWith("-")
                      ? "text-red-400"
                      : "text-white"
                  }`}
                >
                  {ind.variacion}
                </span>
              </div>
            ))}
            <div className="mt-4">
              <MiniChart />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NOTICIAS */}
      <div className="lg:col-span-3 pl-0 lg:pl-[23%]">
        <Card className="bg-backgroundtwo text-white border-none h-[60vh] sm:h-[90vh]">
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
