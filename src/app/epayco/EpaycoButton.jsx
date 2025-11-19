"use client";
import React, { useEffect, useState } from "react";

export default function EpaycoButton({
  name,
  description,
  amount,
  tax,
  taxBase,
  currency = "cop",
  country = "co",
  test = true,
}) {
  const [handler, setHandler] = useState(null);

  useEffect(() => {
    const int = setInterval(() => {
      if (
        typeof window !== "undefined" &&
        window.ePayco &&
        window.ePayco.checkout
      ) {
        const h = window.ePayco.checkout.configure({
          key: "ae022d333e2690638eaea6447d8796ba",
          test: Boolean(test),
        });
        setHandler(h);
        clearInterval(int);
      }
    }, 200);
    return () => clearInterval(int);
  }, [test]);

  const openCheckout = () => {
    if (!handler) return;
    handler.open({
      name,
      description: description || name,
      currency,
      country,
      amount: String(amount),
      tax: String(tax),
      tax_base: String(taxBase),
    });
  };

  const isReady = Boolean(handler);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <button
        onClick={openCheckout}
        disabled={!isReady}
        style={{
          // 🔵 Azul MUY denso y 100% opaco
          backgroundColor: isReady ? "#002B6B" : "#4B5563",
          backgroundImage: "none",
          border: "1px solid #001633",
          padding: "10px 28px",
          cursor: isReady ? "pointer" : "not-allowed",
          borderRadius: "10px",
          color: "white",
          fontSize: "15px",
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
          textTransform: "uppercase",
          letterSpacing: "1px",
          transition:
            "background-color 0.15s ease-out, transform 0.15s ease-out, box-shadow 0.15s ease-out",
          opacity: 1,                   // ✅ sin transparencia
          mixBlendMode: "normal",       // por si hay estilos raros globales
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.7)",
          minWidth: "150px",
          textAlign: "center",
        }}
        onMouseEnter={(e) => {
          if (isReady) {
            e.currentTarget.style.backgroundColor = "#0040A3";
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow =
              "0 7px 18px rgba(0, 0, 0, 0.8)";
          }
        }}
        onMouseLeave={(e) => {
          if (isReady) {
            e.currentTarget.style.backgroundColor = "#002B6B";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 10px rgba(0, 0, 0, 0.7)";
          }
        }}
        aria-label={name}
        title={isReady ? name : "Cargando…"}
      >
        {isReady ? "SUSCRIBIRME" : "Cargando..."}
      </button>
    </div>
  );
}