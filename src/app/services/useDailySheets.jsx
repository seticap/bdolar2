"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocketData } from "./WebSocketDataProvider";

const TZ = "America/Bogota";
const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbx4J6Xrljp6SGta6EQiqlDFPP7dXC7WmO2FmyYcK_XBfDEXgTTJyFkwGlMAWtXRWIzW/exec";

function parseWindows(env) {
  if (!env) return null;
  const wins = env
    .split(",")
    .map((s) => s.trim())
    .map((w) => {
      const [start, end] = w.split("-").map((x) => x.trim());
      if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end))
        return null;
      return { start, end };
    })
    .filter(Boolean);
  return wins.length ? wins : null;
}

const ENV_WINDOWS = parseWindows("13:13-13:15");
const SAVE_WINDOWS = ENV_WINDOWS ?? [{ start: "12:55", end: "13:05" }];

export const saveWindowLabel = SAVE_WINDOWS.map(
  (w) => `${w.start}–${w.end}`
).join(", ");

function nowBOG() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}
function yyyyMmDdBOG(d = nowBOG()) {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function yesterdayBOG() {
  return yyyyMmDdBOG(addDays(nowBOG(), -1));
}
function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function isWithinSaveWindow(d = nowBOG()) {
  const cur = d.getHours() * 60 + d.getMinutes();
  return SAVE_WINDOWS.some(({ start, end }) => {
    const s = hhmmToMinutes(start);
    const e = hhmmToMinutes(end);
    return s <= e ? cur >= s && cur <= e : cur >= s || cur <= e;
  });
}
function isFromAppsScript(origin) {
  return (
    origin.startsWith("https://script.google.com") ||
    origin.startsWith("https://script.googleusercontent.com")
  );
}

export function useDailySheets() {
  const { dataById } = useWebSocketData();
  const precios = dataById["1006"];
  const montos = dataById["1005"];

  const [yesterday, setYesterday] = useState(undefined);
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const savedToday = useRef(false);

  const loadYesterday = useCallback(() => {
    const fechaRef = yyyyMmDdBOG();
    let settled = false;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `${URL_APPS_SCRIPT}?tipo=consulta_ayer_iframe&fecha=${encodeURIComponent(
      fechaRef
    )}`;
    document.body.appendChild(iframe);

    const onMsg = (ev) => {
      if (ev.source !== iframe.contentWindow) return;
      if (!isFromAppsScript(ev.origin)) return;

      const msg = ev.data || {};
      if (msg.type !== "consulta_ayer") return;

      settled = true;
      if (msg.data?.success && msg.data?.data) setYesterday(msg.data.data);
      else setYesterday(null);

      window.removeEventListener("message", onMsg);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    window.addEventListener("message", onMsg);

    setTimeout(() => {
      if (settled) return;
      window.removeEventListener("message", onMsg);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);

      const cb = `jsonp_cb_${Date.now()}`;
      window[cb] = (resp) => {
        if (resp?.success && resp?.data) setYesterday(resp.data);
        else setYesterday(null);
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
      };
      const script = document.createElement("script");
      script.async = true;
      script.src = `${URL_APPS_SCRIPT}?tipo=consulta_ayer_jsonp&fecha=${encodeURIComponent(
        fechaRef
      )}&callback=${cb}`;
      script.onerror = () => {
        delete window[cb];
        if (script.parentNode) script.parentNode.removeChild(script);
        setYesterday(null);
      };
      document.body.appendChild(script);
    }, 1800);
  }, []);

  const saveToday = useCallback(
    (force = false) => {
      const now = nowBOG();
      const fecha = yyyyMmDdBOG(now);

      if (!force && !isWithinSaveWindow(now)) return;
      if (!force && savedToday.current) {
        setSaveState("already");
        return;
      }
      if (!precios || !montos) {
        setSaveState("error");
        return;
      }

      setSaveState("saving");

      const payload = {
        tipo: "cierre_diario",
        fecha,
        // Precios (1006)
        cierre: precios?.trm ?? "-",
        maximo: precios?.high ?? "-",
        minimo: precios?.low ?? "-",
        apertura: precios?.open ?? "-",
        // Montos (1005)
        monto_negociado: montos?.sum ?? "-",
        monto_promedio: montos?.avg ?? "-",
        monto_maximo: montos?.high ?? "-",
        monto_minimo: montos?.low ?? "-",
        monto_apertura: montos?.open ?? "-",
        monto_cierre: montos?.close ?? "-",
        transacciones: montos?.count ?? "-",
        timestamp: new Date().toISOString(),
      };

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = `${URL_APPS_SCRIPT}?${new URLSearchParams(payload)}`;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setSaveState("saved");
        savedToday.current = true;
        setLastSavedAt(now.toISOString());
        localStorage.setItem("ultimoGuardadoYYYYMMDD", fecha);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        setTimeout(loadYesterday, 400);
      };
      iframe.onerror = () => {
        setSaveState("error");
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };
    },
    [precios, montos, loadYesterday]
  );

  useEffect(() => {
    loadYesterday();
    const hoy = yyyyMmDdBOG();
    savedToday.current = localStorage.getItem("ultimoGuardadoYYYYMMDD") === hoy;
  }, [loadYesterday]);

  useEffect(() => {
    const t = setInterval(() => {
      if (isWithinSaveWindow() && precios && montos && !savedToday.current) {
        saveToday();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [saveToday, precios, montos]);

  return {
    yesterday,
    saveState,
    lastSavedAt,
    saveToday,
    reloadYesterday: loadYesterday,
    saveWindowLabel,
  };
}
