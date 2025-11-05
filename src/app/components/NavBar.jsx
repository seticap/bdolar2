"use client"; // Indica que este componente se debe renderizar del lado del cliente en Next.js

// Importaciones necesarias
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "@/components/ui/button"; // Componente de botón reutilizable
import { LoginForm } from "./login-form"; // Formulario de inicio de sesión
import { SigninForm } from "./Sigin-form"; // Formulario de registro
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"; // Componentes para diálogos modales
import MobileMenuToggle from "./MobileMenuToggle"; // Ícono de hamburguesa para menú móvil

// Componente principal de la barra de navegación
const Navbar = () => {
  // Estado local que controla si el menú móvil está abierto
  const [openMenu, setOpenMenu] = useState(false);

  return (
    // Contenedor de la barra de navegación
    <nav className="flex items-center justify-between p-2 bg-custom-colortwo text-white z-50">
      {/* Logo con enlace a la página principal */}
      <Link href="/">
        <img src="/logoSet.png" alt="logo" className="max-w-40 max-h-40" />
        {/* 
          - max-w-40 / max-h-40: limita el tamaño del logo 
          - responsive en cualquier dispositivo
        */}
      </Link>

      {/* Sección derecha: botones y enlaces del menú */}
      <div className="flex-grow flex justify-end items-center gap-4">
        {/* Botón hamburguesa visible solo en móvil */}
        <MobileMenuToggle
          open={openMenu}
          toggle={() => setOpenMenu((prev) => !prev)}
        />

        {/* Menú de navegación principal */}
        <div
          className={`
            flex flex-col sm:flex-row gap-4 text-white font-semibold uppercase tracking-wide transition-all duration-300

            ${
              openMenu
                ? "fixed inset-0 bg-custom-colortwo z-40 items-center justify-center text-xl"
                : "hidden"
            }

            sm:flex sm:static sm:justify-end sm:items-center sm:text-sm sm:bg-transparent sm:shadow-none
          `}
        >
          {/* Enlace externo a SET-FX */}
          <Button
            variant="link"
            className="text-left w-full sm:w-auto"
            onClick={() => setOpenMenu(false)}
          >
            <a href="https://set-icap.com/set-icap-fx/acerca-de/">SET-FX</a>
          </Button>

          {/* Diálogo de registro */}
          <Button
            variant="link"
            className="w-full sm:w-auto"
            onClick={() => setOpenMenu(false)}
          >
            <Link href="/register">REGISTRARSE</Link>
          </Button>

          {/* Diálogo de inicio de sesión */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="w-full sm:w-auto"
                onClick={() => setOpenMenu(false)}
              >
                INICIAR SESIÓN
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogTitle>Iniciar Sesión</DialogTitle>
              <LoginForm />
            </DialogContent>
          </Dialog>

          {/* Enlace interno a EPAYCO */}
          <Button
            variant="link"
            className="text-left w-full sm:w-auto"
            onClick={() => setOpenMenu(false)}
          >
            <Link href="/epayco">EPAYCO</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
