"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setError("");

    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      toast.error("Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }

    setError("");
    setSubmitting(true);

    await new Promise((res) => setTimeout(res, 1000));
    setSubmitting(false);

    toast.success(
      "Si el correo existe, se ha enviado un enlace de recuperación."
    );
    setTimeout(() => router.push("/"), 1500);

      }

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center p-4 md:p-8">
      <ToastProvider />


      <div className="flex flex-col md:flex-row w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        <div className="w-full md:w-1/2 bg-[#1f1f1f] flex items-center justify-center p-4 md:p-6">
          <img
            src="/logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[120px] md:max-w-[70%] h-auto"
          />
        </div>

        <div className="w-full md:w-1/2 bg-[#1f1f1f] p-4 md:p-6 lg:p-8">
          <h2 className="text-white text-lg md:text-xl font-bold mb-2 text-center md:text-left">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6 text-center md:text-left">
            Ingrese su correo electrónico para recuperar su contraseña
          </p>

          {okMsg && (
            <div
              className="mb-4 rounded-md border border-green-700/50 bg-green-900/20 px-4 py-3 text-green-300"
              role="status"
            >
              {okMsg}
            </div>
          )}

          {error && (
            <div
              className="mb-4 rounded-md border border-red-700/50 bg-red-900/20 px-4 py-3 text-red-300"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border ${
                  error ? "border-red-500" : "border-gray-500"
                } focus:outline-none text-sm md:text-base`}

              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-3 md:py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60 text-sm md:text-base"
            >
              {submitting ? "Enviando..." : "Restablezca la contraseña"}

            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
