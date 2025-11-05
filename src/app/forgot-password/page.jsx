/**
 * src/app/forgot-password.jsx
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Página de "Olvidé mi contraseña" para Next.js (App Router).
 *
 * Descripción:
 * - Renderiza un formulario para solicitar el restablecimiento de contraseña.
 * - Valida email en el cliente con una expresión regular básica.
 * - Simula una petición asíncrona y muestra notificaciones con react-toastify.
 * - Redirige a la página de inicio tras el envío (éxito simulado).
 * - UI responsiva con TailwindCSS y layout dividido (logo + formulario).
 *
 * Características:
 * - Client Component: usa hooks de React y `useRouter` de `next/navigation`.
 * - Accesibilidad básica: feedback visual de error, botón deshabilitado en envío.
 * - UX: spinner textual ("Enviando...") durante la simulación.
 *
 * Dependencias:
 * - next/navigation: useRouter (para redirección)
 * - react-toastify: toast + ToastProvider (provee contenedor y estilos)
 * - TailwindCSS (clases utilitarias para el layout y estilo)
 *
 * Ruta:
 * - Con App Router, este archivo define la ruta `/forgot-password`.
 *
 * Notas:
 * - Este componente solo simula el flujo; aquí NO se llama a una API real.
 * - Para producción, reemplaza la simulación por una llamada `fetch` a tu backend.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ToastProvider from "../components/ToastProvider";

/**
 * Valida el formato del correo electrónico (regex simple).
 * Acepta: algo@dominio.tld (tld de 2+ caracteres).
 * No garantiza que el correo exista o reciba mails.
 *
 * @param {string} value - Correo electrónico a validar.
 * @returns {boolean} true si el formato es válido, false en caso contrario.
 */

export default function ForgotPasswordPage() {
  /** Estado del campo de correo. */
  const [email, setEmail] = useState("");
   /** Estado de envío para deshabilitar el botón y mostrar loading. */
  const [submitting, setSubmitting] = useState(false);
  /** Mensaje de error de validación de email. */
  const [error, setError] = useState("");
  /** Router de Next.js para redirecciones en cliente. */
  const router = useRouter();
  /**
 * Página: Forgot Password
 * - Contiene formulario controlado con validación de email.
 * - Muestra toasts de error/éxito y redirige tras el envío.
 *
 * @returns {JSX.Element} Interfaz de recuperación de contraseña.
 */

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

   /**
   * Maneja el envío del formulario:
   * - Evita submit por defecto.
   * - Valida el email y muestra toast de error si es inválido.
   * - Simula espera de 1s y muestra toast de éxito (flujo real debe llamar API).
   * - Redirige a `/` tras 1.5s.
   *
   * @param {import('react').FormEvent<HTMLFormElement>} e
   * @returns {Promise<void>}
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Por favor ingresa un correo electrónico válido.");
      toast.error("Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }

    setError("");
    setSubmitting(true);

    // Simulación de petición (reemplazar por fetch a tu backend)
    await new Promise((res) => setTimeout(res, 1000));
    setSubmitting(false);

    toast.success(
      "Si el correo existe, se ha enviado un enlace de recuperación."
    );
    setTimeout(() => router.push("/"), 1500);
  };

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center p-4 md:p-8">
      {/* Contenedor de react-toastify para toasts globales */}
      <ToastProvider />

      <div className="flex flex-col md:flex-row w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Columna: Logo */}
        <div className="w-full md:w-1/2 bg-[#1f1f1f] flex items-center justify-center p-4 md:p-6">
          <img
            src="/logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[120px] md:max-w-[70%] h-auto"
          />
        </div>

        {/* Columna: Formulario */}
        <div className="w-full md:w-1/2 bg-[#1f1f1f] p-4 md:p-6 lg:p-8">
          <h2 className="text-white text-lg md:text-xl font-bold mb-2 text-center md:text-left">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mb-4 md:mb-6 text-center md:text-left">
            Ingrese su correo electrónico para recuperar su contraseña
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border ${
                  error ? "border-red-500" : "border-gray-500"
                } focus:outline-none text-sm md:text-base`}
              />
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
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
