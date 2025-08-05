"use client";
import React, { useState, useEffect } from "react";
import {
  fetchEstadisticasAPI,
  fetchFiltrosDesdeDatos,
} from "../services/estadisticasService";
import ModalFiltros from "./ModalFiltros";
import CardEstadistica from "./CardEstadistica";

const opcionesMercado = [
  "Todos",
  "SPOT",
  "FORWARD",
  "NEXT DAY",
  "FIX",
  "IRS",
  "OPCION",
];

const mapMoneda = {
  "USD/COP": 1,
  "EUR/COP": 2,
  "EUR/USD": 3,
  "USD/EUR": 4,
  "USD/JPY": 5,
  "GBP/USD": 6,
  "USD/BRL": 7,
  "USD/CAD": 8,
  "USD/MXN": 9,
  "USD/AUD": 10,
  "GBP/COP": 11,
};

const opcionesPlazo = [
  "Todos",
  "0",
  "0 - 1 mes",
  "1 - 3 meses",
  "3 - 6 meses",
  "mayores a 6 meses",
];

const Estadisticas = () => {
  const [filas, setFilas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tipoActivo, setTipoActivo] = useState("");

  const [formDataIMCs, setFormDataIMCs] = useState({
    merc: ["Todos"],
    moneda: ["Todos"],
    plazo: ["Todos"],
  });
  const [formDataClientes, setFormDataClientes] = useState({
    merc: ["Todos"],
    moneda: ["Todos"],
    plazo: ["Todos"],
  });
  const [filasIMCs, setFilasIMCs] = useState([]);
  const [filasClientes, setFilasClientes] = useState([]);

  useEffect(() => {
    const init = async () => {
      const imcs = JSON.parse(localStorage.getItem("filtrosIMCs") || "{}");
      const clientes = JSON.parse(
        localStorage.getItem("filtrosClientes") || "{}"
      );

      const normalize = (value) =>
        Array.isArray(value) ? value : [value ?? "Todos"];

      let formIMCs = {
        merc: normalize(imcs.merc),
        moneda: normalize(imcs.moneda),
        plazo: normalize(imcs.plazo),
      };

      let formClientes = {
        merc: normalize(clientes.merc),
        moneda: normalize(clientes.moneda),
        plazo: normalize(clientes.plazo),
      };

      // 🧼 Limpiar valores no válidos según API
      const fecha = new Date().toISOString().split("T")[0];

      const filtrosIMC = await fetchFiltrosDesdeDatos(1, fecha);
      const filtrosCLI = await fetchFiltrosDesdeDatos(2, fecha);

      const withTodos = (arr) => ["Todos", ...arr];

      const limpiar = (f, valid) => ({
        merc: f.merc.filter((m) => withTodos(valid.mercados).includes(m)),
        moneda: f.moneda.filter((m) => withTodos(valid.monedas).includes(m)),
        plazo: f.plazo.filter((p) => withTodos(valid.plazos).includes(p)),
      });

      formIMCs = limpiar(formIMCs, filtrosIMC);
      formClientes = limpiar(formClientes, filtrosCLI);

      setFormDataIMCs(formIMCs);
      setFormDataClientes(formClientes);

      // ✅ Cargar datos con filtros limpios
      cargarDatos(formIMCs, formClientes);
    };

    init();
  }, []);

  const obtenerFiltros = (data) => {
    const filtros = {};

    if (!data.merc.includes("Todos")) {
      filtros["Merc."] = data.merc;
    }

    if (!data.moneda.includes("Todos")) {
      const monedas = data.moneda
        .map((m) => mapMoneda[m])
        .filter((id) => typeof id === "number");

      if (monedas.length > 0) {
        // Si la API solo acepta un valor:
        filtros["Moneda"] = monedas[0];
      }
    }

    if (!data.plazo.includes("Todos")) {
      filtros["Plazo"] = data.plazo;
    }

    return filtros;
  };

  const handleGuardar = async (filtrosActualizados) => {
    setCargando(true);
    const fecha = new Date().toISOString().split("T")[0];
    const filtrosBackend = obtenerFiltros(filtrosActualizados);
    const tipoID = tipoActivo === "IMCs" ? 1 : 2;

    try {
      const nuevosDatos = await fetchEstadisticasAPI(
        tipoID,
        fecha,
        filtrosBackend
      );
      const nuevos = mapToUI(nuevosDatos, tipoActivo);

      const nuevosFiltrados = nuevos.filter((fila) => {
        const m1 =
          filtrosActualizados.merc.includes("Todos") ||
          filtrosActualizados.merc.includes(fila.merc);
        const m2 =
          filtrosActualizados.moneda.includes("Todos") ||
          filtrosActualizados.moneda.includes(fila.moneda);
        const m3 =
          filtrosActualizados.plazo.includes("Todos") ||
          filtrosActualizados.plazo.includes(fila.plazo);
        return m1 && m2 && m3;
      });

      if (tipoActivo === "IMCs") {
        setFormDataIMCs(filtrosActualizados);
        localStorage.setItem(
          "filtrosIMCs",
          JSON.stringify(filtrosActualizados)
        );
        setFilasIMCs(nuevosFiltrados);
      } else {
        setFormDataClientes(filtrosActualizados);
        localStorage.setItem(
          "filtrosClientes",
          JSON.stringify(filtrosActualizados)
        );
        setFilasClientes(nuevosFiltrados);
      }
    } catch (err) {
      console.error("❌ Error al aplicar filtros:", err);
    } finally {
      setMostrarModal(false);
      setCargando(false);
    }
  };

  const cargarDatos = async (
    filtrosIMCs = formDataIMCs,
    filtrosClientes = formDataClientes
  ) => {
    const fecha = new Date().toISOString().split("T")[0];

    const [imcs, clientes] = await Promise.all([
      fetchEstadisticasAPI(1, fecha, obtenerFiltros(filtrosIMCs)),
      fetchEstadisticasAPI(2, fecha, obtenerFiltros(filtrosClientes)),
    ]);

    setFilasIMCs(mapToUI(imcs, "IMCs"));
    setFilasClientes(mapToUI(clientes, "CLIENTES"));
  };

  const mapToUI = (datos, tipo) =>
    datos.map((dato, idx) => ({
      id: `api-${tipo}-${idx}`,
      tipo: tipo.toUpperCase(),
      merc: dato["Merc."] || "",
      moneda: dato["Moneda"] || "",
      plazo: dato["Plazo"] || "",
      monto: `$ ${Number(dato["Monto Acumulado"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      transacciones: Number(dato["No Trans."] || 0),
      max: `$ ${Number(dato["Precio máximo"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      min: `$ ${Number(dato["Precio mínimo"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      ultimo: `$ ${Number(dato["Monto último"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      precio: `$ ${Number(dato["Promedio"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      apertura: `$ ${Number(dato["Apertura"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      cierre: `$ ${Number(dato["Cierre"] || 0).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
      })}`,
      montoPromedio: `$ ${Number(dato["Monto promedio"] || 0).toLocaleString(
        "es-CO",
        { minimumFractionDigits: 2 }
      )}`,
      montoMinimo: `$ ${Number(dato["Monto mínimo"] || 0).toLocaleString(
        "es-CO",
        { minimumFractionDigits: 2 }
      )}`,
      montoMaximo: `$ ${Number(dato["Monto máximo"] || 0).toLocaleString(
        "es-CO",
        { minimumFractionDigits: 2 }
      )}`,
      fecha: dato["Fecha"] || "",
    }));

  return (
    <div className="bg-gradient-to-b from-[#20202c] to-[#1a1a26] text-white min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Estadísticas</h2>

        <div className="flex justify-center mt-2 mb-6">
          <button
            onClick={() => {
              const reset = {
                merc: ["Todos"],
                moneda: ["Todos"],
                plazo: ["Todos"],
              };
              setFormDataIMCs(reset);
              setFormDataClientes(reset);
              localStorage.removeItem("filtrosIMCs");
              localStorage.removeItem("filtrosClientes");
              cargarDatos(reset, reset);
            }}
            className="text-sm px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-medium"
          >
            Restablecer filtros
          </button>
        </div>

        <div className="space-y-10">
          {["IMCs", "CLIENTES"].map((tipo) => {
            const datosGrupo = tipo === "IMCs" ? filasIMCs : filasClientes;

            return (
              <div
                key={tipo}
                className="bg-white/5 backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <h3 className="text-red-500 text-2xl font-bold">{tipo}</h3>
                  <button
                    onClick={() => {
                      setTipoActivo(tipo);
                      setMostrarModal(true);
                    }}
                    className="bg-red-600 px-4 py-2 rounded hover:bg-green-500 text-sm font-semibold transition-colors"
                  >
                    Editar
                  </button>
                </div>

                {datosGrupo.length === 0 ? (
                  <p className="text-gray-400 italic text-center">
                    No hay datos para los filtros seleccionados.
                  </p>
                ) : (
                 <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-2">
                    {datosGrupo.map((fila, i) => (
                      <CardEstadistica key={fila.id || i} fila={fila} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {mostrarModal && (
        <ModalFiltros
          formData={tipoActivo === "IMCs" ? formDataIMCs : formDataClientes}
          setFormData={
            tipoActivo === "IMCs" ? setFormDataIMCs : setFormDataClientes
          }
          tipoActivo={tipoActivo}
          handleGuardar={handleGuardar}
          cargando={cargando}
          cerrar={() => setMostrarModal(false)}
        />
      )}
    </div>
  );
};



export default Estadisticas;
