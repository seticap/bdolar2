// src/app/page.jsx
// ──────────────────────────────────────────────────────────────────────────────
// ✅ Componente de Landing (Client Component, App Router - Next.js)
// Autor: (tu nombre)
// Descripción general:
//  - Página principal de la app. Orquesta la UI con Navbar, Carrusel, métricas
//    centrales (CIERRE / PROMEDIO), gráfico y paneles laterales.
//  - Muestra un toast centrado anunciando “Día festivo en Estados Unidos” con
//    barra de progreso y cierre automático.
//  - Consume datos en tiempo real desde un provider de WebSocket.
// Tecnologías: React 18, Next.js (App Router), TailwindCSS.
// Accesibilidad: aria-live="polite" en el toast, botón Close con aria-label.
// Rendimiento: timers limpiados en unmount + RAF cancelado en el toast.
// ──────────────────────────────────────────────────────────────────────────────
'use client';

import React from 'react';
import NavBar from './components/NavBar';
import { Card } from '@/components/ui/card';
import { SectionCards, SectionCardsRight } from './components/section-cards';
import InfoPage from './components/InfoPage';
import FooterPage from './components/Footer';
import { useWebSocketData } from './services/WebSocketDataProvider';
import DollarChart from './components/DollarChart';
import Carrousel from './components/Carrousel';

/* ────────────────────────────────────────────────────────────────────────────
   UTILIDADES DE FERIADOS (EE. UU.)
   Estas funciones NO se usan aún para decidir si se muestra el toast, pero
   quedan documentadas para conectar una lógica real en el futuro.
   Cómo usarlas para activar el toast:
     if (isUsFederalHoliday(new Date())) setShowHoliday(true);
   ──────────────────────────────────────────────────────────────────────────── */
/** Rellena a 2 dígitos (01..09) */
const pad2 = (n) => String(n).padStart(2, '0');
/** Formatea Date a YYYY-MM-DD */
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
/**
 * Devuelve el n-ésimo día de la semana (dow) de un mes/año.
 * @param {number} year - Año (p.ej. 2025)
 * @param {number} month - Mes 0-11 (0=Enero)
 * @param {number} dow - Day Of Week 0-6 (0=Dom, 1=Lun, ...)
 * @param {number} n - n-ésimo
 */
function nthDow(year, month, dow, n) {
  const first = new Date(year, month, 1);
  const delta = ((7 + dow - first.getDay()) % 7) + (n - 1) * 7;
  return new Date(year, month, 1 + delta);
}

/**
 * Devuelve el último día de la semana (dow) de un mes/año.
 * @param {number} year
 * @param {number} month
 * @param {number} dow
 */
function lastDow(year, month, dow) {
  const last = new Date(year, month + 1, 0);
  const delta = (7 + last.getDay() - dow) % 7;
  return new Date(year, month + 1, 0 - delta);
}

/**
 * Regla “observed”: si cae domingo → se mueve a lunes; si cae sábado → a viernes.
 * @param {Date} d
 */
function observed(d) {
  const out = new Date(d);
  if (d.getDay() === 0) out.setDate(d.getDate() + 1);
  if (d.getDay() === 6) out.setDate(d.getDate() - 1);
  return out;
}

/**
 * Devuelve un arreglo con las fechas de feriados federales (observados) de EE. UU.
 * @param {number} year
 */
function usFederalHolidayDates(year) {
  return [
    observed(new Date(year, 0, 1)),   // New Year’s Day
    nthDow(year, 0, 1, 3),            // MLK Day (3er lunes enero)
    nthDow(year, 1, 1, 3),            // Presidents’ Day (3er lunes feb)
    lastDow(year, 4, 1),              // Memorial Day (último lunes mayo)
    observed(new Date(year, 5, 19)),  // Juneteenth
    observed(new Date(year, 6, 4)),   // Independence Day
    nthDow(year, 8, 1, 1),            // Labor Day (1er lunes sept)
    nthDow(year, 9, 1, 2),            // Columbus/Indigenous (2do lunes oct)
    observed(new Date(year, 10, 11)), // Veterans Day
    nthDow(year, 10, 4, 4),           // Thanksgiving (4to jueves nov)
    observed(new Date(year, 11, 25)), // Christmas
  ];
}

