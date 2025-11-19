"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfoData } from "../services/InfoDataProvider";
import Link from "next/link";

const PAGE_SIZE = 3;

export default function NewsPage() {
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
        <div className="relative w-full px-4 py-0">
            <div className="relative">
                <div className="grid grid-cols-3 gap-3 min-h-[300px]">
                    {gruposNoticias[currentSlide]?.map((noticias, index) => (
                        <div
                            key={index}
                            className=" border-2 border-black rounded-lg p-4 bg-opacity-20 w-full h-full flex flex-col justify-between"
                        >
                            <h3 className="text-lg font-bold mb-5 text-center">{noticias.title}</h3>
                            <p className="text-gray-300 text-sm mb-2 line-clamp-5 text-center">
                                {noticias.description}
                            </p>
                            <button className="text-blue-400 hover:text-blue-300 text-sm">
                                <Link href={noticias.link} target="_blank">Leer más...</Link>
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
            <div className="flex justify-center pt-5 space-x-2">
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
}