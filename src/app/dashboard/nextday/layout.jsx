"use client";

import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import Navbar2 from "../../components/Navbar2";

export default function nextdayLayout({ children }) {
  const [sidebarColapsado, setSidebarColapsado] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-[#20202c] to-[#1a1a26]">
      <Sidebar onCollapseChange={setSidebarColapsado} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar2 />
        <main
          className={`flex-1 overflow-y-auto pt-[60px] p-4 transition-all duration-300 ease-in-out ${
            sidebarColapsado ? "pl-20" : "pl-64"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
