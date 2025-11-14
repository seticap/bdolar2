// src/components/AlertBanner.jsx
"use client";

export default function AlertBanner({ onClose }){
    return (
    <div className="relative min-w-[260px] sm:min-w-[280px] lg:min-w-[300px]">
      {/* Borde sutil */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-red-900/30" />

      {/* Contenedor principal (más bajo y con menos padding) */}
      <div
        role="alert"
        aria-live="polite"
        className="
          relative w-auto h-[64px] sm:h-[72px]
          rounded-lg bg-[#111827] text-red-500
          flex items-center gap-2 px-3
          shadow-[inset_0_-1px_0_0_rgba(239,68,68,0.28)]
        "
      >
        {/* Punto rojo pequeño */}
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />

        {/* Texto más compacto */}
        <div className="flex-1">
          <div className="text-[10px] tracking-widest text-red-400 font-semibold">
            ALERTA
          </div>
          <div className="text-[12px] sm:text-[13px] font-semibold leading-tight">
            Feriado en EE.UU. — el mercado está cerrado.
          </div>
        </div>

        {/* Botón cerrar pequeño */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar alerta"
          className="
            ml-1 inline-flex items-center justify-center
            w-5 h-5 rounded
            text-red-400 hover:text-red-300
            focus:outline-none focus:ring-2 focus:ring-red-500/25
            transition
          "
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}