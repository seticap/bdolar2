/**
 * Estadisticas.jsx
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  Componente de alto nivel para listar estadísticas de mercado
 *  segmentadas por **IMCs** y **CLIENTES**, con filtros persistentes.
 * 
 *  Principales responsabilidades
 *   - Cargar filtros (IMCs/CLIENTES) con `LocalStorage` para persistencia.
 *   - Construir el PayLoad de filtros esperando por la API (mapeo de monedas, etc.)
 *   - Consumir la API (`fethEstadisticasAPI`) y transformar respuesta -> UI (`mapToUI`)
 *   - Presentar los datos en tarjetas (`CardEstadistica`) y abrir un modal para editar filtros (`ModalFiltros`).
 *  
 *  Dependencias:
 *   - Services/estadisticasService: `fetchEstadisticasAPI`, `fetchFiltrosDesdeDatos`
 *   - Componentes: `ModalFiltros`, `CardEstadistica`
 * 
 *  Persistencia:
 *   - `LocalStorage`["filtrosIMCs"] y `LocalStorage["filtrosClientes"]` guardarn arrays de strings:
 *      {merc: string[], moneda: string[], plazo: string[]}
 * 
 *  Convenciones de filtros:
 *   - `"Todos"` significa "sin filtro" para ese campo.
 *   - Monedas del UI -> ID numérico para la API (ver `mapMoneda`).
 *  
 *  Estados: 
 *   - `formDataIMCs` / `formDataClientes` -> filtros vigentes para cada grupo
 *   - `FilasIMCs` / `filasClientes` -> datos transformados para UI
 *   - `MostrarModal`, `tipoActivo`, `cargando` -> control del modal y cargas
 */
"use client";
import React, { useState, useEffect } from "react";
import {
  fetchEstadisticasAPI,
  fetchFiltrosDesdeDatos,
} from "../services/estadisticasService";
import ModalFiltros from "./ModalFiltros";
import CardEstadistica from "./CardEstadistica";
/** Opciones de referencia (actualmente no usadas directamente  en el render)*/
const opcionesMercado = [
  "Todos",
  "SPOT",
  "FORWARD",
  "NEXT DAY",
  "FIX",
  "IRS",
  "OPCION",
];
/** Mapeo UI -> API para el campo Moneda.
 *  La Api espera un número; el UI muestra string
 */
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
/** Opciones de referencia para plazo (no usadas directamente en el render) */
const opcionesPlazo = [
  "Todos",
  "0",
  "0 - 1 mes",
  "1 - 3 meses",
  "3 - 6 meses",
  "mayores a 6 meses",
];

const Estadisticas = () => {
  /** Datos agregados (no usadis en el render directo- Legado) */
  const [filas, setFilas] = useState([]);
  // Modal de filtros
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [tipoActivo, setTipoActivo] = useState(""); //"IMCs" | "Clientes"

  // Filtros actuales(persisten en LocalStorage)
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
  //Filas (UI) por grupo
  const [filasIMCs, setFilasIMCs] = useState([]);
  const [filasClientes, setFilasClientes] = useState([]);
  /**
   *  Init:
   *  1) Lee filtros guardados (Imcs/Clientes) de localStorage y los normaliza a arrays.
   *  2) Pide a la API los filtros válidos actuales (mercados/monedas/plazos) por tipo (1=IMCs, 2=Clientes).
   *  3) Limpia filtros locales contra los validos de la API.
   *  4) Cargar datos inciales usando los filtros saneados.
   */
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

      // Fecha del dia (formato YYYY-MM-DD) - usada por endpoints
      const fecha = new Date().toISOString().split("T")[0];

      // Filtros válidos desde backend para cada tipo
      const filtrosIMC = await fetchFiltrosDesdeDatos(1, fecha);
      const filtrosCLI = await fetchFiltrosDesdeDatos(2, fecha);
      
      const withTodos = (arr) => ["Todos", ...arr];

      // Sanea valores locales contra lo permitido por la API
      const limpiar = (f, valid) => ({
        merc: f.merc.filter((m) => withTodos(valid.mercados).includes(m)),
        moneda: f.moneda.filter((m) => withTodos(valid.monedas).includes(m)),
        plazo: f.plazo.filter((p) => withTodos(valid.plazos).includes(p)),
      });

      formIMCs = limpiar(formIMCs, filtrosIMC);
      formClientes = limpiar(formClientes, filtrosCLI);

      setFormDataIMCs(formIMCs);
      setFormDataClientes(formClientes);

      //  Cargar inicial de datos (ambos grupos) con filtros limpios
      cargarDatos(formIMCs, formClientes);
    };

    init();
  }, []);
  
  /**
   *  Construye el objeto de filtros esperado por backend a partir del estado del UI:
   *   - Omite campos con "Todos"
   *   - Convierte Moneda (string) -> ID (número) y toma el primer valor si hay varios:
   */
  const obtenerFiltros = (data) => {
    const filtros = {};

    if (!data.merc.includes("Todos")) {
      filtros["Merc."] = data.merc; // La API acepta array para Merc.
    }

    if (!data.moneda.includes("Todos")) {
      const monedas = data.moneda
        .map((m) => mapMoneda[m])
        .filter((id) => typeof id === "number");

      if (monedas.length > 0) {
        // Algunas APIs solo acepta un ID de moneda
        filtros["Moneda"] = monedas[0];
      }
    }

    if (!data.plazo.includes("Todos")) {
      filtros["Plazo"] = data.plazo; // Según contrato, puede ser array
    }

    return filtros;
  };

  /**
   * Handler cuando el usuario guarda filtros en el modal:
   *  - Llama API con filtros backend-compatibles
   *  - Transforma respuesta a UI y filtra client-side (para coherencia visual)
   *  - Persiste filtros por tipo en LocalStorage 
   */

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

      // Filtro adicional en UI (por si la API devuelve extra)
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

  /**
   * Carga datos para ambos gruois (IMCs y CLIENTES) en paralelo.
   * Usa por defecto los filtros actuales en estado, pero admite overrides.
   */
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

  /** 
   * Transforma la respuesta cruda de API (nombres de columnas) a un objeto apto para UI.
   *  - Formatea numéricos a moneda local  ´es-CO´ con 2 decimales.
   *  - Inserta `id` estable basado en índice + tipo para key de React.
  */
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

        {/** Reset global de filtros (ambos grupos) */}
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

        {/** Secciones IMCs y CLIENTES */}
        <div className="space-y-10">
          {["IMCs", "CLIENTES"].map((tipo) => {
            const datosGrupo = tipo === "IMCs" ? filasIMCs : filasClientes;

            return (
              <div
                key={tipo}
                className="bg-white/5 backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6"
              >
                {/* Header sección */}
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
                
                {/* Contenido sección */}
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

        {/* Modal de filtros contextual (IMCs/CLIENTES) */}
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
