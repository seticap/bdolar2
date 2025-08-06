/**
 * Navbar2.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Barra de navegación superior del dashboard.
 *  Alinea dinámicamente con el sidebar (colapsado o no) y muestra un menú de usuario con logout.
 * 
 *  Caracteristicas principales:
 *   - Detecta el colapso del sidebar mediante clases aplicadas al layout principal(`pl-20`, `pl-64`).
 *   - Muestra el nombre del usuario y un dropdown con acción de Logout.
 *   - Responsive: ocultamiento de texto en mobile y fallback visual.
 *  
 *  Dependencias:
 *   - `react-icons`: FaUser, FaChevronDown, FiLogOut
 *   - `next/navigation`: useRouter
 */

"use client";

import { useState, useEffect } from "react";
import { FaUser, FaChevronDown } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function Navbar2() {
  // Estado del menú desplegable del usuario
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Estado interno que refleja si el sidebar está colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Hook de enrutamiento para Logout
  const router = useRouter();

  /**
   *  Efecto para observar cambios en el Layout y determinar si el sidebar está colapsado.
   *  Utiliza `MutationObserver` para detectar la clase `pl-20` o `pl-64` en el contenedor raíz.
   */
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const root = document.querySelector("body > div");
      if (root?.classList.contains("pl-20")) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);
  /**
   *  Redirecciona al Login o landing al hacer Logout
   */

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <nav
      className={`w-full h-[60px] bg-[#1b1b23] flex items-center justify-between px-4 sm:px-6 shadow-md z-40 transition-all duration-300`}
    >
      {/* Espacio fantasma para dejar hueco del sidebar*/}
      <div className={`${sidebarCollapsed ? "w-20" : "w-64"} hidden sm:block`} />

      {/* Dropdown del usuario */}
      <div className="ml-auto relative">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FaUser className="text-white" />
          <span className="text-sm font-semibold hidden sm:inline text-white">
            estefany1
          </span>
          <FaChevronDown className="text-xs text-white" />
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-[#2a2a35] rounded shadow-md z-50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
