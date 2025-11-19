/**
 * Sidebar.jsx (compacto real, mismo diseño)
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
  }, [collapsed, onCollapseChange, mounted]);

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-screen overflow-y-auto
        ${collapsed ? "w-14" : "w-52"}   /* ↓ más angosto que w-16/w-56 */
        flex flex-col bg-[#1b1c23] text-white
        transition-all duration-300 ease-in-out
        shadow-[2px_0_10px_rgba(0,0,0,0.4)]
      `}
    >
      {/* Header */}
      <div className="bg-[#1b1b23] h-[48px] flex items-center justify-between px-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="text-white"
          aria-label="Alternar sidebar"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          <FiMenu size={16} /> {/* ↓ más pequeño */}
        </button>
      </div>

      {/* Menú */}
      <div className="flex-1 px-2.5 py-2.5">
        {!collapsed && (
          <div className="text-[10px] font-semibold mb-2.5 tracking-wider">
            MERCADO
          </div>
        )}

        <nav className="space-y-2.5">
          <a
            href="../spot"
            className="flex items-center gap-2.5 hover:text-red-500 transition-colors"
          >
            <FaDollarSign size={14} /> {/* ↓ 14px */}
            {!collapsed && <span className="text-[13px] leading-none">Spot USD/COP</span>}
          </a>

          <a
            href="../nextday"
            className="flex items-center gap-2.5 hover:text-red-500 transition-colors"
          >
            <FaCalendarAlt size={14} />
            {!collapsed && <span className="text-[13px] leading-none">Next day USD/COP</span>}
          </a>

          <a
            href="../estadistica"
            className="flex items-center gap-2.5 hover:text-red-500 transition-colors"
          >
            <FaTable size={14} />
            {!collapsed && <span className="text-[13px] leading-none">Estadísticas</span>}
          </a>
        </nav>
      </div>
    </aside>
  );
}
