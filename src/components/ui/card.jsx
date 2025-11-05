/**
 * components/ui/card.jsx (o ruta equivalente)
 *
 * Conjunto de componentes de “Card” atómicos y estilables con Tailwind:
 * - Card:           contenedor raíz
 * - CardHeader:     cabecera (título, descripción y acciones)
 * - CardTitle:      título
 * - CardDescription:descripción secundaria
 * - CardAction:     zona de acción (botones, toggles) colocada a la derecha del header
 * - CardContent:    contenido principal
 * - CardFooter:     pie de tarjeta
 *
 * Diseño:
 * - Se usan data-attributes (`data-slot`) para facilitar testeo y estilos avanzados.
 * - Las clases base son minimalistas y se pueden extender con `className`.
 *
 * Dependencias:
 * - React
 * - `cn` (utilidad para concatenar/mergear clases Tailwind).
 */
import * as React from "react"

import { cn } from "@/lib/utils"
/**
 * Card — contenedor raíz de la tarjeta.
 *
 * @param {Object} props
 * @param {string} [props.className]  Clases Tailwind adicionales.
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]  Cualquier prop válido de <div>.
 * @returns {JSX.Element}
 */
function Card({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground flex flex-col gap-6 rounded-xl border-none py-6",
        className
      )}
      {...props} />
  );
}

/**
 * CardHeader — cabecera de la tarjeta.
 * - Layout preparado para título + descripción y un área de acción opcional.
 * - Si se incluye un elemento con `data-slot="card-action"`, el header crea
 *   una grilla con dos columnas (contenido + acción).
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */

function CardHeader({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        " grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props} />
  );
}
/**
 * CardTitle — título del card.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */

function CardTitle({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props} />
  );
}

/**
 * CardDescription — texto secundario/descriptivo del card.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */

function CardDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props} />
  );
}
/**
 * CardAction — contenedor para acciones del header (botones icónicos, etc.).
 * - Por diseño, se posiciona en la segunda columna y primera fila del header
 *   cuando se usa junto con `CardHeader`.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */
function CardAction({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props} />
  );
}

/**
 * CardContent — contenido principal del card.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */

function CardContent({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}
/**
 * CardFooter — pie del card (acciones secundarias, notas).
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.HTMLAttributes<HTMLDivElement>} [props...]
 * @returns {JSX.Element}
 */
function CardFooter({
  className,
  ...props
}) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props} />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
