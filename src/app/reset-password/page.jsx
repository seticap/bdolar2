/**
 * ResetPasswordPage.jsx
 *
 *  Pagina para restablecer contraseña.
 *  Permite ingresar una nueva contraseña y su confirmacion, valida que coincidan
 *  y simula el envio al backend antes de redirigir al inicio de sesion.
 *
 *  Caracteristiscas:
 *   - Validacion basica: Las contraseñas deben coincidir.
 *   - Estados de UI: `submitting` bloquea el boton y cambia el texto mientras "procesa".
 *   - UX: muestra mensaje de error en caso de no coincidencia.
 *   - Simulacion de backend con `setTimeout` (1s) y Luego redirreccion.
 *
 *  Tecnologias:
 *   - React (useState)
 *   - Next.js App Router (useRouter)
 *   - Tailwind Css para estilos
 *
 *  Notas:
 *   - Reemplazar la simulacion por una llamada real a API cuando este disponible.
 *   - Considerar politicas de contraseñas (minimo de caracteres, complejidad, etc)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Utilidades de validación/fortaleza ---
  const isStrongPass = (v) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v);

  const passwordStrength = (pw = "") => {
    const length = pw.length >= 8;
    const lower = /[a-z]/.test(pw);
    const upper = /[A-Z]/.test(pw);
    const digit = /\d/.test(pw);
    const special = /[^\w\s]/.test(pw);

    let score = 0;
    if (length && lower) score++;
    if (length && upper) score++;
    if (length && digit) score++;
    if (length && special) score++;

    let label = "Débil",
      color = "bg-red-500";
    if (score === 2) {
      label = "Aceptable";
      color = "bg-yellow-500";
    }
    if (score === 3) {
      label = "Buena";
      color = "bg-emerald-500";
    }
    if (score === 4) {
      label = "Fuerte";
      color = "bg-green-600";
    }

    const percent = (score / 4) * 100;
    return { score, label, color, percent };
  };

  const pushToast = (type, message) => {
    const config = { autoClose: 3500 };
    if (type === "success") toast.success(message, config);
    else if (type === "error") toast.error(message, config);
    else toast.info(message, config);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isStrongPass(password)) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y un caracter especial."
      );
      pushToast("error", "Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      pushToast("error", "Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }

    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 1000));
    setSubmitting(false);

    pushToast("success", "Contraseña restablecida correctamente.");
    setTimeout(() => router.push("/"), 1200);
  };

  const inputBase =
    "w-full px-4 py-3 rounded bg-[#1f1f1f] text-white placeholder-gray-500 " +
    "border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400 " +
    "text-sm md:text-base";

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center p-4 md:p-8">
      <ToastProvider />
      <div className="flex flex-col md:flex-row w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Columna Izquierda: Logo */}
        <div className="w-full md:w-1/2 bg-[#1f1f1f] flex items-center justify-center p-4 md:p-6">
          <img
            src="/logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[120px] md:max-w-[70%] h-auto"
          />
        </div>

        {/* Columna derecha: Formulario */}
        <div className="w-full md:w-1/2 p-4 md:p-6 lg:p-8">
          <h2 className="text-white text-lg md:text-xl font-bold mb-2 text-center md:text-left">
            Recupera tu contraseña
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6 text-center md:text-left">
            Ingrese su nueva contraseña y repítala para verificarla
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Nueva contraseña */}
            <div>
              <label className="sr-only">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Escribe contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  aria-invalid={!!error}
                  className={`${inputBase} pr-10 ${
                    error ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                  aria-label={
                    showPass ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPass ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Medidor de fortaleza */}
              {password &&
                (() => {
                  const { label, color, percent } = passwordStrength(password);
                  return (
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-700 rounded">
                        <div
                          className={`h-1.5 rounded ${color} transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] md:text-[11px] text-gray-400 mt-1">
                        Fortaleza: <span className="text-white">{label}</span>
                      </p>
                      <p className="text-[10px] md:text-[11px] text-gray-400">
                        Debe incluir mayúscula, minúscula, número y caracter
                        especial.
                      </p>
                    </div>
                  );
                })()}
            </div>

            {/* Confirmación */}
            <div>
              <label className="sr-only">Repite contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite contraseña"
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError("");
                  }}
                  aria-invalid={!!error}
                  className={`${inputBase} pr-10 ${
                    error ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-white"
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-3 md:py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60 text-sm md:text-base"
            >
              {submitting ? "Procesando..." : "Restablecer contraseña"}
            </button>
          </form>

          {/* Enlace de retorno */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-xs md:text-sm text-gray-300 hover:underline"
            >
              Regresar al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
