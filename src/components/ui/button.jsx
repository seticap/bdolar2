/**
 * components/ui/button.jsx 
 *
 * Botón reutilizable con variantes usando `class-variance-authority` (cva).
 * - Soporta `variant` y `size`.
 * - Soporta `asChild` para renderizar el botón como otro elemento usando Radix `<Slot/>`.
 * - Integra utilidades de Tailwind y estilos de enfoque/accesibilidad.
 *
 * Dependencias:
 *  - react
 *  - @radix-ui/react-slot  (para `asChild`)
 *  - class-variance-authority (cva)
 *  - cn util (merge de clases - tailwind helpers)
 */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
/**
 * Definición de variantes del botón con `cva`.
 *
 * Clases base:
 *  - Layout: inline-flex, center, gap-2, rounded, text-sm, font-medium
 *  - Estados: transition-all, disabled:pointer-events-none/opacity-50
 *  - SVGs: evita capturar eventos y define tamaño por defecto (size-4)
 *  - Accesibilidad: outline-none, focus-visible:* (borde y ring), aria-invalid:*
 *
 * Variants:
 *  - variant: default | destructive | outline | secondary | ghost | link | custom
 *  - size:    default | sm | lg | xl | icon
 *
 * defaultVariants:
 *  - { variant: "default", size: "default" }
 */
const buttonVariants = cva(
  " inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/70 cursor-pointer ",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-white underline-offset-4 hover:underline",
        custom:
          "text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-8 has-[>svg]:px-8",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
/**
 * Button — Componente de botón configurable.
 *
 * Props:
 * @typedef ButtonProps
 * @property {string} [className]           Clases Tailwind adicionales.
 * @property {'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'|'custom'} [variant]
 * @property {'default'|'sm'|'lg'|'xl'|'icon'} [size]
 * @property {boolean} [asChild=false]      Si true, renderiza con Radix <Slot/> (para cambiar el nodo).
 * @property {React.ButtonHTMLAttributes<HTMLButtonElement> & React.ComponentPropsWithoutRef<any>} [props]
 *
 * Notas:
 * - `asChild` permite usar <a>, <Link> o cualquier componente como “raíz” manteniendo estilos del botón.
 * - El componente agrega `data-slot="button"` para depuración/estilos si lo necesitas.
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
