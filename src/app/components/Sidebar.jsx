"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { FaDollarSign, FaCalendarAlt, FaTable } from "react-icons/fa";

/**
 * Sidebar recibe un prop `onCollapseChange` para notificar el estado del colapso.
 */
export default function Sidebar({ onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);

  // ⏱ Notifica al layout cada vez que cambia el estado del colapso
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
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
      {/* Header del sidebar */}
      <div className="bg-[#a1041e] h-[60px] flex items-center justify-between px-3">
        {!collapsed ? (
          <img src="/Set-Icap_Logo _Blanco.png" alt="Logo" className="h-10 w-auto" />
        ) : (
          <img src="/minilogo.png" alt="Mini Logo" className="h-8 w-8" />
        )}

        <button onClick={() => setCollapsed(!collapsed)} className="text-white">
          <FiMenu size={20} />
        </button>
      </div>

      {/* Menú de navegación */}
      <div className="flex-1 px-4 py-4">
        {!collapsed && (
          <div className="text-xs font-semibold mb-4 tracking-wider">MERCADO</div>
        )}

        <nav className="space-y-4">
          <Link
            href="/spot"
            className="flex items-center space-x-4 hover:text-red-500 transition-colors"
          >
            <FaDollarSign size={18} />
            {!collapsed && <span>Spot USD/COP</span>}
          </Link>

          <Link
            href= "/Nextday"
            className="flex items-center space-x-4 hover:text-red-500 transition-colors"
          >
            <FaCalendarAlt size={18} />
            {!collapsed && <span>Next day USD/COP</span>}
          </Link>

          <Link
            href="/Estadisticas"
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
