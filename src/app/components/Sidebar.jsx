/**
 * Sidebar.jsx
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiMenu } from "react-icons/fi";
import { FaDollarSign, FaCalendarAlt, FaTable } from "react-icons/fa";

const STORAGE_KEY = "sidebar:collapsed";

export default function Sidebar({ onCollapseChange }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsed(stored === "1");
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {}

    onCollapseChange?.(collapsed);

    // 🔔 Avisamos al resto de la app (Navbar2) del nuevo estado
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sidebar:collapsed", { detail: collapsed })
      );
    }
  }, [collapsed, onCollapseChange, mounted]);

  const iconSize = collapsed ? 20 : 18;
  const menuIconSize = collapsed ? 18 : 16;

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-screen overflow-y-auto
        ${collapsed ? "w-14" : "w-52"}
        flex flex-col bg-[#1b1c23] text-white
        transition-all duration-300 ease-in-out
        shadow-[2px_0_10px_rgba(0,0,0,0.4)]
      `}
    >
      {/* Header */}
      <div
        className={`
          bg-[#1b1b23] h-[48px] flex items-center px-2
          ${collapsed ? "justify-center" : "justify-between"}
        `}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-white"
          aria-label="Alternar sidebar"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <FiMenu size={menuIconSize} />
        </button>
      </div>

      {/* Menú */}
      <div className="flex-1 px-2.5 py-2.5">
        {!collapsed && (
          <div className="text-[11px] font-semibold mb-2.5 tracking-wider">
            MERCADO
          </div>
        )}

        <nav className="space-y-2.5">
          <Link
            href="../spot"
            className={`
              flex items-center hover:text-red-500 transition-colors
              ${collapsed ? "justify-center" : "gap-2.5"}
            `}
          >
            <FaDollarSign size={iconSize} />
            {!collapsed && (
              <span className="text-[14px] leading-snug">Spot USD/COP</span>
            )}
          </Link>

          <Link
            href="../nextday"
            className={`
              flex items-center hover:text-red-500 transition-colors
              ${collapsed ? "justify-center" : "gap-2.5"}
            `}
          >
            <FaCalendarAlt size={iconSize} />
            {!collapsed && (
              <span className="text-[14px] leading-snug">
                Next day USD/COP
              </span>
            )}
          </Link>

          <Link
            href="../estadistica"
            className={`
              flex items-center hover:text-red-500 transition-colors
              ${collapsed ? "justify-center" : "gap-2.5"}
            `}
          >
            <FaTable size={iconSize} />
            {!collapsed && (
              <span className="text-[14px] leading-snug">Estadísticas</span>
            )}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
