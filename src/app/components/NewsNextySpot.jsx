//src/app/components/NewsNextySpot.jsx
"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfoData } from "../services/InfoDataProvider";
import Link from "next/link";

const PAGE_SIZE = 2; // Cambiado de 3 a 2

export default function NewsNextySpot() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { noticias = [] } = useInfoData();

  const gruposNoticias = useMemo(() => {
    const out = [];
    for (let i = 0; i < noticias.length; i += PAGE_SIZE) {
      out.push(noticias.slice(i, i + PAGE_SIZE));
    }
    return out;
  }, [noticias]);

  const totalSlides = Math.max(1, gruposNoticias.length);
  const nextSlide = () => setCurrentSlide((p) => (p + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides);

  return (
    <div className="relative w-full h-full flex flex-col border border-gray-700 bg-[#0d0f16] rounded-sm overflow-hidden">
      {/* Header */}
      <div className="bg-red-700 flex justify-between items-center px-3 py-2 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">
          NOTICIAS ACTUALES
        </h2>
        <img src="/images/larepublica.png" alt="LR" className="h-5" />
      </div>

      {/* Área de contenido principal */}
      <div className="flex-1 min-h-0 p-3">
        <div className="relative h-full">
          {/* Cambiado de grid-cols-3 a grid-cols-2 */}
          <div className="grid grid-cols-2 gap-3 h-full">
            {gruposNoticias[currentSlide]?.map((n, index) => (
              <div
                key={index}
                className="
                  border border-gray-700 bg-[#111827]
                  p-3 w-full h-full flex flex-col
                  min-h-0 flex-1
                "
              >
                {/* Título - aumentado de text-sm a text-base */}
                <h3 className="text-base font-semibold mb-2 text-left leading-tight line-clamp-2 text-white">
                  {n.title}
                </h3>

                {/* Descripción - aumentado de text-xs a text-sm */}
                <p className="text-gray-300 text-sm mb-3 line-clamp-4 text-left leading-relaxed flex-1">
                  {n.description}
                </p>

                <div className="text-left">
                  <Link
                    href={n.link}
                    target="_blank"
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Leer más
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Controles */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 p-1.5 rounded-r hover:bg-gray-700"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-300" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 p-1.5 rounded-l hover:bg-gray-700"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Indicadores - contenedor separado */}
      <div className="flex-shrink-0 pb-3">
        <div className="flex justify-center space-x-1.5">
          {gruposNoticias.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 w-5 rounded-full transition-colors ${
                currentSlide === index ? "bg-green-400" : "bg-gray-700"
              }`}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}