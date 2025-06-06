"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NewsPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Todas las noticias disponibles
  const allNoticias = [
    {
      titulo:
        "Respaldan decisión de desenroque de Grupo Argos y recomiendan a accionistas votar",
      contenido:
        "Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo:
        "Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes",
      contenido:
        "La divisa norteamericana presentó esta baja, luego del anuncio que hizo Trump sobre un posible cese de la guerra Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo:
        "Arquitectura y Concreto, Terso, en alianza con Sufi, lanzan créditos de paneles solares",
      contenido:
        "Esta medida busca facilitar el acceso a energías renovables para personas naturales Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo: "Nueva regulación financiera impactará en el mercado de valores",
      contenido:
        "Las autoridades anunciaron cambios en la regulación que podrían afectar los índices accionarios Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo:
        "Respaldan decisión de desenroque de Grupo Argos y recomiendan a accionistas votar",
      contenido: (
        <div>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sed error,
          ipsum voluptate illo asperiores quaerat quasi consequatur ea libero
          laudantium fugiat velit commodi esse pariatur. Modi similique a
          corporis tempora praesentium aut vitae? Soluta ullam omnis laborum?
          Aspernatur, repellat praesentium? Aliquid optio explicabo, possimus in
          quod quis beatae voluptatibus repudiandae! Las ocho razones
          principales por las que el dólar cayó sobre $60 al cierre del viernes.
        </div>
      ),
    },
    {
      titulo:
        "Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes",
      contenido:
        "La divisa norteamericana presentó esta baja, luego del anuncio que hizo Trump sobre un posible cese de la guerra Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo:
        "Arquitectura y Concreto, Terso, en alianza con Sufi, lanzan créditos de paneles solares",
      contenido:
        "Esta medida busca facilitar el acceso a energías renovables para personas naturales Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
    {
      titulo: "Nueva regulación financiera impactará en el mercado de valores",
      contenido:
        "Las autoridades anunciaron cambios en la regulación que podrían afectar los índices accionarios Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes Esta decisión respalda al plan de separación de participaciones causadas entre Grupo Argos, Grupo Sura y Cementos Argos Las ocho razones principales por las que el dólar cayó sobre $60 al cierre del viernes...",
    },
  ];

  // Dividir las noticias en grupos de 4 (para el carrusel)
  const gruposNoticias = [];
  for (let i = 0; i < allNoticias.length; i += 4) {
    gruposNoticias.push(allNoticias.slice(i, i + 4));
  }

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === gruposNoticias.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? gruposNoticias.length - 1 : prev - 1
    );
  };

  return (
    <div className="relative w-full p-4">
      <div className="relative">
        {/* Grid 2x2 para mostrar 4 noticias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
          {gruposNoticias[currentSlide]?.map((noticia, index) => (
            <div
              key={index}
              className=" border-none rounded-lg p-4  bg-opacity-20 h-80 max-w-[300px] w-full"
            >
              <h3 className="text-lg font-bold mb-8">{noticia.titulo}</h3>
              <p className="text-gray-300 text-sm mb-3 line-clamp-5">
                {noticia.contenido}
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