/**
 * Determina si la fecha pasada es feriado federal (observado) en EE. UU.
 * Incluye un buffer de año anterior/siguiente para robustez.
 * @param {Date} [date=new Date()]
 */
function isUsFederalHoliday(date = new Date()) {
  const y = date.getFullYear();
  const ymd = toYMD(date);
  const list = [...usFederalHolidayDates(y - 1), ...usFederalHolidayDates(y), ...usFederalHolidayDates(y + 1)].map(
    toYMD,
  );
  return list.includes(ymd);
}

/* ────────────────────────────────────────────────────────────────────────────
   COMPONENTE: HolidayToast
   Toast centrado entre CIERRE y PROMEDIO con estilo “error”:
     - Ícono circular rojo
     - Mensaje principal + subtítulo
     - Botón “×” (opcional) para cerrar manualmente
     - Barra de progreso inferior (visual); el cierre real lo controla el padre
   Props:
     - show: boolean  → controla visibilidad (con animación)
     - onClose?: fn   → callback del botón cerrar
     - duration=6000  → duración de la barra en ms (solo aspecto visual)
   Accesibilidad:
     - role="status" aria-live="polite" (lectores de pantalla anuncian contenido)
   ──────────────────────────────────────────────────────────────────────────── */
function HolidayToast({ show, onClose, duration = 6000 }) {
  // Porcentaje de la barra de progreso (0..100)
  const [pct, setPct] = React.useState(0);
  // Al cambiar `show`, reinicia/arranca animación de progreso basada en RAF
  React.useEffect(() => {
    if (!show) {
      setPct(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setPct(t * 100);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [show, duration]);

  return (
    <div
      className={`
        hidden sm:flex
        absolute left-1/2 -translate-x-1/2
        top-1/2 -translate-y-1/2
        z-40
        w-auto max-w-md
        rounded-xl bg-[#0f1115] border border-neutral-800/80
        shadow-[0_18px_50px_-20px_rgba(0,0,0,.6)]
        text-[14px] text-neutral-100
        px-4 py-3 pr-10
        overflow-hidden
        transition-all duration-400
        ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Ícono circular rojo (semántica “error/alerta”) */}
      <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/15 text-red-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 8a1 1 0 011 1v4a1 1 0 01-2 0V9a1 1 0 011-1zm0 10a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
          <path d="M10.29 3.86a2 2 0 013.42 0l8.47 14.14A2 2 0 0120.47 21H3.53a2 2 0 01-1.71-2.99L10.29 3.86zM12 5.6L4.25 19h15.5L12 5.6z" />
        </svg>
      </div>

      {/* Mensaje + subtítulo */}
      <div className="mr-2">
        <div className="font-medium leading-snug">Día festivo en Estados Unidos</div>
        <div className="text-xs text-neutral-300/85">solo next day</div>
      </div>

      {/* Botón cerrar (opcional) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded p-1 text-neutral-400 hover:text-neutral-100 hover:bg-white/5 transition"
          aria-label="Cerrar"
          title="Cerrar"
        >
          ×
        </button>
      )}

      {/* Barra de progreso (visual) */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-red-600/20">
        <div
          className="h-1 bg-red-500 transition-[width] duration-75"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
/* ────────────────────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL: LandingPage
   - Obtiene datos en vivo desde useWebSocketData().
   - Muestra el toast (HolidayToast) centrado, abre ambas tarjetas laterales y
     el gráfico principal debajo.
   - Controla visibilidad del toast con timers (auto-mostrar y auto-ocultar).
   ──────────────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  // 1) Datos en vivo agregados por id
  const { dataById } = useWebSocketData();
  // 2) Métricas principales del panel central (id “1007”: close & avg)
  const promedio = dataById['1007'];
  // 3) Estado del toast (visible/oculto)
  const [showHoliday, setShowHoliday] = React.useState(false);
    // 4) Duración del toast:
  //    - Valor actual: 180_000 ms = 3 minutos.
  //    - Si quieres 1 minuto exacto, usa 60_000.
  const TOAST_DURATION = 180_000; // 3 minutos (ajusta a 60_000 para 1 minuto)
  // 5) Efecto para mostrar el toast al cargar y cerrarlo automáticamente:
  //    - Se muestra a los 150 ms (para no aparecer “en seco”)
  //    - Se oculta tras TOAST_DURATION
  //    - Limpia los timers al desmontar (buena práctica)
  React.useEffect(() => {
    // Mostrar y autocerrar
    const t1 = setTimeout(() => setShowHoliday(true), 150);
    const t2 = setTimeout(() => setShowHoliday(false), 150 + TOAST_DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [TOAST_DURATION]);

  return (
    <>
    {/* Navegación superior */}
      <NavBar />
      {/* Carrusel de banners/noticias */}
      <Carrousel />
    {/* Cuerpo (grid responsive): 8 cols en xl, 4 en lg, 1 en móvil */}
      <div className="bg-backgroundtwo">
        <div className="grid grid-cols-1 xl:grid-cols-8 lg:grid-cols-4 gap-6 w-full mx-auto p-1">
          {/* Columna izquierda: tarjetas/resúmenes */}
          <div className="xl:col-span-2 lg:col-span-1">
            <SectionCards />
          </div>

          {/* Columna central: métricas + gráfico */}
          <div className="xl:col-span-4 xl:col-start-3 lg:grid-cols-2 lg:col-span-2 lg:col-start-2 top-8">
            {/* Bloque superior: CIERRE / PROMEDIO con el toast centrado */}
            <div
              className={`
                relative flex flex-col sm:flex-row justify-center items-center
                px-1
                transition-[gap] duration-500
                ${showHoliday ? 'gap-6 sm:gap-40' : 'gap-6 sm:gap-20'}
              `}
              style={{ minHeight: 120 }}
            >
              {/* Toast centrado (se controla desde el state showHoliday) */}
              <HolidayToast show={showHoliday} onClose={() => setShowHoliday(false)} duration={TOAST_DURATION} />

              {/* Tarjeta: CIERRE */}
              <Card
                className={`
                  min-w-[230px] w-auto flex-shrink-0 h-28
                  flex flex-col justify-start pt-4 items-center
                  text-green-600 bg-custom-colortwo border-none
                  transition-transform duration-500
                  ${showHoliday ? 'sm:-translate-x-24' : 'sm:translate-x-0'}
                `}
              >
                <h3 className="text-xl text-white">CIERRE</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">
                  {/* Si no hay datos, muestra “-” en lugar de romper */}
                  {promedio?.close || '-'}</h1>
              </Card>

             {/* Tarjeta: PROMEDIO */}
              <Card
                className={`
                  min-w-[230px] w-auto flex-shrink-0 h-28
                  flex flex-col justify-start pt-4 items-center
                  text-red-600 bg-custom-colortwo border-none
                  transition-transform duration-500
                  ${showHoliday ? 'sm:translate-x-24' : 'sm:translate-x-0'}
                `}
              >
                <h3 className="text-xl text-white">PROMEDIO</h3>
                <h1 className="text-5xl font-bold mt-0 leading-1">{promedio?.avg || '-'}</h1>
              </Card>
            </div>
          {/* Gráfico principal (crece bajo el bloque de métricas) */}
            <div className="lg:row-span-4">
              <DollarChart />
            </div>
          </div>

         {/* Columna derecha: últimas transacciones y notificaciones */}
          <div className="xl:col-span-2 xl:col-start-7 lg:col-span-1 lg:col-start-4">
            <SectionCardsRight />
          </div>
        </div>
      </div>
    {/* Sección informativa + Pie de página */}
      <InfoPage />
      <FooterPage />
    </>
  );
}
