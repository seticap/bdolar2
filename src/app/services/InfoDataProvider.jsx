"use client";

import { createContext, useContext, useEffect, useState } from "react";

const InfoDataContext = createContext();
export const useInfoData = () => useContext(InfoDataContext);

export const InfoDataProvider = ({ children }) => {
  const [empresas, setEmpresas] = useState([]);
  const [indices, setIndices] = useState([]);
  const [noticias, setNoticias] = useState([]);

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

    setNoticias(news)
  } catch (e) {
    console.error("La consulta no se pudo completar", e);
  }
};

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
