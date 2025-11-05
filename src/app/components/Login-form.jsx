/**
 * components/LoginForm.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Componente de formulario de inicio de sesión (presentacional).
 *
 * Descripción:
 * - Renderiza un formulario de login con correo y contraseña.
 * - Layout en dos columnas desde `md`: izquierda (branding + CTA registro), derecha (formulario).
 * - Utiliza componentes UI locales (Button, Card, Input, Label) y clases Tailwind.
 * - NO implementa lógica de envío/validación; el botón redirige a "/" con <Link>.
 *
 * Dependencias:
 * - @/components/ui/button → Button
 * - @/components/ui/card → Card, CardContent
 * - @/components/ui/input → Input
 * - @/components/ui/label → Label
 * - next/link → Link (para navegación al home)
 *
 * Props:
 * - Acepta `className` y `...props` pero actualmente no se usan en el wrapper.
 *   Si deseas aplicar clases al contenedor, propaga `className` al <div> raíz.
 *
 * Accesibilidad:
 * - Inputs con `Label` asociado via `htmlFor`.
 * - `type="email"` y `type="password"` ayudan a inputs apropiados en móviles.
 *
 * Limitaciones/Notas:
 * - El CTA “Registrate” y “Olvidaste tu contraseña?” apuntan a `href="#"`. Reemplazar con rutas reales.
 * - El <Button> envuelve un <Link>. Considera usar solo <Button type="submit"> y manejar el submit,
 *   o poner el <Link> fuera del <Button> para semántica más clara.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
/**
 * LoginForm — Formulario presentacional de inicio de sesión.
 *
 * @param {{ className?: string } & React.ComponentProps<'div'>} props
 * @returns {JSX.Element}
 */
export function LoginForm({ className, ...props }) {
  return (
    <div className="h-180">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 text-white">
          {/* Columna izquierda: branding + CTA registro (oculta en mobile) */}
          <div className=" relative hidden md:block gradient-custom-vertical">
            <img
              src="logoSet.png"
              alt="Image"
              className="py-30 justify-center items-center"
            />
            <div className="text-center text-sm">
              ¿Aún no tienes una cuenta?{" "}
              <a
                href="#"
                className="underline hover:text-blue-400 underline-offset-4"
              >
                Registrate
              </a>
            </div>
            <br />
          </div>
          {/* Columna derecha: formulario */}
          <form className="p-6 md:p-8 gradient-custom-vertical">
            <div className="flex flex-col gap-6 mt-12">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Inicio de Sesión</h1>
              </div>
              {/* Correo */}
              <div className="grid gap-3">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" required />
              </div>
              {/* Contraseña + enlace recuperar */}
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Olvidaste tu contraseña?
                  </a>
                </div>
                {/* Acción */}
                <Input id="password" type="password" required />
              </div>
              <div className="col-span-2 flex justify-center pt-4">
                <Button type="submit" className=" w-40 bg-blue-900">
                  <Link href="/">Iniciar Sesión</Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}