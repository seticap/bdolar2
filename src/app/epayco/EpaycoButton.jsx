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
  buttonUrl = "/minilogo.png",
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
        console.log("[EpaycoButton] handler configurado");
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

  return (
    <button
      onClick={openCheckout}
      style={{
        border: "1px solid #ddd",
        padding: 0,
        cursor: handler ? "pointer" : "not-allowed",
        borderRadius: 8,
      }}
      aria-label={name}
      title={handler ? name : "Cargando…"}
    >
    <h1>Suscribirme</h1>
    </button>
  );
}
