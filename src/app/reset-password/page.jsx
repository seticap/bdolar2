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

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage(){
   // Router de Next para redirigir tras el proceso
    const router = useRouter();

    // Estados controlados de los inputs
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    // Estado de envio para deshabilitar UI mientras se procesa
    const [submitting, setSubmitting] = useState(false);

    // Mensaje de error (por ejemplo, contraseñas no coinciden)
    const [error,setError] = useState('');

    /**
     * Maneja el submit del formulario:
     *  - Previene el comportamiento por defecto
     *  - Limpia error previo
     *  - Valida que `password` y `confirm` coincidan
     *  - Simula una llamada a backend (1s)
     *  - Notifica exito y redirige al inicio
     */
    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError('');
        
        // Validacion minima: deben coincidir
        if(password !== confirm){
            setError('Las contraseñas no coinciden');
            return;
        }
        setSubmitting(true);

        // Simulacion de request al backend
        await new Promise ((res)=>setTimeout(res,1000));
        alert('Contraseña restablecida correctamente');

        // Redirige a la pantalla de Login
        router.push('/');
    };
    return(
        <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Columna Izquierda: Logo / branding */}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img
            src="logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[115%] h-auto"
          />
        </div>

        {/* Columna derecha: Formulario de restablecimiento */}
        <div className="w-1/2 p-8">
          <h2 className="text-white text-xl font-bold mb-2">Recupera tu contraseña</h2>
          <p className="text-gray-400 text-sm mb-6">
            Ingrese su nueva contraseña y repítala para verificarla
          </p>

        {/* Formulario controlado */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/*Nueva contraseña */}
            <input
              type="password"
              placeholder="Escribe contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400"
            />
            {/*Confirmacion de contraseña */}
            <input
              type="password"
              placeholder="Repite contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400"
            />
            {/*Boton de accion principal */}
            {error && (
              <p className="text-red-500 text-sm -mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors"
            >
              {submitting ? 'Procesando...' : 'Restablecer contraseña'}
            </button>
          </form>

            {/*Enlace de retorno al inicio de sesion */}
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