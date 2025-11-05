/**
 * components/ui/dialog.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Conjunto de wrappers del Dialog de Radix UI con estilos y data-slots:
 * - Dialog:            raíz (provider/control de estado)
 * - DialogTrigger:     elemento que abre el diálogo
 * - DialogPortal:      portal para renderizar fuera del flujo del DOM
 * - DialogOverlay:     overlay semitransparente con animaciones
 * - DialogContent:     contenido modal centrado con botón de cierre
 * - DialogHeader:      cabecera (título/acciones)
 * - DialogFooter:      pie (acciones alineadas)
 * - DialogTitle:       título accesible (ligado por aria a Content)
 * - DialogDescription: subtítulo/descripción para accesibilidad
 *
 * Diseño:
 * - `data-slot="..."` en cada pieza para testeo/estilado selectivo.
 * - Clases Tailwind minimalistas + animaciones controladas por data-state.
 * - Cierre (X) incluido dentro de Content (con soporte teclado/aria).
 *
 * Dependencias:
 * - React
 * - @radix-ui/react-dialog
 * - lucide-react (XIcon)
 * - `cn` (merge util de clases: "@/lib/utils")
 */
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
/**
 * Root del diálogo. Controla open/close y provee contexto a todos los hijos.
 * @param {DialogPrimitive.DialogProps} props  Acepta `open`, `defaultOpen`, `onOpenChange`, etc.
 */
function Dialog({
  ...props
}) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
/**
 * Trigger que alterna el estado del diálogo (abrir/cerrar).
 * - Puede envolver cualquier elemento interactivo.
 * @param {DialogPrimitive.DialogTriggerProps} props
 */
function DialogTrigger({
  ...props
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}
/**
 * Portal para renderizar el overlay y el contenido a nivel del body.
 * - Evita issues de stacking y z-index con layout existente.
 * @param {DialogPrimitive.DialogPortalProps} props
 */
function DialogPortal({
  ...props
}) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}
/**
 * Close: botón o elemento para cerrar el diálogo.
 * - Se usa internamente también en `DialogContent`.
 * @param {DialogPrimitive.DialogCloseProps} props
 */
function DialogClose({
  ...props
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}
/**
 * Overlay semitransparente que cubre la pantalla.
 * - Incluye animaciones dependientes de `data-state="open|closed"`.
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & { className?: string }} props
 */
function DialogOverlay({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props} />
  );
}
/**
 * Contenido principal del diálogo (modal).
 * - Centrando absoluto (translate) + animaciones (zoom/fade).
 * - Incluye botón de cierre en la esquina superior derecha.
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { className?: string, children?: React.ReactNode }} props
 */
function DialogContent({
  className,
  children,
  ...props
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        {...props}
        className={cn(
          "bg-none border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-40%] gap-4 rounded-lg p-6 shadow-lg duration-200",
          className
        )}
        {...props}>
        {children}
        <DialogPrimitive.Close
          className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Header del contenido del diálogo.
 * - Layout flexible para título/descripción/acciones.
 * @param {React.HTMLAttributes<HTMLDivElement> & { className?: string }} props
 */
function DialogHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props} />
  );
}

/**
 * Footer del contenido del diálogo.
 * - Acciones alineadas a la derecha en desktop; en columna en móvil.
 * @param {React.HTMLAttributes<HTMLDivElement> & { className?: string }} props
 */
function DialogFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props} />
  );
}
/**
 * Título accesible del diálogo.
 * - Asociado por Radix al Content via aria-labelledby.
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & { className?: string }} props
 */
function DialogTitle({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props} />
  );
}
/**
 * Descripción accesible del diálogo.
 * - Asociada por Radix al Content via aria-describedby.
 * @param {React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & { className?: string }} props
 */
function DialogDescription({
  className,
  ...props
}) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
