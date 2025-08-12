/**
 * NotFound.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 * 
 *  Pagina 404 (ruta no encontrada) para la app con Next.js (App Router).
 *  Este componente se renderiza automaticamente cuando una ruta bajo el segmento actual
 *  no coinciden con ninguna pagina existente.
 * 
 *  Caracteristicas:
 *   - Mensaje claro de "Pagina no encontrada" con branding institucional.
 *   - Boton para volver al inicio.
 *   - Diselo centrado, responsive y accesible.
 * 
 *  Tecnologias:
 *   - `Next.js App Router`
 *   - `next/image` para optimizacion de imagenes
 *   - `next/link` para navegacion del lado del cliente
 * 
 *  Ubicacion recomendada:
 *   - A nivel de app (`/app/not-found.jsx`) para un 404 global
 *   - 0 dentro de un segmento (``/app/dashboard/not-found.jsx`) para un 404 contextual
 * 
 *  Accesibilidad:
 *   - Estructura semantica con <main>
 *   - Contraste alto y texto descriptivo
 */
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