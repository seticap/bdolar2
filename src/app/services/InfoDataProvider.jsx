/**
 * app/services/InfoDataProvider.jsx 
 *
 * InfoDataProvider — Contexto global para Empresas, Índices y Noticias.
 *
 * Descripción:
 * - Provee en contexto (`useInfoData`) tres colecciones derivadas de scraping ligero:
 *   1) `empresas`  → HTML `<table>` de /acciones
 *   2) `indices`   → HTML `<table>` de /indices
 *   3) `noticias`  → RSS/XML de /news
 * - El fetch se hace en cliente (usa `DOMParser`, que requiere `window`).
 * - No hace SSR ni cache; ejecuta 3 `fetch` al montar.
 *
 * Dependencias:
 * - React (createContext, useContext, useEffect, useState)
 * - DOMParser (navegador) para parseo de HTML/XML
 *
 * Notas importantes:
 * - Endpoints usan HTTP plano (`http://set-fx.com/...`). Si tu sitio sirve por HTTPS,
 *   puede haber bloqueo por **Mixed Content**.
 * - El scraping asume estructura de `<table><tbody><tr><td>...</td></tr></tbody></table>`.
 *   Si cambia el markup, este parseo puede romperse.
 * - No hay reintentos, ni polling, ni fallback; solo logs a consola en error.
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
/**
 * @typedef {Object} Empresa
 * @property {string} nombre
 * @property {string} valor
 * @property {string} variacion
 *
 * @typedef {Object} Indice
 * @property {string} nombre
 * @property {string} valor
 * @property {string} variacion
 *
 * @typedef {Object} Noticia
 * @property {string} title
 * @property {string} link
 * @property {string} description
 */
/** Contexto sin valor inicial tipado */
const InfoDataContext = createContext();
/**
 * Hook de conveniencia para consumir el contexto.
 * @returns {{ empresas: Empresa[], indices: Indice[], noticias: Noticia[] }}
 */
export const useInfoData = () => useContext(InfoDataContext);
/**
 * Proveedor de datos para empresas, índices y noticias.
 * - Monta 3 efectos de carga (una sola vez).
 * - Parsea HTML/XML con `DOMParser` del navegador.
 */
export const InfoDataProvider = ({ children }) => {
   /** @type {[Empresa[], Function]} */
  const [empresas, setEmpresas] = useState([]);
   /** @type {[Indice[], Function]} */
  const [indices, setIndices] = useState([]);
  /** @type {[Noticia[], Function]} */
  const [noticias, setNoticias] = useState([]);

  useEffect(() => {
    /**
     * Carga y parsea empresas desde HTML.
     * - Extrae filas de una tabla, asumiendo 3 celdas: nombre, valor, variacion.
     */
    const fetchEmpresas = async () => {
      try {
        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/public/acciones"
        );
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const row = doc.querySelectorAll("table tbody tr");

        const data = Array.from(row).map((tr) => {
          const [nombre, valor, variacion] = Array.from(
            tr.querySelectorAll("td")
          ).map((td) => td.textContent.trim());
          return { nombre, valor, variacion };
        });

        setEmpresas(data);
      } catch (e) {
        console.error("Error cargando empresas: ", e);
      }
    };
    /**
     * Carga y parsea índices desde HTML.
     * - Misma estructura de tabla que `empresas`.
     */
    const fetchIndices = async () => {
      try {
        const res = await fetch(
          "http://set-fx.com/api/v1/dolar/public/indices"
        );
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const row = doc.querySelectorAll("table tbody tr");

        const data = Array.from(row).map((tr) => {
          const [nombre, valor, variacion] = Array.from(
            tr.querySelectorAll("td")
          ).map((td) => td.textContent.trim());
          return { nombre, valor, variacion };
        });

        setIndices(data);
      } catch (e) {
        console.error("Error cargando indices: ", e);
      }
    };
  /**
     * Carga y parsea noticias desde RSS/XML.
     * - Extrae title, link, description desde `<item>`.
     * - Usa valores vacíos en caso de nodos faltantes.
  */
    const fetchNoticias = async () => {
  try {
    const res = await fetch("http://set-fx.com/api/v1/dolar/public/news");
    const xml = await res.text();
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const items = doc.querySelectorAll("item");

    const news = Array.from(items).map((item) => ({
      title: item.querySelector("title")?.textContent?.trim() || "",
      link: item.querySelector("link")?.textContent?.trim() || "",
      description:
        item.querySelector("description")?.textContent?.trim() || "",
    }));
    
    setNoticias(news)
  } catch (e) {
    console.error("La consulta no se pudo completar", e);
  }
};
// Disparar las 3 cargas en paralelo al montar
    fetchEmpresas();
    fetchIndices();
    fetchNoticias();
  }, []);

  return (
    <InfoDataContext.Provider value={{ empresas, indices, noticias }}>
      {children}
    </InfoDataContext.Provider>
  );
};
