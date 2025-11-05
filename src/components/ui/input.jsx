/**
 * components/ui/input.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Input — Campo de texto estilizado con Tailwind.
 * - Conserva la semántica y accesibilidad de <input /> nativo.
 * - Expone un `data-slot="input"` para testeo/estilado dirigido.
 * - Integra estados: focus-visible, disabled, invalid (vía aria-invalid).
 * - Soporta archivos (clases `file:*` aplican al botón del file input).
 *
 * Dependencias:
 *  - React
 *  - cn util (merge de clases): "@/lib/utils"
 */
import * as React from "react"

import { cn } from "@/lib/utils"
/**
 * Componente Input.
 *
 * @param {InputProps} props
 *  - `className`   Clases Tailwind adicionales para extender el estilo.
 *  - `type`        Tipo de input (text, email, password, number, file, etc).
 *  - ...props      Cualquier prop válida de <input> (name, value, onChange, aria-*, etc.).
 *
 * Estados visuales y accesibilidad:
 *  - `focus-visible`: resalta foco vía teclado con borde + ring.
 *  - `disabled`: desactiva interacción y baja opacidad.
 *  - `aria-invalid="true"`: muestra estilos de error (borde/ring destructivo).
 *  - `selection:*`: colores de selección de texto.
 *  - `file:*`: estilo del botón interno cuando `type="file"`.
 */
function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input }
