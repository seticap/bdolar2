/**
 * src/app/verificationcode.jsx
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Página de verificación por código (Client Component, Next.js App Router).
 *
 * Descripción:
 * - Renderiza un formulario para ingresar un código de verificación de 6 dígitos.
 * - Valida en cliente que el código sea numérico y tenga longitud exacta de 6.
 * - Muestra notificaciones (éxito/error/info) con react-toastify.
 * - Muestra branding (logo) y diseño responsive (columna izquierda/ derecha).
 *
 * NOTA: En esta implementación el código válido está hardcodeado a "123456" para demo.
 * En producción, reemplaza esta validación por una llamada a tu API de verificación.
 *
 * Dependencias:
 * - next/image → <Image /> (optimizada)
 * - react-toastify → toast + ToastProvider
 * - TailwindCSS para estilos utilitarios
 *
 * Ruta:
 * - Con App Router, este archivo define la ruta `/verificationcode`.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

/**
 * Página de verificación de código por correo/SMS.
 * - Gestiona estado local del código y error de validación.
 * - Valida que el código tenga 6 dígitos.
 * - Muestra toasts de resultado.
 *
 * @returns {JSX.Element} Interfaz de verificación de código.
 */

export default function VerifyPage() {
  /** Código de 6 dígitos introducido por el usuario. */
  const [code, setCode] = useState("");
  /** Mensaje de error actual para el input (o null si no hay error). */
  const [error, setError] = useState(null); // ← sin tipos TS

   /**
   * Envía el formulario:
   * - Previene submit por defecto.
   * - Verifica longitud exacta de 6 dígitos (numéricos).
   * - Compara contra "123456" (demo). En producción, llamar API.
   *
   * @param {import('react').FormEvent<HTMLFormElement>} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos numéricos.");
      toast.error("❌ El código debe tener 6 dígitos numéricos.");
      return;
    }

    if (code === "123456") {
      toast.success("✅ Código verificado correctamente.");
      setError(null);
    } else {
      toast.error("❌ El código ingresado no es válido.");
      setError("El código ingresado no es válido.");
    }
  };
  /**
   * Controla el input del código:
   * - Solo permite caracteres numéricos (0-9).
   * - Mantiene longitud máxima (controlado por `maxLength={6}` en el input).
   *
   * @param {import('react').ChangeEvent<HTMLInputElement>} e
   */
  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setCode(value);
  };

  return (
    <>
    {/* Contenedor global de toasts (debe existir para mostrar notificaciones) */}
      <ToastProvider />

      <div className="min-h-screen bg-[#0A081E] flex items-center justify-center px-4">
        {/* Tarjeta principal (dos columnas en desktop) */}
        <div className="w-full max-w-4xl bg-[#1B1B1B] text-white rounded-md shadow-md border border-neutral-700 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Columna izquierda: branding / logo (oculta en mobile) */}
            <aside className="hidden md:flex md:w-[40%] items-center justify-center bg-[#1B1B1B] border-r border-neutral-700 p-10">
              <Image
                src="/logoSet.png"
                alt="SET ICAP"
                width={260}
                height={80}
                priority
                className="w-56 h-auto"
              />
            </aside>

            {/* Columna derecha: formulario de verificación */}
            <section className="w-full md:w-[60%] p-8">
              {/* Logo visible sólo en mobile */}
              <div className="md:hidden mb-6">
                <Image
                  src="/logoSet.png"
                  alt="SET ICAP"
                  width={140}
                  height={40}
                  priority
                  className="h-10 w-auto"
                />
              </div>

              <h2 className="text-2xl font-bold mb-2">Código de Verificación</h2>
              <p className="text-sm text-neutral-400 mb-6">
                Ingresa el código que hemos enviado a tu correo.
              </p>

              <form onSubmit={handleSubmit}>
                <label className="block mb-2 text-sm font-medium">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={handleChange}
                  className="w-full px-4 py-2 mb-3 bg-neutral-900 border border-neutral-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 tracking-widest text-center text-lg"
                  placeholder="XXXXXX"
                />

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  className="w-full py-2 bg-[#1E4B7A] hover:bg-[#173B61] rounded-md text-white font-medium transition-colors border border-[#1E4B7A] hover:border-[#173B61]"
                >
                  Verificar
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:underline"
                  onClick={() =>
                    toast.info("📨 Código reenviado. Revisa tu bandeja de entrada.")
                  }
                >
                  ¿No recibiste el código? Reenviar
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
