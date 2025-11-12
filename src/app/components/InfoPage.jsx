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
      <div className="col-span-4 p-0 pl-2 mr-0 w-full h-full">
        <NewsPage />
      </div>
    </div>
  );
};

export default InfoPage;