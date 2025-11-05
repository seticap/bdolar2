/**
 * components/SigninForm.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * SigninForm — Formulario presentacional de registro.
 *
 * Descripción:
 * - Renderiza un formulario de registro con campos básicos (nombre, apellido,
 *   identificación, persona, país, ciudad, empresa, email, teléfono) y aceptaciones.
 * - Layout en dos columnas a partir de md: izquierda (branding/claim), derecha (formulario).
 * - Utiliza componentes de UI (shadcn): Card, Button, Input, Select.
 * - NO implementa lógica de envío, validación ni manejo de estado: el botón actual
 *   redirige a "/" mediante <Link> dentro de un <Button type="submit">.
 *
 * Dependencias:
 * - @/components/ui/button → Button
 * - @/components/ui/card → Card, CardContent
 * - @/components/ui/input → Input
 * - @/components/ui/select → Select, SelectTrigger, SelectValue, SelectContent, SelectItem
 * - next/link → Link
 * - TailwindCSS para utilidades de estilo (incluye clases personalizadas como gradient-custom-vertical)
 *
 * Props:
 * @typedef {Object} SigninFormProps
 * @property {string} [className] - Clases Tailwind para el contenedor externo.
 * @property {any}    [props]     - Props adicionales que se propagan al contenedor.
 *
 * Accesibilidad:
 * - Inputs con `id` pero sin `<label htmlFor=...>`; se recomienda añadir <Label> para cada campo
 *   si se busca cumplimiento estricto de accesibilidad.
 * - Checkboxes carecen de `name` y `aria-describedby`; se recomienda añadirlos.
 * - Selects usan `placeholder` pero no tienen etiqueta visible; se puede agregar <Label>.
 *
 * Limitaciones/Notas importantes:
 * - No hay `onSubmit`; el botón envuelve un <Link> que navega a "/". Para un registro real:
 *   implementar control de estado, validación y envío a API (o Server Actions), y usar `onSubmit`.
 * - Los valores de los Selects son placeholders (e.g., "light"/"dark") y no son semánticos
 *   ("cedula"/"nit", "natural"/"juridica" serían más apropiados).
 * - Varios campos obligatorios con `required`, pero sin feedback visual de error.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * SigninForm — Formulario presentacional de registro (sin lógica de envío).
 * @param {SigninFormProps} props
 * @returns {JSX.Element}
 */

export function SigninForm({ className, ...props}){
  return (
    <div className="flex justify-center items-center h-auto gradient-custom-vertical rounded-lg">
      <Card className=" border-none p-0 rounded-lg ">
        <CardContent className="grid grid-cols-1 p-0 md:grid-cols-2 text-white">
          {/* Columna izquierda: branding */}
          <div className="justify-center items-center p-3">
            <img
              src="logoSet.png"
              alt="Image"
              className="py-45 justify-center items-center"
            />
            <h2 className="justify-center px-25 text-lg font-semibold">
              ¡Únete a SET-ICAP | FX!
            </h2>
          </div>
        {/* Columna derecha: formulario (presentacional) */}
          <form className="p-6 grid grid-cols-2 gap-4">
            <h1 className="col-span-2 mb-2 text-center text-2xl font-bold">
              Registro
            </h1>
            {/* Nombre / Apellido */}
            <Input
              id="nombre"
              type="text"
              placeholder="Nombre Completo"
              required
            />

            <Input
              id="apellido"
              type="text"
              placeholder="Apellido Completo"
              required
            />
          {/* Tipo de Id (Select sin valor semántico) */}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Id" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Cédula</SelectItem>
                <SelectItem value="dark">NIT</SelectItem>
              </SelectContent>
            </Select>
          {/* Ciudad */}
            <Input id="ciudad" type="text" placeholder="Ciudad" required />
          {/* Número de identificación */}
            <div className="col-span-1">
              <div className="flex items-center"></div>
              <Input
                id="numero"
                type="number"
                placeholder="Num. Identificación"
                required
              />
            </div>
          {/* Tipo de persona */}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Natural</SelectItem>
                <SelectItem value="dark">Jurídica</SelectItem>
              </SelectContent>
            </Select>
          {/* País (lista parcial de ejemplo) */}
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="País" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Argentina</SelectItem>
                <SelectItem value="blue">Alemania</SelectItem>
                <SelectItem value="red">Aruba</SelectItem>
                <SelectItem value="rose">Australia</SelectItem>
                <SelectItem value="yellow">Bolivia</SelectItem>
                <SelectItem value="green">Brasil</SelectItem>
                <SelectItem value="gray">Islas Virgenes Britanicas</SelectItem>
                <SelectItem value="white">Canada</SelectItem>
                <SelectItem value="brown">China</SelectItem>
                <SelectItem value="purple">Chile</SelectItem>
                <SelectItem value="violet">Colombia</SelectItem>
              </SelectContent>
            </Select>
          {/* Email / Empresa */}
            <Input id="email" type="email" placeholder="Email" required />

            <Input id="empresa" type="text" placeholder="Empresa" required />
          {/* Teléfono */}
            <div className="flex flex-col">
              <Input id="telefono" type="tel" placeholder="Teléfono" required />
            </div>
          {/* Leyenda de campo obligatorio */}
            <div className="col-span-2 text-sm text-red-500 font-semibold">
              *Campo obligatorio
            </div>
          {/* Intereses (sin name/ids) */}
            <div className="col-span-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Dólar
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Análisis Técnico
              </label>
            </div>
          {/* Aceptaciones (sin enlaces reales) */}
            <div className="col-span-2 space-y-1 text-xs text-gray-300">
              <label className="flex gap-2">
                <input type="checkbox" required />
                Acepto los{" "}
                <a href="#" className="underline">
                  Términos y Condiciones
                </a>
              </label>
              <label className="flex gap-2">
                <input type="checkbox" required />
                Acepto las Políticas Tratamiento de Datos personales SET-ICAP FX
              </label>
              <label className="flex gap-2">
                <input type="checkbox" required />
                Acepto las Políticas Tratamiento de Datos personales SET-ICAP
                SECURITIES
              </label>
            </div>
          {/* Acción principal: redirige a "/" (no envía datos) */}
            <div className="col-span-2 flex justify-center pt-4">
              <Button variant="destructive" type="submit" className="w-40">
                <Link href="/" className="">
                  Registrarse
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}