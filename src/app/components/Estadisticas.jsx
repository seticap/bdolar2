import React, { useEffect, useState } from 'react';

// === Opciones disponibles para los selectores de filtros ===
const opcionesMercado = ['Todos' ,'SPOT', 'FORWARD', 'NEXT DAY', 'FIX', 'IRS', 'OPCION'];
const opcionesMoneda = ['Todos' ,'USD/COP', 'EUR/COP', 'EUR/USD', 'USD/EUR', 'USD/JPY', 'GBP/USD', 'USD/BRL', 'USD/CAD', 'USD/MXN', 'USD/AUD', 'GBP/COP'];
const opcionesPlazo = ['Todos' ,'0', '0 - 1 mes', '1 - 3 meses', '3 - 6 meses', 'mayores a 6 meses'];

/**
 * Función simulada que retorna combinaciones aleatorias de datos financieros.
 * Filtra por mercado, moneda y plazo según los parámetros seleccionados.
 * @param {Object} filtros - Objeto con `merc`, `moneda` y `plazo`.
 * @returns {Promise<Array>} Arreglo de objetos de estadísticas.
 */


// Generador de datos aleatorios para simular múltiples entradas similares
const fetchDatosDesdeAPI = async (sector = 1, fechaParam, filtros = {}) => {
 const fecha = fechaParam || new Date().toISOString().split('T')[0];
  try {
    const token = process.env.NEXT_PUBLIC_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWJUeXBlIjoidXNlciIsInVzZXJuYW1lIjoic3lzZGV2IiwicHJvamVjdCI6IjE5ZTI4ODQzLTZmNTktNDYxZS1hZjllLWVmZmJjZTFmNWRkNCIsImRlbGF5IjowLCJleHBpcmF0aW9uRGF0ZSI6IjIwNTAtMTItMzFUMDA6MDA6MDBaIiwic3RhcnRUaW1lIjoiIiwiZXhwIjoxNzUzNTQ1MDUyLCJpYXQiOjE3NTM0NTg2NTIsImlzcyI6InNldGljYXBAc2V0aWNhcCIsInN1YiI6ImMyYzcxYjIxLWI5MDAtNDA2My1iOWFjLTgzZjhhZjQ5NjgwZSJ9.2V7W81-X7PNrIQVC82jigV_an0bqxMXbFEr7H39N_Gs';

    const response = await fetch(
      'http://set-fx.com/api/v1/dolar/estadisticas/estadisticasMercado',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha, sector, ...filtros, }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`❌ Estadísticas failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('📦 Respuesta completa:', data); // 👈 LOG CRUCIAL

    return data?.result || [];
  } catch (error) {
    console.error('🚨 Error al obtener datos desde la API:', error.message);
    return [];
  }
};
const mapMoneda = {
  'USD/COP': 1,
  'EUR/COP': 2,
  'EUR/USD': 3,
  'USD/EUR': 4,
  'USD/JPY': 5,
  'GBP/USD': 6,
  'USD/BRL': 7,
  'USD/CAD': 8,
  'USD/MXN': 9,
  'USD/AUD': 10,
  'GBP/COP': 11,
};

const mapMercado = {
  'SPOT': 1,
  'FORWARD': 2,
  'NEXT DAY': 3,
  'FIX': 4,
  'IRS': 5,
  'OPCION': 6,
};

const mapPlazo = {
  '0': 0,
  '0 - 1 mes': 1,
  '1 - 3 meses': 2,
  '3 - 6 meses': 3,
  'mayores a 6 meses': 4,
};


// =========================== COMPONENTE PRINCIPAL ===========================

const Estadisticas = () => {
// === Estados del componente ===
  const [filas, setFilas] = useState([]); //Contiene todas las estadisticas
  const [filaSeleccionada, setFilaSeleccionada] = useState(null); //indice de la fila que se va a editar
  const [mostrarModal, setMostrarModal] = useState(false); //Controla visibilidad del modal
  const [formData, setFormData] = useState({ merc: '', moneda: '', plazo: '' }); //Datos del formulario
  const [cargando, setCargando] = useState(false); // Estado de carga al guardar

// === Cargar datos desde localStorage cuando el componente se monta ===
useEffect(() => {
  const almacenadas = localStorage.getItem('estadisticas');

  // Si no hay datos guardados, carga un conjunto por defecto
  if (almacenadas) {
    setFilas(JSON.parse(almacenadas));
  } else {
    // CArga un dataset por defecto si no hay datos previos
    setFilas([
      {
        id: 'imcs-default-1',
        tipo: 'IMCs',
        merc: 'SPOT',
        moneda: 'USD/COP',
        plazo: '0',
        monto: '$ 7.595.586,21',
        transacciones: 29,
        max: '$ 35.000.000,00',
        min: '$ 2.000,00',
        ultimo: '$ 10.000.000,00',
        precio: '$ 220.272.000,00',
        fecha: '2025-04-02',
      },
      {
        id: 'clientes-default-2',
        tipo: 'CLIENTES',
        merc: 'FORWARD',
        moneda: 'EUR/USD',
        plazo: '0 - 1 mes',
        monto: '$ 1.893.759.506,17',
        transacciones: 25,
        max: '$ 1.893.759.506,17',
        min: '$ 28.856,00',
        ultimo: '$ 5.000.000,00',
        precio: '$ 47.343.987.654,21',
        fecha: '2025-04-02',
      },
    ]);
  }
}, []);


   
useEffect(() => {
  const almacenadas = JSON.parse(localStorage.getItem('estadisticas'));

  if (almacenadas && Array.isArray(almacenadas) && almacenadas.length > 0) {
    setFilas(almacenadas);
  } else {
    const porDefecto = [
      {
        id: 'imcs-default-1',
        tipo: 'IMCs',
        merc: 'SPOT',
        moneda: 'USD/COP',
        plazo: '0',
        monto: '$ 7.595.586,21',
        transacciones: 29,
        max: '$ 35.000.000,00',
        min: '$ 2.000,00',
        ultimo: '$ 10.000.000,00',
        precio: '$ 220.272.000,00',
        fecha: '2025-04-02',
      },
      {
        id: 'clientes-default-1',
        tipo: 'CLIENTES',
        merc: 'FORWARD',
        moneda: 'EUR/USD',
        plazo: '0 - 1 mes',
        monto: '$ 1.893.759.506,17',
        transacciones: 25,
        max: '$ 1.893.759.506,17',
        min: '$ 28.856,00',
        ultimo: '$ 5.000.000,00',
        precio: '$ 47.343.987.654,21',
        fecha: '2025-04-02',
      },
    ];
// === Refrescar localStorage en caso de que los datos cambien ===
    localStorage.setItem('estadisticas', JSON.stringify(porDefecto));
    setFilas(porDefecto);
  }
}, []);
/**
   * Abre el modal y carga los datos actuales de la fila seleccionada.
   * @param {number} index - Índice de la fila en el array `filas`
   */

  const abrirModal = (index) => {
    setFilaSeleccionada(index);
    const { merc, moneda, plazo } = filas[index];
    setFormData({ merc, moneda, plazo });
    setMostrarModal(true);
  };

  
  /**
   * Abre el modal y cargar los datos actuales de la fila seleccionada
   * @param {number} index - indice de la fila en el array `filas`
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  /**
   * Ejecuta busqueda simulada y actualiza la lista de filas,
   * manteniendo las del tipo contrario (CLIENTES o IMCs).
   */
const guardarCambios = async () => {
  setCargando(true);

  const tipoOriginal = filas[filaSeleccionada].tipo;
  const sector = tipoOriginal === 'CLIENTES' ? 2 : 1;

  const filtrosBackend = {
  mercado: mapMercado[formData.merc] ?? null,
  moneda: mapMoneda[formData.moneda] ?? null,
  plazo: mapPlazo[formData.plazo] ?? null,
};


const nuevos = await fetchDatosDesdeAPI(sector, new Date().toISOString().split('T')[0], filtrosBackend);


  if (!nuevos.length) {
    setCargando(false);
    return;
  }

const transformados = nuevos.map((dato, idx) => ({
  id: `api-${tipoOriginal}-${idx}-${Date.now()}`,
  tipo: tipoOriginal,
  merc: dato['Merc.'] || 'SPOT',
  moneda: dato['Moneda'] || 'USD/COP',
  plazo: dato['Plazo'] || '0',
  monto: `$ ${Number(dato['Monto Acumulado'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  transacciones: Number(dato['Transacciones'] || 0),
  max: `$ ${Number(dato['Máximo'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  min: `$ ${Number(dato['Mínimo'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  ultimo: `$ ${Number(dato['Último'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  precio: `$ ${Number(dato['Precio Promedio'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  apertura: `$ ${Number(dato['Apertura'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  cierre: `$ ${Number(dato['Cierre'] || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
  fecha: dato['Fecha'] || new Date().toISOString().split('T')[0],
}));

  const otros = filas.filter((f) => f.tipo !== tipoOriginal);
  setFilas([...otros, ...transformados]);

  setMostrarModal(false);
  setCargando(false);
};




// === Renderizado principal ===


  console.log(filas)
return (
 <div className="bg-[#0c0c14] text-white min-h-screen px-4 sm:px-6 py-8">
    <h2 className="text-2xl font-bold mb-6 text-center">Estadísticas</h2>

    <div className="space-y-6">
      {filas.map((fila, i) => (
        <div key={fila.id || i} className="bg-white/5 backdrop-blur-sm rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-red-500 text-xl font-bold">{fila.tipo}</h3>
            <button
              onClick={() => abrirModal(i)}
              className="bg-red-600 px-4 py-1 rounded hover:bg-green-500 text-sm"
            >
              Editar
            </button>
          </div>

          {/* Datos principales*/}

          <div className="text-sm mb-3 flex flex-col sm:flex-row sm:space-x-6 space-y-1 sm:space-y-0">
            <span><strong>Mercado:</strong> {fila.merc}</span>
            <span><strong>Moneda:</strong> {fila.moneda}</span>
            <span><strong>Plazo:</strong> {fila.plazo}</span>
          </div>

          {/*Abertura y cierre*/}
          <div className="text-sm flex flex-col sm:flex-row justify-between mb-3 space-y-1 sm:space-y-0">
           <span><strong>APERTURA:</strong> <span className="text-red-500">{fila.apertura}</span></span>
            <span><strong>CIERRE:</strong> <span className="text-red-500">{fila.cierre}</span></span>

          </div>

        {/*Tabla de metricas*/}
         <div className="overflow-x-auto text-sm">
          <table className="w-full min-w-[700px] text-left">
            <tbody>
              <tr className="border-b border-gray-600">
                <td className="pr-2 font-semibold whitespace-nowrap">MONTO:</td>
                <td className="text-green-400 pr-4">{fila.monto}</td>

                <td className="font-semibold pr-2">TRANS.</td>
                <td className="pr-4">{fila.transacciones}</td>

                <td className="font-semibold pr-2">MAX</td>
                <td className="text-green-400 pr-4">{fila.max}</td>

                <td className="font-semibold pr-2">MIN</td>
                <td className="text-red-500 pr-4">{fila.min}</td>

                <td className="font-semibold pr-2">ULTIMO</td>
                <td className="text-green-400 pr-4">{fila.ultimo}</td>

                <td className="font-semibold pr-2">FECHA</td>
                <td>{fila.fecha}</td>
              </tr>
              <tr>
                <td className="pr-2 font-semibold">PRECIO:</td>
                <td className="text-white">{fila.precio}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      ))}
    </div>
     {/* Modal de edición (ya responsive) */}
      {mostrarModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/40">
    <div className="w-full max-w-xl bg-gradient-to-br from-[#1c1c25] to-[#101018] text-white rounded-lg shadow-lg px-6 py-8">
      <h3 className="text-2xl font-bold text-center mb-6">Editar Filtros</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mercado */}
        <div>
          <label className="block text-sm mb-1">Mercado</label>
          <select
            name="merc"
            value={formData.merc}
            onChange={handleChange}
            className="w-full bg-[#1f1f2b] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {opcionesMercado.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-sm mb-1">Moneda</label>
          <select
            name="moneda"
            value={formData.moneda}
            onChange={handleChange}
            className="w-full bg-[#1f1f2b] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {opcionesMoneda.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Plazo (toma ancho completo en mobile) */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Plazo</label>
          <select
            name="plazo"
            value={formData.plazo}
            onChange={handleChange}
            className="w-full bg-[#1f1f2b] text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {opcionesPlazo.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => setMostrarModal(false)}
          disabled={cargando}
          className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-5 py-2 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={guardarCambios}
          disabled={cargando}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded"
        >
          {cargando ? 'Cargando...' : 'Guardar'}
        </button>
      </div>
    </div>
  </div>
)}


    </div>
);

};


export default Estadisticas;