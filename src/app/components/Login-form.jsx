import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm({ className, ...props }) {
  return (
    <div className="h-180">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2 text-white">
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

          <form className="p-6 md:p-8 gradient-custom-vertical">
            <div className="flex flex-col gap-6 mt-12">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Inicio de Sesión</h1>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" required />
              </div>
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