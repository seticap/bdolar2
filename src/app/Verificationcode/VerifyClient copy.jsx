"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

const VERIFY_PATH = "http://set-fx.com/api/v1/auth/users/emailCodeConfirmation";
const RESEND_PATH =
  "http://set-fx.com/api/v1/email/notifications/user/requestEmailConfirmation";
const ENFORCE_ID_GUARD = false;

export default function VerifyClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const idFromQS = sp.get("id") || "";
  const emailFromQS = sp.get("email") || "";

  const [id, setId] = useState(idFromQS);
  const [email, setEmail] = useState(emailFromQS);
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ENFORCE_ID_GUARD) return;
    if (!id) {
      toast.info("Falta el ID de verificación. Te llevamos al inicio.");
      router.replace("/");
    }
  }, [id, router]);

  const digitsOnly = (v) => v.replace(/\D/g, "");
  const handleChange = (e) => setCode(digitsOnly(e.target.value).slice(0, 6));

  async function handleSubmit(e) {
    e.preventDefault();

    if (!id) {
      setError("No se encontró el ID de verificación. Vuelve al registro.");
      toast.error("❌ Falta el ID de verificación.");
      return;
    }
    if (!code || code.length !== 6) {
      setError("El código debe tener 6 dígitos numéricos.");
      toast.error("❌ El código debe tener 6 dígitos numéricos.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(VERIFY_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ID: id, Code: code }),
      });

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok) {
        const msg =
          data?.message || data?.error || raw || "Código inválido o expirado.";
        throw new Error(msg);
      }

      toast.success("✅ Cuenta verificada. Ya puedes iniciar sesión.");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("verify.id");
        sessionStorage.removeItem("verify.email");
      }
      setTimeout(() => router.push("/"), 1000);
    } catch (err) {
      setError(err.message || "No se pudo verificar el código.");
      toast.error(`❌ ${err.message || "No se pudo verificar el código."}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!id) {
      toast.error("❌ No hay ID de verificación para reenviar.");
      return;
    }
    try {
      toast.info("📨 Reenviando código...");
      const res = await fetch(RESEND_PATH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ID: id }),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!res.ok)
        throw new Error(
          data?.message || raw || "No se pudo reenviar el código."
        );
      toast.success("✅ Código reenviado. Revisa tu correo.");
    } catch (err) {
      toast.error(`❌ ${err.message || "No se pudo reenviar el código."}`);
    }
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen bg-[#0A081E] flex items-center justify-center px-4">
        <div className="w-full max-w-4xl bg-[#1B1B1B] text-white rounded-md shadow-md border border-neutral-700 overflow-hidden">
          <div className="flex flex-col md:flex-row">
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

            <section className="w-full md:w-[60%] p-8">
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

              <h2 className="text-2xl font-bold mb-2">
                Código de Verificación
              </h2>
              <p className="text-sm text-neutral-400 mb-6">
                {email ? (
                  <>
                    Hemos enviado un código a{" "}
                    <span className="text-white">{email}</span>.
                  </>
                ) : (
                  <>Ingresa el código que hemos enviado a tu correo.</>
                )}
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

                {!id && ENFORCE_ID_GUARD === false && (
                  <p className="text-yellow-400 text-xs mb-2">
                    No hay ID de verificación (guard deshabilitado, UI sólo para
                    pruebas).
                  </p>
                )}

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 bg-[#1E4B7A] hover:bg-[#173B61] rounded-md text-white font-medium transition-colors border border-[#1E4B7A] hover:border-[#173B61] disabled:opacity-60"
                >
                  {submitting ? "Verificando..." : "Verificar"}
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-blue-400 hover:underline"
                  onClick={handleResend}
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
