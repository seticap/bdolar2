/**
 * components/ToastProvider.jsx (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Proveedor de toasts global usando `react-toastify`.
 *
 * Descripción:
 * - Renderiza un `<ToastContainer />` configurado con tema oscuro y posición `top-center`.
 * - Debe montarse una sola vez (normalmente en el layout) para que `toast.*` funcione en toda la app.
 *
 * Dependencias:
 * - react-toastify (ToastContainer + estilos globales CSS)
 *
 * Uso típico:
 * - Importar y montar <ToastProvider /> en tu layout o en la página raíz.
 * - Lanzar toasts desde cualquier componente con `import { toast } from "react-toastify"`.
 *   Ejemplo: `toast.success("Guardado!");`
 *
 * Notas:
 * - Este componente ya importa el CSS global de react-toastify.
 * - Si prefieres centralizar el CSS, puedes mover el import a tu layout global.
 */
'use client'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
/**
 * ToastProvider — Contenedor de notificaciones globales (react-toastify).
 *
 * Props del contenedor (valores por defecto aquí):
 * - position:      'top-center'
 * - autoClose:     4000 ms
 * - hideProgressBar: false
 * - newestOnTop:   true
 * - closeOnClick:  true
 * - pauseOnFocusLoss: true
 * - draggable:     true
 * - pauseOnHover:  true
 * - theme:         'dark'
 *
 * @returns {JSX.Element}
 */
export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  )
}
