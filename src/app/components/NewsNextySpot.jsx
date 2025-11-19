"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useInfoData } from "../services/InfoDataProvider";
import Link from "next/link";

const PAGE_SIZE = 2;

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

    const totalSlides = gruposNoticias.length;

    return (
        <div className="relative w-full h-full flex flex-col px-4 py-0">
            <div className="relative flex-1">

                {/* noticias verticales, ocupan todo el alto */}
                <div className="flex flex-col gap-3 h-full flex-1">
                    {gruposNoticias[currentSlide]?.map((noticia, index) => (
                        <div
                            key={index}
                            className="border-2 border-black rounded-lg p-4 bg-opacity-20
                                       w-full flex flex-col justify-between flex-1"
                        >
                            <h3 className="text-lg font-bold mb-5 text-center">
                                {noticia.title}
                            </h3>

                            <p className="text-gray-300 text-sm mb-2 text-center">
                                {noticia.description}
                            </p>

                            <Link
                                href={noticia.link}
                                target="_blank"
                                className="text-blue-400 hover:text-blue-300 text-sm text-center"
                            >
                                Leer más...
                            </Link>
                        </div>
                    ))}
                </div>

                {/* Flechas */}
                <button
                    onClick={() => setCurrentSlide((p) => (p - 1 + totalSlides) % totalSlides)}
                    className="absolute left-[-2.5rem] top-1/2 -translate-y-1/2 z-10
                               bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                    onClick={() => setCurrentSlide((p) => (p + 1) % totalSlides)}
                    className="absolute right-[-2.5rem] top-1/2 -translate-y-1/2 z-10
                               bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            </div>

            {/* Indicadores */}
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
