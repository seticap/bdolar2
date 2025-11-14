"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar2 from "../components/Navbar2";
import useIsMobile from "../hooks/useIsMobile";


export default function dashboardLayout({ children }) {
  const isMobile = useIsMobile();
  const [sidebarColapsado, setSidebarColapsado] = useState(false);

  // Mantén sincronizada la variable CSS con el ancho real del sidebar
  useEffect(() => {
    // Anchos que usas en Sidebar: w-16 (56px) colapsado, w-56 (224px) expandido
    const width = sidebarColapsado ? "56px" : "224px";
    document.documentElement.style.setProperty("--sidebar-w", isMobile ? "0px" : width);
  }, [sidebarColapsado, isMobile]);

  return (
      <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#20202c] to-[#1a1a26]">
        {/* Sidebar colapsable */}
        <Sidebar onCollapseChange={setSidebarColapsado} />

        {/* Contenedor derecho */}
        <div className="flex-1 flex flex-col min-h-screen">
          <Navbar2 />

          {/* Contenido principal */}
          <main
            className="flex-1 overflow-y-auto p-4 transition-all duration-300 ease-in-out"
            style={{
              paddingLeft: "var(--sidebar-w, 56px)",
              paddingTop: 0,
            }}
          >
            {children}
          </main>
        </div>
      </div>
  );
}
