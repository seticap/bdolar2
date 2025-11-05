"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

const FORGOT_URL = "http://set-fx.com/api/v1/auth/users/forgot-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const router = useRouter();

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setError("");

    const clean = email.trim();

    if (!validateEmail(clean)) {
      setError("Por favor ingresa un correo electrónico válido.");
      toast.error("Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(FORGOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: clean }),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (res.ok) {
        const msg = `Hemos enviado un correo a ${clean} con instrucciones para restablecer tu contraseña.`;
        setOkMsg(msg);
        toast.success("Correo enviado con éxito.");
        setTimeout(() => router.push("/"), 10000);
        return;
      }

      const serverMsg =
        data?.meta?.error?.message ||
        data?.message ||
        raw ||
        "No se pudo procesar la solicitud.";

      if (res.status === 404 || /no existe|not found/i.test(serverMsg)) {
        setError("El correo no existe. Verifica e inténtalo nuevamente.");
        toast.error("El correo no existe.");
      } else if (res.status === 400 || res.status === 422) {
        setError("Solicitud inválida. Revisa el correo e inténtalo otra vez.");
        toast.error("Solicitud inválida.");
      } else {
        setError("No se pudo enviar el correo. Intenta más tarde.");
        toast.error("No se pudo enviar el correo.");
      }
    } catch {
      setError("No fue posible conectar con el servidor. Intenta más tarde.");
      toast.error("Error de conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <ToastProvider />

      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Logo */}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img
            src="/logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[115%] h-auto"
          />
        </div>

        {/* Formulario */}
        <div className="w-1/2 bg-[#1f1f1f] p-8">
          <h2 className="text-white text-xl font-bold mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-400 text-sm mb-6">
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
                className={`w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border ${
                  error ? "border-red-500" : "border-gray-500"
                } focus:outline-none`}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Restablezca la contraseña"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
