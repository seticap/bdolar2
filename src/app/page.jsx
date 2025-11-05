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



function nthDow(year, month, dow, n) {
  const first = new Date(year, month, 1);
  const delta = ((7 + dow - first.getDay()) % 7) + (n - 1) * 7;
  return new Date(year, month, 1 + delta);
}


function lastDow(year, month, dow) {
  const last = new Date(year, month + 1, 0);
  const delta = (7 + last.getDay() - dow) % 7;
  return new Date(year, month + 1, 0 - delta);
}


function observed(d) {
  const out = new Date(d);
  if (d.getDay() === 0) out.setDate(d.getDate() + 1);
  if (d.getDay() === 6) out.setDate(d.getDate() - 1);
  return out;
}

function usFederalHolidayDates(year) {
  return [
    observed(new Date(year, 0, 1)),  
    nthDow(year, 0, 1, 3),            
    nthDow(year, 1, 1, 3),            
    lastDow(year, 4, 1),           
    observed(new Date(year, 5, 19)),  
    observed(new Date(year, 6, 4)),   
    nthDow(year, 8, 1, 1),            
    nthDow(year, 9, 1, 2),            
    observed(new Date(year, 10, 11)), 
    nthDow(year, 10, 4, 4),           
    observed(new Date(year, 11, 25)), 
  ];
}

function isUsFederalHoliday(date = new Date()) {
  const y = date.getFullYear();
  const ymd = toYMD(date);
  const list = [...usFederalHolidayDates(y - 1), ...usFederalHolidayDates(y), ...usFederalHolidayDates(y + 1)].map(
    toYMD,
  );
  return list.includes(ymd);
}

function HolidayToast({ show, onClose, duration = 6000 }) {
  const [pct, setPct] = React.useState(0);
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
      <div className="mr-3 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/15 text-red-500">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 8a1 1 0 011 1v4a1 1 0 01-2 0V9a1 1 0 011-1zm0 10a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" />
          <path d="M10.29 3.86a2 2 0 013.42 0l8.47 14.14A2 2 0 0120.47 21H3.53a2 2 0 01-1.71-2.99L10.29 3.86zM12 5.6L4.25 19h15.5L12 5.6z" />
        </svg>
      </div>
      <div className="mr-2">
        <div className="font-medium leading-snug">Día festivo en Estados Unidos</div>
        <div className="text-xs text-neutral-300/85">solo next day</div>
      </div>

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
export default function LandingPage() {
  const { dataById } = useWebSocketData();
  const promedio = dataById['1007'];
  const [showHoliday, setShowHoliday] = React.useState(false);
  const TOAST_DURATION = 180_000;
  React.useEffect(() => {
    const t1 = setTimeout(() => setShowHoliday(true), 150);
    const t2 = setTimeout(() => setShowHoliday(false), 150 + TOAST_DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [TOAST_DURATION]);

  return (
    <>
      <NavBar />
      <CarrouselEmpresas />
      <div className="bg-backgroundtwo">
        <div className="grid xl:grid-cols-6 w-full mx-auto p-1">
          <div className="xl:col-span-1">
            <SectionCards />
          </div>
          <div className="xl:col-span-4 xl:col-start-3 lg:grid-cols-2 lg:col-span-2 lg:col-start-2 top-8">
            <div
              className={`
                relative flex flex-col sm:flex-row justify-center items-center
                px-1
                transition-[gap] duration-500
                ${showHoliday ? 'gap-6 sm:gap-40' : 'gap-6 sm:gap-20'}
              `}
              style={{ minHeight: 120 }}
            >
              <HolidayToast show={showHoliday} onClose={() => setShowHoliday(false)} duration={TOAST_DURATION} />

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
                  {promedio?.close || '-'}</h1>
              </Card>
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
            <div className="lg:row-span-4">

              <DollarChart />
            </div>
          </div>

          <div className="col-span-1 xl:col-start-6">
            <SectionCardsRight />
          </div>
        </div>
      </div>
      <InfoPage />
      <FooterPage />
    </>
  );
}
