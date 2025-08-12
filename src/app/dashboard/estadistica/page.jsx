/**
 * EstadisticasPage.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Pagina principal de la sección de estadísticas del dashboard.
 *  Renderiza el componente de contenido `<Estadisticas/>` y un `<Footer/>` al f
 *  Se utiliza dentro del Layout general del dashboard.
 * 
 *  Características:
 *    - Usa diseño flexible (`flex-col`) para alinear contenido verticalmente.
 *    - Asegura que el `<Footer/>` se mantenga al fondo incluso si el contenido es corto.
 *    - Aplica estilos oscuros de fondo y texto blanco al `<main>`.
 * 
 *  Componentes utilizados:
 *    -`<Estadisticas/>`: componente de vista que contiene Las estadísticas del mercado
 *    - `<Footer/>`: pie de pagina reutilizable para todo el dashboard
 */

'use client';

import Footer from '../../components/Footer';
import Estadisticas from '../../components/Estadisticas';

export default function EstadisticasPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/**Contenido principal: estadisticas */}
      <main className="flex-grow bg-[#0c0c14] text-white">
        <Estadisticas />
      </main>
      {/**Pie de página */}
      <Footer />
    </div>
  );
}