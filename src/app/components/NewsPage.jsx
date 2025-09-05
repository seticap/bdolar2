"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfoData } from "../services/InfoDataProvider";

const NewsPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const {noticias} = useInfoData()

  // Dividir las noticias en grupos de 4 (para el carrusel)
  const gruposNoticias = [];
  for (let i = 0; i < noticias.length; i += 4) {
    gruposNoticias.push(noticias.slice(i, i + 4));
  }

  // Navegación del carrusel
  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === noticias.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? noticias.length - 1 : prev - 1
    );
  };

  return (
    <div className="relative w-full p-4">
      <div className="relative">
        {/* Grid 2x2 para mostrar 4 noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
          {gruposNoticias[currentSlide]?.map((noticias, index) => (
            <div
              key={index}
              className=" border-2 border-black rounded-lg p-4 bg-opacity-20 w-full h-full flex flex-col justify-between"
            >
              <h3 className="text-lg font-bold mb-8">{noticias.title}</h3>
              <p className="text-gray-300 text-sm mb-3 line-clamp-5">
                {noticias.description}
              </p>
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Leer más...
              </button>
            </div>
          ))}
        </div>

        {/* Controles de navegación */}
        <button
          onClick={prevSlide}
          className="absolute left-[-2.5rem] top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-[-2.5rem] top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Indicadores de paginación */}
      <div className="flex justify-center mt-4 space-x-2">
        {gruposNoticias.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-6 rounded-full ${
              currentSlide === index ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsPage;
