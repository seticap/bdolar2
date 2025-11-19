"use client";

import Navbar from "../components/NavBar";
import React from "react";
import EpaycoButton from "./EpaycoButton";

const PromoPage = () => {
  return (
    <>
      <Navbar />
      <div className="bg-backgroundtwo min-h-screen flex flex-col items-center py-10">
        {/* Titulo */}
        <div className="max-w-4xl mx-auto text-center py-5 px-4">
          <p className="text-2xl md:text-3xl font-bold text-white mb-2 mt-2">
            Tenemos un plan,
          </p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-8 md:mb-12">
            pensamos en ti y tu futuro
          </p>
        </div>

        {/* Contenedor de tarjetas */}
        <div className="w-full px-20">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-4 xl:gap-0 justify-center lg:justify-evenly items-center">
              {/* Tarjeta Trimestral */}
              <div className="group relative overflow-hidden h-[250px] sm:h-[400px] w-full sm:w-[300px] bg-white rounded-2xl shadow-lg lg:shadow-2xl border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-xl lg:hover:shadow-2xl cursor-pointer">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="/images/companeros-trabajo-negocios-dandose-mano-reunion-oficina-foco-hombre-negocios-1-scaled.jpg"
                  alt="PlanTrimestral"
                />

                {/* Overlay inicial PLAN TRIMESTRAL */}
                <div className="absolute inset-0 bg-card-color bg-opacity-40 flex flex-col justify-center items-center p-6 transition-opacity duration-500 group-hover:opacity-0 rounded-lg">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    PLAN
                  </h3>
                  <p className="text-xl sm:text-2xl font-semibold text-white">
                    TRIMESTRAL
                  </p>
                </div>

                {/* Overlay detalle (AQUÍ ESTABA EL PROBLEMA) */}
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">
                    Beneficios Trimestrales
                  </h3>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base text-white">
                    <li>✦ Informacion en tiempo real.</li>
                    <li>✦ 1 Usuario</li>
                    <li>✦ Soporte gratuito</li>
                    <EpaycoButton
                      name="Dólar SET-FX | Trimestral"
                      amount={591513}
                      tax={94443}
                      taxBase={497070}
                    />
                  </ul>
                </div>
              </div>

              {/* Tarjeta Semestral */}
              <div className="group relative overflow-hidden h-[250px] sm:h-[400px] w-full sm:w-[300px] bg-white rounded-2xl shadow-lg lg:shadow-2xl border border-amber-400 transition-all duration-500 hover:scale-105 hover:shadow-xl lg:hover:shadow-2xl cursor-pointer">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="/images/ms-finance-1024x640.jpg"
                  alt="PlanSemestral"
                />

                <div className="absolute inset-0 bg-card-color bg-opacity-40 flex flex-col justify-center items-center p-6 transition-opacity duration-500 group-hover:opacity-0 rounded-lg">
                  <h3 className="text-2xl sm:text-3xl font-bold text-amber-300 mb-2">
                    PLAN
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-amber-300">
                    SEMESTRAL
                  </p>
                </div>

                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-amber-500 text-center">
                    Beneficios Semestral
                  </h3>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base md:text-lg m-auto text-white">
                    <li>✦ Informacion en tiempo real.</li>
                    <li>✦ 1 Usuario</li>
                    <li>✦ Soporte gratuito</li>
                    <EpaycoButton
                      name="Dólar SET-FX | Semestral"
                      amount={1097087}
                      tax={175165}
                      taxBase={921922}
                    />
                  </ul>
                </div>
              </div>

              {/* Tarjeta Anual */}
              <div className="group relative overflow-hidden h-[250px] sm:h-[400px] w-full sm:w-[300px] bg-white rounded-2xl shadow-lg lg:shadow-2xl border border-gray-200 transition-all duration-500 hover:scale-105 hover:shadow-xl lg:hover:shadow-2xl cursor-pointer">
                <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  src="/images/negocios-que-funcionan-solos-y-requieren-poca-inversion-01.jpg"
                  alt="PlanAnual"
                />

                <div className="absolute inset-0 bg-card-color bg-opacity-40 flex flex-col justify-center items-center p-6 transition-opacity duration-500 group-hover:opacity-0 rounded-lg">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    PLAN
                  </h3>
                  <p className="text-xl sm:text-2xl font-semibold text-white">
                    ANUAL
                  </p>
                </div>

                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center text-white">
                    Beneficios Anuales
                  </h3>
                  <ul className="text-left space-y-2 sm:space-y-3 text-sm sm:text-base text-white">
                    <li>✦ Informacion en tiempo real.</li>
                    <li>✦ 1 Usuario</li>
                    <li>✦ Soporte gratuito</li>
                    <EpaycoButton
                      name="Dólar SET-FX | Anualidad"
                      amount={2013729}
                      tax={321520}
                      taxBase={1692209}
                    />
                  </ul>
                </div>
              </div>

              <div
                className="grid"
                style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}
              ></div>
            </div>

            {/* Pie de página */}
            <div className="py-8 md:py-12">
              <div className="border-b mx-auto max-w-3xl"></div>
              <div className="text-center text-white font-bold text-xl sm:text-2xl mt-4">
                SUSCRIPCIONES DÓLAR SET-FX
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PromoPage;
