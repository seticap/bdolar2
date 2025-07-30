'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage(){
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error,setError] = useState('');

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError('');

        if(password !== confirm){
            setError('Las contraseñas no coinciden');
            return;
        }
        setSubmitting(true);

        await new Promise ((res)=>setTimeout(res,1000));
        alert('Contraseña restablecida correctamente');
        router.push('/');
    };
    return(
        <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Logo */}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img
            src="logoSet.png"
            alt="Set ICAP Logo"
            className="max-w-[115%] h-auto"
          />
        </div>

        {/* Formulario */}
        <div className="w-1/2 p-8">
          <h2 className="text-white text-xl font-bold mb-2">Recupera tu contraseña</h2>
          <p className="text-gray-400 text-sm mb-6">
            Ingrese su nueva contraseña y repítala para verificarla
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Escribe contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400"
            />
            <input
              type="password"
              placeholder="Repite contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-500 focus:outline-none focus:ring-0 focus:border-gray-400"
            />

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