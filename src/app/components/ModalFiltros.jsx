import React, { useEffect, useState } from "react";
import { fetchFiltrosDesdeDatos } from "../services/estadisticasService";

const ModalFiltros = ({
  formData,
  setFormData,
  tipoActivo,
  handleGuardar,
  cargando,
  cerrar,
}) => {
  const [opciones, setOpciones] = useState({
    mercados: [],
    monedas: [],
    plazos: [],
  });

  useEffect(() => {
    let cancelado = false;

    if (!tipoActivo) return;

    const fetchData = async () => {
      const sector = tipoActivo.toUpperCase() === "IMCS" ? 1 : 2;
      const fecha = new Date().toISOString().split("T")[0];

      const filtros = await fetchFiltrosDesdeDatos(sector, fecha);
      if (cancelado) return;

      if (
        !filtros.mercados.length ||
        !filtros.monedas.length ||
        !filtros.plazos.length
      ) {
        console.warn("⚠️ Filtros incompletos del backend. Se omite carga.");
        return;
      }
      console.log("🧪 Filtros recibidos:", filtros);

      const nuevosFiltros = {
        mercados: ["Todos", ...filtros.mercados],
        monedas: ["Todos", ...filtros.monedas],
        plazos: ["Todos", ...filtros.plazos],
      };

      setOpciones(nuevosFiltros);

      // 🧼 Limpieza de formData para evitar valores fantasmas
      setFormData((prev) => ({
        merc: prev.merc.filter((m) => nuevosFiltros.mercados.includes(m)),
        moneda: prev.moneda.filter((m) => nuevosFiltros.monedas.includes(m)),
        plazo: prev.plazo.filter((p) => nuevosFiltros.plazos.includes(p)),
      }));
    };

    fetchData();

    return () => {
      cancelado = true;
    };
  }, [tipoActivo]);

  const handleCheck = (campo, valor) => {
    setFormData((prev) => {
      let nuevos = [...prev[campo]];

      if (valor === "Todos") {
        nuevos = ["Todos"];
      } else {
        nuevos = nuevos.includes(valor)
          ? nuevos.filter((v) => v !== valor)
          : [...nuevos.filter((v) => v !== "Todos"), valor];

        if (nuevos.length === 0) nuevos = ["Todos"];
      }

      return { ...prev, [campo]: nuevos };
    });
  };

  const renderCampo = (label, campo, valores) => (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      <small className="text-gray-400 mb-2 block">
        {formData[campo].join(", ")}
      </small>
      <div className="grid grid-cols-3 gap-3">
        {valores.map((op) => (
          <label
            key={op}
            className={`flex items-center space-x-2 px-3 py-1 rounded cursor-pointer transition-colors ${
              formData[campo].includes(op)
                ? "bg-[#2d2d3a] border border-red-500"
                : "bg-[#1f1f2b] hover:bg-[#2b2b3d]"
            }`}
          >
            <input
              type="checkbox"
              className="accent-red-600"
              checked={formData[campo].includes(op)}
              onChange={() => handleCheck(campo, op)}
            />
            <span>{op}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-gradient-to-br from-[#1c1c25] to-[#101018] text-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-[#2d2d3a] flex justify-between items-center">
          <h3 className="text-xl font-bold">Editar Filtros - {tipoActivo}</h3>
          <button
            onClick={cerrar}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6">
          {renderCampo("Mercado", "merc", opciones.mercados)}
          {renderCampo("Moneda", "moneda", opciones.monedas)}
          {renderCampo("Plazo", "plazo", opciones.plazos)}
        </div>

        <div className="px-6 py-4 border-t border-[#2d2d3a] flex flex-col sm:flex-row justify-center sm:justify-end gap-4">
          <button
            onClick={cerrar}
            disabled={cargando}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-5 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleGuardar(formData)}
            disabled={cargando}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded"
          >
            {cargando ? "Cargando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFiltros;
