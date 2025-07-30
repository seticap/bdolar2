'use client'

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound(){
    return(
        <main className="min-h-screen bg-[#0e0e15] text-white flex flex-col items-center justify-center px-4">
            {/* Logo institucional*/}
            <Image
            src="/logoSet.png"
            alt="SET ICAP"
            width={300}
            height={300}
            className='mb-6'
            /> 
            {/*Mensaje principal*/}
            <h1 className="text-4xl font-bold mb-4 text-center">404 | Página no encontrada</h1>
            <p className="text-lg text-gray-400 mb-8 text-center max-w-md">
                La página que estas buscando no existe o ha sido movida.
            </p>

            {/*Boton de regreso*/}
            <Link href="/" className="bg-red-600 hover:bg-green-600 text-white px-6 py-3 rounded font-semibold transition-colors duration-300">
                Volver al inicio
            </Link>
        </main>
    )
}