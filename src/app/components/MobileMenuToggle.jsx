/**
 * components/MobileMenuToggle.jsx (o ruta equivalente)
 *
 * MobileMenuToggle — Botón accesible para abrir/cerrar el menú móvil.
 *
 * Descripción:
 * - Renderiza un botón que alterna entre ícono hamburguesa (☰) y cerrar (✕)
 *   en función del estado `open`.
 * - Optimizado para móviles (visible sólo en `sm:hidden`).
 * - Incluye `aria-label` dinámico para lectores de pantalla.
 *
 * Accesibilidad:
 * - Usa `aria-label` en español: "Abrir menú" / "Cerrar menú".
 * - Recomendado: añadir `aria-expanded` y `aria-controls` desde el padre
 *   si conoces el id del contenedor del menú.
 *
 * Dependencias:
 * - React + TailwindCSS para estilos utilitarios.
 *
 * Props:
 * @typedef {Object} MobileMenuToggleProps
 * @property {boolean} open   - Estado actual del menú (true = abierto).
 * @property {() => void} toggle - Callback que alterna el estado del menú.
 */
"use client";

import React from "react";

/**
 * Botón de alternancia del menú móvil (hamburguesa/close).
 *
 * @param {MobileMenuToggleProps} props
 * @returns {JSX.Element}
 */
const MobileMenuToggle = ({ open, toggle }) => {
  return (
    <button
      className="sm:hidden text-4xl absolute right-5 top-6 z-50"
      onClick={toggle}
      aria-label={open ? "Cerrar menú" : "Abrir menú"}
    >
        {/* Ícono hamburguesa (☰) o ícono cerrar (✕) según estado */}
      {open ? "✕" : "☰"}
    </button>
  );
};

export default MobileMenuToggle;