"use client";

import React from "react";

const MobileMenuToggle = ({ open, toggle }) => {
  return (
    <button
      className="sm:hidden text-3xl absolute right-4 top-4 z-50"
      onClick={toggle}
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
    >
      {open ? "✕" : "☰"}
    </button>
  );
};

export default MobileMenuToggle;
//comentario
