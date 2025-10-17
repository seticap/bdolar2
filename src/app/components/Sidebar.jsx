/**
 * Sidebar.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Componente de barr lateral izquierda para navegacion del dashboard.
 *  Admite colapso dinámico y notifica su estado al Layout superior mediante el prop `onCollapseChange`.
 * 
 *   Funcionalidades:
 *    - Alterna entre estado expandido (`w-64`) y colapsado (`w-20`)
 *    - Usa íconos (React Icons) para representar las rutas
 *    - Notifica cambios de colapso al componente padre (Layout)
 *    - Responsive-friendly (se adapta a Logos y espacio)
 * 
 *   Dependencias:
 *    - `next/link`: para navegación
 *    - `react-icons`: FiMenu, FaDollarSign, FaCalendarAlt, Fatable
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { FaDollarSign, FaCalendarAlt, FaTable } from "react-icons/fa";

const STORAGE_KEY = "sidebar:collapsed";
/**
 * Sidebar recibe un prop `onCollapseChange` para notificar el estado del colapso.
 */
export default function Sidebar({ onCollapseChange }) {

  // Estado de colapso del sidebar
  const [collapsed, setCollapsed] = useState(() => {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v ? v === "1" : true;
});
/**
 * Efecto: Cada vez que el sidebar cambio de estado, notifica al Layout padre.
 */
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0"); } catch {}
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);


  return (
    <aside
      className={`
        fixed top-0 left-0 z-50
        h-screen overflow-y-auto
        ${collapsed ? "w-20" : "w-64"}
        flex flex-col bg-[#1b1c23] text-white
        transition-all duration-300 ease-in-out
        shadow-[2px_0_10px_rgba(0,0,0,0.4)]
      `}
    >
      {/* Header del sidebar con logo y botón de colapsar */}
      <div className="bg-[#1b1b23] h-[60px] flex items-center justify-between px-3">
        {/**Logo dinámico según colapso */}
        {!collapsed ? (
          <img src="/Set-Icap_Logo _Blanco.png" alt="Logo" className="h-10 w-auto" />
        ) : (
          <img src="/minilogo.png" alt="Mini Logo" className="h-8 w-8" />
        )}
        {/**Botón colapsar/expandir */}
        <button 
        onClick={() => setCollapsed((v) => !v)}
        className= "text-white"
        aria-label="Alternar sidebar"
        title={collapsed ? "Expandir" : "Colapsar"}
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* Menú de navegación */}
      <div className="flex-1 px-4 py-4">
        {!collapsed && (
          <div className="text-xs font-semibold mb-4 tracking-wider">MERCADO</div>
        )}

        <nav className="space-y-4">
          {/**Enlace 1: Spot USD/COP */}
          <Link
            href="../dashboard/spot"
            className="flex items-center space-x-4 hover:text-red-500 transition-colors"
          >
            <FaDollarSign size={18} />
            {!collapsed && <span>Spot USD/COP</span>}
          </Link>
          {/**Enlace 2: Next day USD/COP */}
          <Link
            href= "../dashboard/nextday"
            className="flex items-center space-x-4 hover:text-red-500 transition-colors"
          >
            <FaCalendarAlt size={18} />
            {!collapsed && <span>Next day USD/COP</span>}
          </Link>
          {/**Enlace 3: Estadísticas */}
          <Link
            href="../dashboard/estadistica"
            className="flex items-center space-x-4 hover:text-red-500 transition-colors"
          >
            <FaTable size={18} />
            {!collapsed && <span>Estadísticas</span>}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
