"use client";

import { useState, useEffect } from "react";
import { FaUser, FaChevronDown } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";

/**
 * Navbar2 se ajusta dinámicamente según el estado del sidebar.
 * Detecta el colapso mediante una clase padre (`pl-64` o `pl-20`)
 */

export default function Navbar2() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

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

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <nav
      className={`
        w-full h-[60px]
        bg-[#a1041e]
        flex items-center justify-between
        px-4 sm:px-6
        shadow-md
        z-40
        transition-all duration-300
      `}
    >
      {/* Espacio reservado para alinear con sidebar */}
      <div className={`${sidebarCollapsed ? "w-20" : "w-64"} hidden sm:block`} />

      {/* Usuario / Dropdown */}
      <div className="ml-auto relative">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FaUser className="text-gray-200" />
          <span className="text-sm font-semibold hidden sm:inline">estefany1</span>
          <FaChevronDown className="text-xs text-white" />
        </div>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-[#1a1a2e] rounded shadow-md z-50">
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
