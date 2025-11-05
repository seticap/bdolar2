"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useWebSocketData } from "./WebSocketDataProvider";

const TZ = "America/Bogota";
const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbx4J6Xrljp6SGta6EQiqlDFPP7dXC7WmO2FmyYcK_XBfDEXgTTJyFkwGlMAWtXRWIzW/exec";

const SLOTS = ["09:00", "10:00", "11:00", "12:00"];

const pad2 = (n) => String(n).padStart(2, "0");
const yyyyMmDd = (d) => d.toLocaleDateString("en-CA", { timeZone: TZ });
const hhmm = (d) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const toMinutes = (hhmm) => {
  const [H, M] = String(hhmm).split(":").map(Number);
  return H * 60 + M;
};

function nowBogota() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

function dateFromWsTime(t) {
  if (!t) return null;
  if (typeof t === "number") return new Date(t > 1e12 ? t : t * 1000);
  const s = String(t).trim();
  const m = s.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const d = new Date(new Date().toLocaleDateString("en-US", { timeZone: TZ }));
    d.setHours(+m[1], +m[2], +(m[3] || 0), 0);
    return d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function jsonp(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const cb = `jsonp_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const bust = url.includes("?") ? "&" : "?";
    const src = `${url}${bust}callback=${cb}&_=${Date.now()}`;

    let settled = false;
    const script = document.createElement("script");
    script.id = cb;
    script.async = true;

    window[cb] = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
      setTimeout(() => {
        try {
          delete window[cb];
        } catch {}
        script.remove();
      }, 1000);
    };

    const to = setTimeout(() => {
      if (settled) return;
      settled = true;
      window[cb] = () => {};
      reject(new Error("JSONP timeout"));
      setTimeout(() => {
        try {
          delete window[cb];
        } catch {}
        script.remove();
      }, 30000);
    }, timeoutMs);

    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      reject(new Error("JSONP error"));
      setTimeout(() => {
        try {
          delete window[cb];
        } catch {}
        script.remove();
      }, 0);
    };

    script.src = src;
    document.body.appendChild(script);
  });
}

const IntradayContext = createContext(null);
export const useIntradaySheets = () => useContext(IntradayContext);

export function IntradaySheetsProvider({ children }) {
  const { dataById } = useWebSocketData();
  const tick = dataById["1007"];

  const [dataByHour, setDataByHour] = useState({});
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef({});
  const lastDateKeyRef = useRef("");

  const reloadIntraday = useCallback(async (retry = 0) => {
    const fecha = yyyyMmDd(nowBogota());
    try {
      const resp = await jsonp(
        `${URL_APPS_SCRIPT}?tipo=intradia_get_jsonp&fecha=${encodeURIComponent(
          fecha
        )}`,
        5000
      );
      setDataByHour(resp?.data || {});
      setLoaded(true);
    } catch {
      if (retry < 2) setTimeout(() => reloadIntraday(retry + 1), 800);
      else setLoaded(true);
    }
  }, []);

  const guardarSlot = useCallback(
    async (hora, baseTime) => {
      if (!baseTime || savingRef.current[hora]) return;
      if (dataByHour[hora]) return;

      const avg = tick?.avg ?? null;
      const close = tick?.close ?? null;
      if (avg == null && close == null) return;

      savingRef.current[hora] = true;
      try {
        const qs = new URLSearchParams({
          tipo: "intradia_upsert_jsonp",
          fecha: yyyyMmDd(baseTime),
          hora,
          promedio: String(avg ?? ""),
          cierre: String(close ?? ""),
          t: baseTime.toISOString(),
        });
        const resp = await jsonp(`${URL_APPS_SCRIPT}?${qs.toString()}`, 5000);
        if (resp?.success) {
          setDataByHour((prev) => ({ ...prev, [hora]: { avg, close } }));
        }
      } catch (e) {
        console.warn("Error guardando slot", hora, e?.message || e);
      } finally {
        savingRef.current[hora] = false;
      }
    },
    [tick, dataByHour]
  );

  useEffect(() => {
    reloadIntraday();
  }, [reloadIntraday]);

  useEffect(() => {
    if (!loaded) return;

    const wsDate = dateFromWsTime(tick?.time) || nowBogota();

    const today = yyyyMmDd(wsDate);
    if (lastDateKeyRef.current !== today) {
      lastDateKeyRef.current = today;
    }

    const curMin = toMinutes(hhmm(wsDate));
    const next = SLOTS.find((h) => toMinutes(h) <= curMin && !dataByHour[h]);
    if (next) guardarSlot(next, wsDate);
  }, [tick, loaded, dataByHour, guardarSlot]);

  return (
    <IntradayContext.Provider
      value={{
        dataByHour,        
        reloadIntraday,     
      }}
    >
      {children}
    </IntradayContext.Provider>
  );
}
