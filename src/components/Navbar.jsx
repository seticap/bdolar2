"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { LoginForm } from "./login-form";
import { SigninForm } from "./Sigin-form";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import MobileMenuToggle from "./MobileMenuToggle"; // ícono ☰ / ✕

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <nav className="flex items-center justify-between p-2 bg-custom-colortwo text-white z-50">
      {/* Top: Logo y botón de menú */}
      <Link href="/">
        <img src="logoSet.png" alt="logo" className="max-w-40 max-h-40" />
      </Link>

      <div className="flex-grow flex justify-end items-center gap-4">
        <MobileMenuToggle
          open={openMenu}
          toggle={() => setOpenMenu((prev) => !prev)}
        />

        {/* Menú único: comportamiento depende del viewport + openMenu */}
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
          <Button
            variant="link"
            className="text-left w-full sm:w-auto"
            onClick={() => setOpenMenu(false)}
          >
            <a href="https://set-icap.com/set-icap-fx/acerca-de/">SET-FX</a>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="link"
                className="w-full sm:w-auto"
                onClick={() => setOpenMenu(false)}
              >
                REGISTRARSE
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogTitle>Registro</DialogTitle>
              <SigninForm />
            </DialogContent>
          </Dialog>

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

          <Button
            variant="link"
            className="text-left w-full sm:w-auto"
            onClick={() => setOpenMenu(false)}
          >
            <Link href="/">EPAYCO</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
