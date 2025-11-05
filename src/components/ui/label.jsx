/**
 * components/ui/label.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Label — Wrapper estilado del componente Label de Radix.
 * - Mantiene semántica y accesibilidad nativas (asocia el texto a un control mediante `htmlFor`).
 * - Incluye estados visuales para `peer-disabled` y para grupos `data-[disabled=true]`.
 * - Expone `data-slot="label"` para testeo/estilos dirigidos.
 *
 * Dependencias:
 *  - React
 *  - @radix-ui/react-label
 *  - cn (merge util de clases): "@/lib/utils"
 */
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"
/**
 * @typedef {React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
 *   className?: string
 * }} LabelProps
 */

/**
 * Label — Componente de etiqueta accesible.
 *
 * Props clave:
 * - `htmlFor` (string): id del control al que etiqueta (recomendado).
 * - `className` (string): clases Tailwind adicionales para extender estilos.
 * - Cualquier otra prop válida de `LabelPrimitive.Root` (aria-*, onClick, etc.).
 *
 * Estilos:
 * - `peer-disabled:*`: si el control etiquetado usa `peer` y está deshabilitado, el label refleja estado.
 * - `group-data-[disabled=true]:*`: si el label está dentro de un contenedor con `data-disabled="true"`,
 *    aplica estilos de deshabilitado (útil para grupos de campos).
 */
function Label({
  className,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Label }
