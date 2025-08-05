"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { FaDollarSign, FaCalendarAlt, FaTable } from "react-icons/fa";


export default function Sidebar({ onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (onCollapseChange) onCollapseChange(collapsed);
  }, [collapsed, onCollapseChange]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <>
      {/* Overlay para cerrar el menú móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen overflow-y-auto
          bg-[#1b1c23] text-white shadow-[2px_0_10px_rgba(0,0,0,0.4)]
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="bg-[#a1041e] h-[60px] flex items-center justify-between px-3">
          {!collapsed ? (
            <img
              src="/Set-Icap_Logo _Blanco.png"
              alt="Logo"
              className="h-10 w-auto"
            />
          ) : (
            <img src="/minilogo.png" alt="Mini Logo" className="h-8 w-8" />
          )}
          <button
            onClick={toggleSidebar}
            className="text-white md:hidden block"
          >
            <FiMenu size={20} />
          </button>
          <button
            onClick={toggleSidebar}
            className="text-white hidden md:block"
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Menú */}
        <div className="flex-1 px-4 py-4">
          {!collapsed && (
            <div className="text-xs font-semibold mb-4 tracking-wider">
              MERCADO
            </div>
          )}

          <nav className="space-y-4">
            <Link
              href="/spot"
              className="flex items-center space-x-4 hover:text-red-500 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <FaDollarSign size={18} />
              {!collapsed && <span>Spot USD/COP</span>}
            </Link>

            <Link
              href="/Nextday"
              className="flex items-center space-x-4 hover:text-red-500 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <FaCalendarAlt size={18} />
              {!collapsed && <span>Next day USD/COP</span>}
            </Link>

            <Link
              href="/Estadisticas"
              className="flex items-center space-x-4 hover:text-red-500 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <FaTable size={18} />
              {!collapsed && <span>Estadísticas</span>}
            </Link>
          </nav>
        </div>
      </aside>

      {/* Botón flotante para abrir el menú en móviles */}
      <button
        className="fixed top-4 left-4 z-50 text-white bg-[#a1041e] p-2 rounded-md shadow-lg md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <FiMenu size={22} />
      </button>
    </>
  );
}
