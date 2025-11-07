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

export function SigninForm({ className, ...props}){
  return (
    <div className="flex justify-center items-center h-auto gradient-custom-vertical rounded-lg">
      <Card className=" border-none p-0 rounded-lg ">
        <CardContent className="grid grid-cols-1 p-0 md:grid-cols-2 text-white">
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

          <form className="p-6 grid grid-cols-2 gap-4">
            <h1 className="col-span-2 mb-2 text-center text-2xl font-bold">
              Registro
            </h1>
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

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Id" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Cédula</SelectItem>
                <SelectItem value="dark">NIT</SelectItem>
              </SelectContent>
            </Select>

            <Input id="ciudad" type="text" placeholder="Ciudad" required />

            <div className="col-span-1">
              <div className="flex items-center"></div>
              <Input
                id="numero"
                type="number"
                placeholder="Num. Identificación"
                required
              />
            </div>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Natural</SelectItem>
                <SelectItem value="dark">Jurídica</SelectItem>
              </SelectContent>
            </Select>

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

            <Input id="email" type="email" placeholder="Email" required />

            <Input id="empresa" type="text" placeholder="Empresa" required />

            <div className="flex flex-col">
              <Input id="telefono" type="tel" placeholder="Teléfono" required />
            </div>

            <div className="col-span-2 text-sm text-red-500 font-semibold">
              *Campo obligatorio
            </div>

            <div className="col-span-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Dólar
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Análisis Técnico
              </label>
            </div>

            <div className="col-span-2 space-y-1 text-xs text-gray-300">
              <label className="flex gap-2">
                <input type="checkbox" required />
                Acepto los{" "}
                <Link href="#" className="underline">
                  Términos y Condiciones
                </Link>
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