/**
 * ModalFiltros.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 * 
 * Modal de filtros para las secciones de estadísticas (IMCs/CLIENTES).
 * Permite seleccionar múltiples valores para **Mercado**, **Moneda** y **Plazo**
 * con la convención de  **Todos** como estado no-filtrado.
 * 
 * Funcionalidades clave:
 *  - Carga dinámica de opciones válidas desde backend según `tipoActivo` (1 = IMCs, 2 = CLIENTES)
 *  - Normaliza/Inyecta la opción "Todos" y limpia `formData` para evitar valores invalidos.
 *  - Interfaz con checkboxes multi-selección y resaltado de selección.
 *  - Botones **Guardar** (propaga filtros al padre) y **Cancelar** (cierra modal)
 *  - Accesible: `role=dialog`, `aria-modal="true"`, overlay con `backdrop-blur`
 *  
 * Props:
 *  - formData: {merc: string[], moneda: string[], plazo: string[] }
 *  - setFormData: React.Dispatch para actualizar `formData` (controlado por el padre)
 *  - tipoActivo: "IMCs" | "CLIENTES" (determina sector: 1 o 2 para la API)
 *  - handleGuardar: (data) => Promise<void> | void (acción al confirmar)
 *  - cargando: boolean (deshabilita botones cuando hay una acción en progreso)
 *  - cerrar: () => void (cierra el modal)
 * 
 * Dependencias:
 *  - `fetchFiltrosDesdeDatos(sector:number, fecha:string)` -> {mercados: string[], monedas: string[], plazos: string[] }
 * 
 * Convenciones:
 *  - Si se selecciona **"Todos"** en un campo, se ignoran otras selecciones en ese campo.
 *  - Si se deselecciona todo, se restablece a **"Todos"** para evitar estado vacío.
 */

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
  // Opciones válidas traídas desde backend
  const [opciones, setOpciones] = useState({
    mercados: [],
    monedas: [],
    plazos: [],
  });

  /**
   * Carga de opciones desde backend cada vez que cambia `tipoActivo`.
   *  - Determina `sector` (1 IMCs / 2 CLIENTES)
   *  - Pide filtros a la API y los normaliza agregando "Todos" al inicio
   *  - Limpia el `formData` para asegurar que solo contenga valores válidos
   */
  useEffect(() => {
    let cancelado = false;

    if (!tipoActivo) return;

    const fetchData = async () => {
      const sector = tipoActivo.toUpperCase() === "IMCS" ? 1 : 2; // Nota: "IMCS"
      const fecha = new Date().toISOString().split("T")[0];

      const filtros = await fetchFiltrosDesdeDatos(sector, fecha);
      if (cancelado) return;

      // Validación defensiva ante payload incompleto
      if (
        !filtros.mercados.length ||
        !filtros.monedas.length ||
        !filtros.plazos.length
      ) {
        // Filtros incompletos: no se actualiza el estado
        return;
      }

      // Inyecta "Todos" como primera opción en cada grupo
      const nuevosFiltros = {
        mercados: ["Todos", ...filtros.mercados],
        monedas: ["Todos", ...filtros.monedas],
        plazos: ["Todos", ...filtros.plazos],
      };

      setOpciones(nuevosFiltros);

      // Limpieza de formData actual para eliminar valores no válidos
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
  }, [tipoActivo, setFormData]);

  /**
   * Maneja la selección de cada checkbox aplicando la convención de "Todos".
   *  - Si se elige "Todos", se resetea el campo a ["Todos"].
   *  - Si se selecciona otro valor, se quita "Todos" del arreglo.
   *  - Si el arreglo queda vacío, vuelve a ["Todos"]. 
   */
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

  /**
   * Renderiza un bloque de selección para un campo dado:
   *  - label: etiqueta visible ("Mercado", "Moneda", "Plazo")
   *  - campo: key en formData ("merc" | "moneda" | "plazo")
   *  - valores: opciones disponibles (Array de strings)
   */
  const renderCampo = (label, campo, valores) => (
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>

      {/* Resumen de selección actual */}
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
        {/* Header del modal */}
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

        {/* Contenido scrollable */}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 space-y-6">
          {renderCampo("Mercado", "merc", opciones.mercados)}
          {renderCampo("Moneda", "moneda", opciones.monedas)}
          {renderCampo("Plazo", "plazo", opciones.plazos)}
        </div>

        {/* Footer de acciones */}
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