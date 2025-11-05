/**
 * utils/cn.js (o "@/lib/utils" en tu proyecto)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * `cn` — Utilidad para combinar clases condicionales y resolver conflictos de Tailwind.
 *
 * ¿Qué hace?
 * - Usa `clsx` para construir cadenas de clases a partir de argumentos variados:
 *   strings, arrays, objetos condicionales { 'clase': cond }...
 * - Pasa el resultado por `tailwind-merge` para **resolver conflictos** de Tailwind
 *   (p. ej., "p-2 p-4" → "p-4", "text-left text-right" → "text-right").
 *
 * Beneficios:
 * - API concisa para componer clases sin repetir patrones.
 * - Evita estilos inesperados por clases duplicadas o mutuamente excluyentes.
 *
 * Dependencias:
 *  - clsx: https://github.com/lukeed/clsx
 *  - tailwind-merge: https://github.com/dcastil/tailwind-merge
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
/**
 * Combina clases de forma segura para Tailwind.
 *
 * @example
 * // Strings
 * cn("p-2", "bg-slate-900"); // -> "p-2 bg-slate-900"
 *
 * @example
 * // Condicionales con objeto
 * cn("px-3", { "text-white": isActive, "text-slate-400": !isActive });
 *
 * @example
 * // Conflictos resueltos por tailwind-merge
 * cn("p-2", "p-4"); // -> "p-4"
 * cn("text-left", condition && "text-right"); // -> "text-right" si condition
 *
 * @example
 * // Arrays anidados / falsy values ignorados
 * cn("flex", ["items-center", false && "hidden"], null, undefined);
 *
 * @param  {...any} inputs - Lista de clases en cualquier forma que acepte `clsx`:
 *   string | number | null | undefined | false |
 *   Record<string, boolean> | Array<string|...> | etc.
 * @returns {string} Cadena de clases mergeada y sin conflictos de Tailwind.
 */
export function cn(...inputs) {
    // 1) clsx: normaliza/filtra/une entradas heterogéneas → string
  // 2) twMerge: resuelve conflictos de utilidades de Tailwind en la string result
  return twMerge(clsx(inputs));
}
