"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewsPage from "./NewsPage";
import { useInfoData } from "../services/InfoDataProvider";
import { MiniChart } from "./MiniChart";

const InfoPage = () => {
  const { empresas, indices } = useInfoData();

  return (
    <div className="w-full grid grid-cols-6 px-3 py-5 bg-backgroundtwo">
      {/* ÍNDICES - Mantenemos este Card ya que es diferente */}
      <div className="col-span-2">
        <Card className="bg-custom-colortwo text-white border-none h-[46vh] w-full pt-0">
          <CardHeader className="bg-red-700 flex justify-between items-center h-10">
            <CardTitle className="text-xl font-semibold">
              INDICE GENERAL BVC
            </CardTitle>
          </CardHeader>
          <div>
            <MiniChart />
          </div>
        </Card>
      </div>

      {/* NOTICIAS - Simplificamos eliminando el Card contenedor */}
        <div className="col-span-4 p-0 pl-2 mr-0 w-full">
            <Card className="bg-custom-colortwo text-white border-none h-auto min-h-[46vh]">
                <CardHeader className="bg-red-700 flex justify-between items-center mt-[-24px] h-8 sm:h-10">
                    <CardTitle className="text-sm sm:text-xl font-semibold">
                        NOTICIAS ACTUALES
                    </CardTitle>
                    <img src="images/larepublica.png" alt="LR" className="h-4 sm:h-6" />
                </CardHeader>
                <CardContent className="h-full overflow-y-auto max-h-[calc(100%-40px)] scrollbar-custom">
                    <NewsPage />
                </CardContent>
            </Card>
        </div>
    </div>
  );
};

export default InfoPage;