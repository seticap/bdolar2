"use client";

import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { LoginForm } from "./login-form";
import { SigninForm } from "./Sigin-form";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

const Navbar = () => {
  return (
    <nav className="p-1 flex items-center justify-between bg-custom-colortwo">
      {/* LEFT */}
      <Link href="/">
        <img src="logoSet.png" alt="logo" className="max-w-40 max-h-40" />
      </Link>
      {/* collapseButton */}
      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <Button variant="link">
          <Link href="/" className="">
            SET-FX
          </Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="cursor-pointer">
              REGISTRARSE
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogTitle>
              {/* Registrarse */}
              </DialogTitle>
            <SigninForm />
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="cursor-pointer">
              INICIAR SESIÓN
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogTitle>
              {/* Iniciar Sesión */}
            </DialogTitle>
            <LoginForm />
          </DialogContent>
        </Dialog>

        <Button variant="link">
          <Link href="/" className="">
            EPAYCO
          </Link>
        </Button>

        {/* THEME MENU */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}

        {/* USER MENU */}
        {/* <Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/1486366" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar> */}

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
                <SquareMenu/>
                <span className="sr-only" >Open Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
    </nav>
  );
};

export default Navbar;
