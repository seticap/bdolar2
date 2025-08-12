/**
 *  EstadisticasService.jsx
 *
 * -- Juan Jose Peña Quiñonez
 * -- Cc:1000273604
 *  
 *  Servicio de datos para **Estadisticas de Mercado**.
 *  Expone helpers para:
 *  - Obtener estadisticas desde el backend (`fetchEstadisticasAPI`)
 *  - Derivar opciones validas de filtros a partir de los datos (`fetchFiltrosDesdeDatos`)
 * 
 *  Caracteristicas:
 *   - Manejo de token Bearer via `TokenServices` (renovacion si falta/expira).
 *   - POST JSON con payload tipado por `sector`, `fecha` y filtros opcionales.
 *   - Manejo de errores con Logs y `fallback` seguro (retorna arrays vacios).
 * 
 *  Seguridad:
 *   - Evita hardcodear credenciales en codigo fuente. Parametriza por env vars.
 *     (Aqui se usan "sysdev" / "$MasterDev1972*" **Solo como placeholder**.)
 * 
 *  Dependencias:
 *   - `tokenServices` desde `./socketService` con:
 *    - `getToken(): string | undefined`
 *    - `fetchToken(user: string, pass: string): Promise<string>`
 *  
 *  Endpoints:
 *   - POST http://set-fx.com/api/v1/dolar/estadisticas/estadisticasMercado
 * 
 *  Ejemplo de uso:
 *   - const fecha = '2025-08-08';
 *   - const datos = await fetchEstadisticasAPI(1, fecha, {Moneda: 1, 'Merc.':['SPOT']});
 *   - const {mercados, monedas, plazos} = await fetchFiltrosDesdeDatos(1, fecha)
 */
import { tokenServices } from "./socketService";

const API_URL = "http://set-fx.com/api/v1/dolar/estadisticas/estadisticasMercado";

/**
 *  Llama al endpoint de estadisticas con autenticacion Bearer y payLoad JSON.
 * 
 * @param {number} sector - Identificador del sector: `1` = IMCs, `2` = CLIENTES. 
 * @param {string} fecha  - Fecha en formato `YYYY-MM-DD`
 * @param {Object} filtros - Filtros opcionales compatibles con la API.
 *  Ejemplos de claves esperadas por backend:
 *    - "Merc.": string[] (p.ej. ['SPOT', 'FORWARD'])
 *    - "Moneda": number (ID mapeado desde UI)
 *    - "Plazo": string[] (p.ej. ['0 - 1 mes'])
 * @returns {Promise<Array>} `result` del backend (o `[]` en caso de error).
 */

export const fetchEstadisticasAPI = async (sector, fecha, filtros = {}) => {
  try {
    // 1) Obtener/renovar token
    let token = tokenServices.getToken();

    // Heuristica minima: si no hay token o parece invalido, Lo pedimos 
    if (!token || token.length < 30) {
      // Mover estas credenciales a variables de entorno en produccion
      token = await tokenServices.fetchToken("sysdev", "$MasterDev1972*");
    }

    // 2) Construir payLoad
    const payload = {
      fecha,
      sector,
      ...filtros,
    };

    console.log("➡️ Enviando payload:", payload);

    // 3) POST al endpoint
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    // 4) Validacion de respuesta
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    // 5) Parse de JSON y retorno defensivo
    const data = await response.json();
    return data?.result || [];
  } catch (error) {
    console.error("❌ Error al obtener estadísticas desde API:", error);
    return [];
  }
};
/**
 *  Deriva los **filtros disponibles** (mercados, monedas, plazos) a partir de los datos crudos
 *  devueltos por `fetchEstadisticasAPI` para un `sector` y `fecha` dados.
 * 
 * @param {number} sector - `1` = IMCs, `2` = CLIENTES.
 * @param {string} fecha - Fecha en formato `YYYY-MM-DD`.
 * @returns {Promise<{mercados: string[], monedas: string[], plazos: string[]}>}
 *  Listas **unicas** y **limpias** (sin vacios) ordenadas por aparicion.
 */

export const fetchFiltrosDesdeDatos = async (sector, fecha) => {
  // 1) Obtener dataset base
  const datos = await fetchEstadisticasAPI(sector, fecha);
  
  // 2) Utilidad para limpiar y deduplicar un campo textual
  const limpiarCampo = (campo) =>
    Array.from(
      new Set(
        datos.map((r) => r[campo]).filter((v) => typeof v === "string" && v.trim() !== "")
      )
    );
  
  // 3) Extraer opciones validas desde las columnas esperadas
  const mercados = limpiarCampo("Merc.");
  const monedas = limpiarCampo("Moneda");
  const plazos = limpiarCampo("Plazo");

  return {
    mercados,
    monedas,
    plazos,
  };
};


