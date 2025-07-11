"use client";

import React from "react";

const MobileMenuToggle = ({ open, toggle }) => {
  return (
    <button
      className="sm:hidden text-5xl absolute right-5 top-6 z-50"
      onClick={toggle}
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
    >
      {open ? "✕" : "☰"}
    </button>
  );
};

export default MobileMenuToggle;
//comentario
