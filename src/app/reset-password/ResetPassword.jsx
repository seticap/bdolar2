"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";
import Link from "next/link";

const RESET_URL = "http://set-fx.com/api/v1/auth/users/reset-password";
const ENFORCE_ID_GUARD = false;

export default function ResetPassword() {
  const router = useRouter();
  const sp = useSearchParams();

  const token = sp.get("token");
  const email = sp.get("email");

  useEffect(() => {
    if (!ENFORCE_ID_GUARD) return;
    if (!token || !email) {
      toast.info("El enlace de recuperacion no es valido.");
      router.replace("/");
    }
  }, [token, email, router]);

  const passwordStrength = (pw = "") => {
    const lenght = pw.length >= 12;
    const upper = /[A-Z]/.test(pw);
    const digit = /\d/.test(pw);
    const special = /[^\w\s]/.test(pw);

    let score = 0;
    if (lenght) score++;
    if (upper) score++;
    if (digit) score++;
    if (special) score++;

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
      color = "bg-green-500";
    }

    const percent = (score / 4) * 100;
    return { score, label, color, percent };
  };

  const isStrongPass = (pw = "") => {
    const len = pw.length >= 12;
    const upper = /[A-Z]/.test(pw);
    const digit = /\d/.test(pw);
    const special = /[^\w\s]/.test(pw);
    return len && upper && digit && special;
  };

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isStrongPass(password)) {
      setError(
        "La contraseña debe tener al menos 12 caracteres, una MAYÚSCULA, un número y un caracter especial."
      );
      toast.error("Corrige los campos e inténtalo de nuevo");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      toast.error("Corrige los campos e inténtalo de nuevo.");
      return;
    }

    try {
      setSubmitting(true);
      const url = `${RESET_URL}?token=${encodeURIComponent(
        token
      )}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Email: email,
          Password: password,
          ConfirmPassword: confirm,
          ResetCode: token,
        }),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok) {
        const msg =
          data?.meta?.error?.message ||
          data?.message ||
          "No se pudo restrablece la contraseña.";
        throw new Error(msg);
      }

      toast.success("✅ Contraseña restablecida. Ya puedes iniciar sesión.");
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setError(err.message || "No se pudo restablece la contraseña.");
      toast.error("No se pudo restablecer la contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 " +
    "border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400";

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <ToastProvider />

      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Columna Izquierda: Logo */}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img
            src="/logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[115%] h-auto"
          />
        </div>

        {/* Columna derecha: Formulario */}
        <div className="w-1/2 p-8">
          <h2 className="text-white text-xl font-bold mb-1">
            Recupera tu contraseña
          </h2>
          <p className="text-gray-400 text-sm mb-2">
            Ingresa tu nueva contraseña y repítela.
          </p>
          {email && (
            <p className="text-xs text-gray-400 mb-6">
              Para: <span className="text-white">{email}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Nueva contraseña */}
            <div>
              <label className="sr-only">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Escribe contraseña (mín. 12)"
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
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-700 rounded">
                    <div
                      className={`h-1.5 rounded ${strength.color} transition-all`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Fortaleza:{" "}
                    <span className="text-white">{strength.label}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Requisitos: mín. 12, 1 MAYÚSCULA, 1 número y 1 caracter
                    especial.
                  </p>
                </div>
              )}
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
              disabled={submitting || !token || !email}
              className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60"
            >
              {submitting ? "Procesando..." : "Restablecer contraseña"}
            </button>
          </form>

          {/* Enlace de retorno */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-300 hover:underline">
              Regresar al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}