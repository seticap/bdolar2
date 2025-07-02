"use client";

import Navbar from "@/components/Navbar";
import { SectionCards } from "@/components/section-cards";
import React from "react";
import { Card } from "@/components/ui/card";
import { SectionCardsRight } from "@/components/section-cards-right";
import PromoPage from "./dashboard/PromoPage";
import InfoPage from "./information/InfoPage";
import FooterPage from "@/components/Footer";
import WSLiveView from "@/componentServer/WSLiveView";
import { useWebSocketData } from "@/componentServer/WebSocketDataContext";

const LandingPage = () => {
  const { dataById } = useWebSocketData();
  const promedio = dataById[1007]?.data || {};

  return (
    <>
      <Navbar />
      <div className="h-full bg-backgroundtwo">
        {/* Contenedor Principal con Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full mx-auto p-4">
          {/* Columna Izquierda (Sección 1) - Ocupa toda la altura en móvil, 1 columna en desktop */}
          <div className="lg:col-span-1 lg:row-span-5 row-span-1">
            <SectionCards />
          </div>

          {/* Columna Central (Secciones 3 y 4) - Ocupa 3 columnas en desktop */}
          <div className="lg:col-span-3 lg:col-start-2 lg:row-start-1 top-8">
            {/* Sección 3 (Cards de Cierre y Promedio) */}
             <div className="flex flex-col sm:flex-row justify-center sm:justify-evenly items-center gap-6 sm:gap-16 px-4 ">
               <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-center items-center text-green-600 bg-custom-colortwo border-none">
                 <h3 className="text-xl text-white">CIERRE</h3>
                 <h1 className="text-5xl font-bold tracking-tight">
                   {promedio.close || "-"}
                 </h1>
               </Card>

               <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-center items-center text-red-600 bg-custom-colortwo border-none">
                 <h3 className="text-xl text-white">PROMEDIO</h3>
                 <h1 className="text-5xl font-bold tracking-tight">
                   {promedio.avg || "-"}
                 </h1>
               </Card>
             </div>

            {/* Sección 4 (Gráfico) */}
            <div className="lg:row-span-4 ">
              <WSLiveView />
            </div>
          </div>

          {/* Columna Derecha (Sección 2) - Ocupa 1 columna en desktop, aparece después en móvil */}
          <div className="lg:col-span-1 lg:col-start-5 lg:row-span-5">
            <SectionCardsRight />
          </div>
        </div>
      </div>
      <PromoPage />
      <InfoPage />
      <FooterPage />
    </>
  );
};

export default LandingPage;







// "use client";

// import Navbar from "@/components/Navbar";
// import { SectionCards } from "@/components/section-cards";

// import React from "react";
// import { Card } from "@/components/ui/card";
// import { SectionCardsRight } from "@/components/section-cards-right";
// import PromoPage from "./dashboard/PromoPage";
// import InfoPage from "./information/InfoPage";
// import FooterPage from "@/components/Footer";
// import WSLiveView from "@/componentServer/WSLiveView";
// // import TokenTester from "@/componentServer/TokenTester";
// import { useWebSocketData } from "@/componentServer/WebSocketDataContext";

// const LandingPage = () => {
//   const { dataById } = useWebSocketData();
//   const promedio = dataById[1007]?.data || {};

//   return (
//     <>
//       <Navbar />
//       <div className="h-full bg-backgroundtwo">
//         {/* Contenedor Principal */}
//         <div className="flex flex-col lg:flex-row gap-6 w-full mx-auto">
//           {/* Contenedor Izquierdo */}
//           <div className="flex-1 flex flex-col gap-6">
//             <div className="p-3">
//               <div className="flex flex-row gap-4 ">
//                 <SectionCards />
//               </div>
//             </div>
//           </div>

//           {/* Columna Central */}
//           <div className="flex-1 flex flex-col gap-6">
//             {/* Cards de Cierre y Promedio */}
//             <div className="flex flex-col sm:flex-row justify-center sm:justify-evenly items-center gap-6 sm:gap-16 px-4 py-4">
//               <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-center items-center text-green-600 bg-custom-colortwo border-none">
//                 <h3 className="text-xl text-white">CIERRE</h3>
//                 <h1 className="text-5xl font-bold tracking-tight">
//                   {promedio.close || "-"}
//                 </h1>
//               </Card>

//               <Card className="sm:min-w-[270px] w-full sm:w-auto flex-shrink-0 h-28 flex flex-col justify-center items-center text-red-600 bg-custom-colortwo border-none">
//                 <h3 className="text-xl text-white">PROMEDIO</h3>
//                 <h1 className="text-5xl font-bold tracking-tight">
//                   {promedio.avg || "-"}
//                 </h1>
//               </Card>
//             </div>

//             {/* Gráfico */}
//             <div className="w-full -mt-10">
//               <WSLiveView />
//             </div>
//           </div>

//           {/* Contenedor Derecho */}
//           <div className="flex-1 flex flex-col gap-6 mt-3">
//             <div className="w-full">
//               <SectionCardsRight />
//             </div>
//           </div>
//         </div>
//         {/* <TokenTester /> */}
//       </div>
//       <PromoPage />
//       <InfoPage />
//       <FooterPage />
//     </>
//   );
// };

// export default LandingPage;
