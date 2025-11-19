/**
 * Navbar2.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 */

"use client";

import { useState, useEffect } from "react";
import { FaUser, FaChevronDown } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";

const STORAGE_KEY = "sidebar:collapsed";

export default function Navbar2() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const router = useRouter();

  // Leer estado inicial + escuchar cambios del sidebar
  useEffect(() => {
    if (typeof window === "undefined") return;

    // estado inicial desde localStorage
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setSidebarCollapsed(stored === "1");
      }
    } catch {}

    // escuchar eventos del Sidebar
    const handler = (e) => {
      setSidebarCollapsed(Boolean(e.detail));
    };

    window.addEventListener("sidebar:collapsed", handler);
    return () => window.removeEventListener("sidebar:collapsed", handler);
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <nav
      className={`
        w-full h-[60px] bg-[#1b1b23]
        flex items-center
        px-4 sm:px-6 shadow-md z-40
        transition-all duration-300
      `}
    >
      {/* Ghost con el mismo ancho que el sidebar */}
      <div className={sidebarCollapsed ? "w-14" : "w-52"} />

      {/* Logo SIEMPRE visible, justo después del sidebar */}
      <div className="flex items-center">
        <Image
          src="/logoSet.png"   // asegúrate que esté en /public/logoSet.png
          alt="SET ICAP"
          width={120}
          height={40}
          priority
        />
      </div>

      {/* Usuario a la derecha */}
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
