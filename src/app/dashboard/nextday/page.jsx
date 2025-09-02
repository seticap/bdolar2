// src/app/dashboard/nexday/page.jsx
import Footer from '../../components/Footer';
import PrincesPanel from '../../components/PrincesPanel';
import { SectionCards } from '../../components/section-cards';
import NewsPage from '../../components/NewsPage';

export default function NexdayPage() {
  return (
    <div className="min-h-screen flex flex-col">
   
      <main className="flex-grow bg-[#0c0c14] text-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6 py-6">
          {/* En lg+ la grilla tiene 3 columnas; izq ocupa 2 y der 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* IZQUIERDA: cards + gráfico */}
            <div className="lg:col-span-2 space-y-6">
              <SectionCards />
              <PrincesPanel height={520} />
            </div>

            {/* DERECHA: noticias (misma altura visual que el gráfico) */}
            <aside className="lg:col-span-1">
              <NewsPage height={520} />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
