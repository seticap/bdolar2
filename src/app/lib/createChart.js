// lib/createChart.js

/**
 * Cargador seguro de `createChart` desde `lightweight-charts` (dinámico).
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Objetivo:
 * - Importar la función `createChart` de `lightweight-charts` usando `import()` dinámico.
 * - Evitar crasheos por diferencias de export entre ESM / CJS o bundlers (default vs named export).
 * - Dar un fallback seguro (retornar `null`) y loguear un error claro si no está disponible.
 *
 * Contexto:
 * - `lightweight-charts` es **client-only** (usa `window`/DOM). En Next.js,
 *   este helper permite cargarlo **solo en cliente** evitando errores en SSR.
 *
 * Retorno:
 * - Promise<((container: HTMLElement, options?: object) => any) | null>
 *   Devuelve la función `createChart` si se encuentra; de lo contrario `null`.
 *
 * Uso típico:
 * ```js
 * const createChart = await getCreateChart();
 * if (!createChart) { /* manejar error o degradar la UI *\/ }
 * const chart = createChart(container, { /* opciones *\/ });
 * ```
 *
 * Notas:
 * - Este helper **no** crea el gráfico; solo entrega la referencia a `createChart`.
 * - Se recomienda hacer el llamado dentro de `useEffect` (o en un evento del cliente).
 */
export const getCreateChart = async () => {
   // Import dinámico (solo corre en cliente si lo invocas en un efecto/handler del cliente)
  try {
    const mod = await import('lightweight-charts');

    //  Chequeo para compatibilidad ESM/CJS:
    // - Algunos bundlers exponen `createChart` como named export.
    // - En otros, puede venir bajo `default.createChart`.
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
    // Manejo seguro de errores de import (red de seguridad para SSR o bundles)
    console.error('[❌] Error importando lightweight-charts:', error);
    return null;
  }
};
