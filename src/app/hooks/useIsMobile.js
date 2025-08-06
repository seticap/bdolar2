/**
 * useIsMobile.js
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Hook personalizado para detectar si el viewport actual corresponde a un dispositivo móvil.
 *  Devuelve un valor booleano `true` si el ancho de la pantalla es menor que el breakpoint especificado (por defecto `768px`).
 * 
 *  Usos típicos:
 *   - Mostrar/ocultar componentes en móvil
 *   - Cambiar Layouts o estilos según ek tamaño de pantalla
 *   - Reemplazo simple de media queries CSS en Lógica de React
 * 
 *  Lógica:
 *   - Utiliza el objeto `window.innerWidth` para determinar el tamño actual.
 *   - Escucha eventos  `resize` para actualizar automáticamente cuando el usuario cambia el tamaño de la ventana.
 * 
 *  API:
 *   - @param {number} breakpoint - El ancho máximo (en pixeles) para considerar como "movil" (por defecto 768)
 *   - @returns {boolean} isMobile - `true` si el ancho actual es menor al breakpoint
 */
"use client";

import { useEffect, useState } from "react";

/**
 * Hook que determina si el ancho de la pantalla es menor a un breakpoint dado.
 * @param {number} breakpoint - Ancho máximo en píxeles para considerar movil (default: 768)
 * @returns {boolean} - `true` si la ventana es menor al breakpoint
 */

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check(); //Verificar en el montaje inicial 

    //Añade listener para cambios de tamaño de ventana
    window.addEventListener("resize", check);
    // Limpia Listener en desmontaje
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}
