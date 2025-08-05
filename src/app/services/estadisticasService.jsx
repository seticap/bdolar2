// src/services/estadisticasService.jsx
import { tokenServices } from "./socketService";

const API_URL = "http://set-fx.com/api/v1/dolar/estadisticas/estadisticasMercado";

export const fetchEstadisticasAPI = async (sector, fecha, filtros = {}) => {
  try {
    let token = tokenServices.getToken();

    if (!token || token.length < 30) {
      token = await tokenServices.fetchToken("sysdev", "$MasterDev1972*");
    }

    const payload = {
      fecha,
      sector,
      ...filtros,
    };

    console.log("➡️ Enviando payload:", payload);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data?.result || [];
  } catch (error) {
    console.error("❌ Error al obtener estadísticas desde API:", error);
    return [];
  }
};

export const fetchFiltrosDesdeDatos = async (sector, fecha) => {
  const datos = await fetchEstadisticasAPI(sector, fecha);

  const limpiarCampo = (campo) =>
    Array.from(
      new Set(
        datos.map((r) => r[campo]).filter((v) => typeof v === "string" && v.trim() !== "")
      )
    );

  const mercados = limpiarCampo("Merc.");
  const monedas = limpiarCampo("Moneda");
  const plazos = limpiarCampo("Plazo");

  return {
    mercados,
    monedas,
    plazos,
  };
};


