/**
 * dashboardLayout.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *    Este componente define la estructura principal para todas las rutas hijas dentro del dashboard.
 *    Incluye el Sidebar, el Navbar superior y un área central para mostrar el contenido (`children`).
 * 
 *   Características:
 * - Responde dinámicamente a cambios en tamaño de pantalla.
 * - Ajusta el padding izquierdo según el estado del sidebar (colapsado o expandido).
 * - Detecta si es dispositivo móvil usando el hook `useIsMobile`.
 * 
 *   Componentes utilizados:
 * - Sidebar (colapsable)
 * - Navbar2 (navbar fijo superior)
 * - Hook: useIsMobile (detección responsive)
 */

"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar2 from "../components/Navbar2";
import useIsMobile from "../hooks/useIsMobile";
import {WebSocketDataProvider} from "../services/WebSocketDataProvider"

export default function dashboardLayout({ children }) {
  //Detecta si está en pantalla móvil
  const isMobile = useIsMobile();
  //Estado para saber si el sidebar está colapsado
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  //Estado para controlar el padding dinámico del contenido central
  const [paddingLeft, setPaddingLeft] = useState("pl-64");
  /**
   * useEffect que actualiza el padding izquierdo del contenido principal:
   * - Si es móvil: sin padding (sidebar flotante)
   * - Si es desktop:
   *  - Sidebar expandido; 'pl-64'
   *  - Sidebar colapsado: 'pl-20'
   */
  useEffect(() => {
    if (isMobile) {
      setPaddingLeft("pl-0");
    } else {
      setPaddingLeft(sidebarColapsado ? "pl-20" : "pl-64");
    }
  }, [isMobile, sidebarColapsado]);

  return (
    <WebSocketDataProvider>
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#20202c] to-[#1a1a26]">
      {/*Sidebar lateral (colapsable), informa a este layout  si está colapsado*/}
      <Sidebar onCollapseChange={setSidebarColapsado} />
      {/**Contenedor derecho con Navbar y contenido principal*/}
      <div className="flex-1 flex flex-col min-h-screen">
        {/**Navbar superior*/}
        <Navbar2 />
        {/**Contenido principal*/}
        <main
          className={`flex-1 overflow-y-auto pt-[60px] p-4 transition-all duration-300 ease-in-out ${paddingLeft}`}
        >
          {children}
        </main>
      </div>
    </div>
    </WebSocketDataProvider>
  );
}
