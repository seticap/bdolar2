// lib/createChart.js

export const getCreateChart = async () => {
  try {
    const mod = await import('lightweight-charts');

    // 🔍 Este chequeo es vital para ESM y CJS compatibilidad
    const createChart =
      typeof mod.createChart === 'function'
        ? mod.createChart
        : mod.default?.createChart;

    if (!createChart) {
      console.error('[❌] createChart no encontrado en lightweight-charts');
      return null;
    }

    return createChart;
  } catch (error) {
    console.error('[❌] Error importando lightweight-charts:', error);
    return null;
  }
};
