"use client";

import { createContext, useContext, useEffect, useState } from "react";

const InfoDataContext = createContext();
export const useInfoData = () => useContext(InfoDataContext);

export const InfoDataProvider = ({ children }) => {
  const [empresas, setEmpresas] = useState([]);
  const [indices, setIndices] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [grafica, setGrafica] = useState([]);

  useEffect(() => {
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

        setNoticias(news);
      } catch (e) {
        console.error("La consulta no se pudo completar", e);
      }
    };

    const fetchGrafica = async () => {
      try {
        const res = await fetch("http://set-fx.com/api/v1/dolar/public/igbc");
        const text = await res.text();
        const pairs = parsePairs(text);

        const data = pairs.map(([label, value]) => ({
          label: String(label),
          value: Number(value),
        }));

        setGrafica(data)
      } catch (e) {
        console.error("La consulta no se pudo completar", e)
      }
    };

    function parsePairs(rawText) {
      try {
        const j = JSON.parse(rawText);
        if (Array.isArray(j)) return j;
      } catch {}
      const from = rawText.indexOf("[");
      const to = rawText.lastIndexOf("]");
      if (from === -1 || to === -1){
        throw new Error("Respuesta inesperada (no JSON)");
      }
      return JSON.parse(rawText.slice(from, to + 1));
    }

    fetchEmpresas();
    fetchIndices();
    fetchNoticias();
    fetchGrafica();
  }, []);

  return (
    <InfoDataContext.Provider value={{ empresas, indices, noticias, grafica }}>
      {children}
    </InfoDataContext.Provider>
  );
};
