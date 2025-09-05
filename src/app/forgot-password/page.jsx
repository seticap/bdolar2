'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ToastProvider from '../components/ToastProvider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Por favor ingresa un correo electrónico válido.');
      toast.error('Corrige los campos resaltados e inténtalo de nuevo.');
      return;
    }

    setError('');
    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 1000));
    setSubmitting(false);

    toast.success('Si el correo existe, se ha enviado un enlace de recuperación.');
    setTimeout(() => router.push('/'), 1500);
  };

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex items-center justify-center px-4">
      <ToastProvider />

      <div className="flex w-full max-w-3xl bg-[#1f1f1f] rounded-lg shadow-md overflow-hidden">
        {/* Logo */}
        <div className="w-1/2 bg-[#1f1f1f] flex items-center justify-center p-6">
          <img src="/logoSet.png" alt="Set ICAP Logo" className="max-w-[115%] h-auto" />
        </div>

        {/* Formulario */}
        <div className="w-1/2 bg-[#1f1f1f] p-8">
          <h2 className="text-white text-xl font-bold mb-2">¿Olvidaste tu contraseña?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Ingrese su correo electrónico para recuperar su contraseña
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border ${
                  error ? 'border-red-500' : 'border-gray-500'
                } focus:outline-none`}
              />
              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : 'Restablezca la contraseña'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
