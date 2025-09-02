"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null); // ← sin tipos TS

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

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) setCode(value);
  };

  return (
    <>
      <ToastProvider />

      <div className="min-h-screen bg-[#0A081E] flex items-center justify-center px-4">
        {/* Tarjeta dividida en 2 columnas */}
        <div className="w-full max-w-4xl bg-[#1B1B1B] text-white rounded-md shadow-md border border-neutral-700 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Columna izquierda (logo) - solo desktop/tablet */}
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

            {/* Columna derecha (formulario) */}
            <section className="w-full md:w-[60%] p-8">
              {/* Logo pequeño arriba en móviles */}
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
