/**
 * ForgotPasswordPage.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Pagina de recuperación de contraseña.
 *  Permite al usuario ingresar su correo electrónico para recibir un enlace de recuperación.
 *  Simula el envío de correo con una demora artificial y redirige al inicio tras confirmación.
 * 
 * Características:
 *  - Formulario responsivo y estilizado con Tailwind Css
 *  - Diseño dividido en dos columnas (Logo + formulario)
 *  - Simulación de envio con `setTimeout`
 *  - Redirección automatica al home ('/') tras enviar
 * 
 * Tecnologías:
 *   - React (useState)
 *   - Next.js(useRouter)
 *   -Tailwind Css Para el diseño visual
 */

'use client';

import {useState} from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage(){
  // Estado del input email
    const [email, setEmail] = useState('');
    // Controla el estado de envío del formulario
    const [submitting, setSubmitting] = useState(false);
    // Router de Next.js para redireccionar después deñ envío
    const router = useRouter();

    /**
     * Maneja el envio del formulario:
     * - Previene el comportamiento por defecto
     * - Simula una espera de red (1 segundo)
     * - Muestra alerta
     * - Redirige a la página de login
     */

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
      // Simula delay de API
        await new Promise ((res) => setTimeout(res, 1000));

        alert('Si el correo existe, se ha enviado un enlace de recuperacion.');
        router.push('/');
    };
    return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Sección de logo*/}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img
            src="logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[115%] h-auto"
          />
        </div>

        {/* Formulario */}
        <div className="w-1/2 bg-[#1f1f1f] p-8">
          <h2 className="text-white text-xl font-bold mb-2">¿Olvidaste tu contraseña?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Ingrese su correo electrónico para recuperar su contraseña
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors"
            >
              {submitting ? 'Enviando...' : 'Restablezca la contraseña'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-gray-300 hover:underline">
              Regresar al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}