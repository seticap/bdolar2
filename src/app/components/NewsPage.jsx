/**
 * components/NewsPage.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * NewsPage — Carrusel de noticias en layout 2x2.
 *
 * Descripción:
 * - Consume noticias desde `useInfoData()` y las agrupa de 4 en 4.
 * - Renderiza la diapositiva activa como una grilla (2 columnas en md+).
 * - Incluye controles de navegación (prev/next) e indicadores de paginación.
 *
 * Importante (comportamiento actual):
 * - La lógica de navegación usa `noticias.length` para el wrap del carrusel,
 *   pero la cantidad de slides corresponde a `gruposNoticias.length` (cada slide = 4 noticias).
 *   Esto puede provocar desbordes si `noticias.length`/4 ≠ `noticias.length`.
 *   (Se documenta tal cual; no se modifica la lógica).
 *
 * Dependencias:
 * - React (useState)
 * - lucide-react: ChevronLeft, ChevronRight (íconos)
 * - TailwindCSS (clases utilitarias)
 * - InfoDataProvider: `useInfoData()` → { noticias }
 *
 * Contrato de datos esperado:
 * - `noticias`: Array<{ title: string; description: string; url?: string; ... }>
 *
 * Accesibilidad:
 * - Los botones de navegación son visuales; considera añadir `aria-label`
 *   y `aria-controls`/`aria-live` si requieres soporte de lectores de pantalla.
 */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfoData } from "../services/InfoDataProvider";
/**
 * Carrusel de noticias 2x2 (4 por slide).
 * @returns {JSX.Element}
 */
const NewsPage = () => {
  /** Índice de la diapositiva actual (0-based). */
  const [currentSlide, setCurrentSlide] = useState(0)
  /** Noticias provistas por el contexto InfoDataProvider. */
  const {noticias} = useInfoData()
// ──────────────────────── Agrupación de noticias (4 por slide) ────────────────────────
  /**
   * Se divide el arreglo `noticias` en subarreglos de tamaño 4.
   * Cada subarreglo representa una "diapositiva" del carrusel.
   */
  const gruposNoticias = [];
  for (let i = 0; i < noticias.length; i += 4) {
    gruposNoticias.push(noticias.slice(i, i + 4));
  }

 // ──────────────────────── Navegación del carrusel ────────────────────────
  /**
   * Avanza a la siguiente diapositiva.
   * Nota: actualmente usa `noticias.length` para el wrap (ver comentario en cabecera).
   */
  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === noticias.length - 1 ? 0 : prev + 1
    );
  };
 /**
   * Retrocede a la diapositiva anterior.
   * Nota: actualmente usa `noticias.length` para el wrap (ver comentario en cabecera).
   */
  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? noticias.length - 1 : prev - 1
    );
  };

  return (
    <div className="relative w-full p-4">
      <div className="relative">
        {/* Grilla 2x2: muestra hasta 4 noticias de la slide activa */}
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
              {/* CTA: actualmente sin navegación. Enlaza a la noticia real si existe `url`. */}
              <button className="text-blue-400 hover:text-blue-300 text-sm">
                Leer más...
              </button>
            </div>
          ))}
        </div>

        {/* Controles de navegación izquierda/derecha */}
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

      {/* Indicadores (píldoras) para seleccionar slide */}
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
