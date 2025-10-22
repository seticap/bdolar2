"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function EpaycoButton({
  publicKey = ae022d333e2690638eaea6447d8796ba,
  name,
  description,
  amount,
  tax,
  tax_base,
  currency = "cop",
  country = "co",
  external = false,
  test = false,
  buttonText = "Pagar con ePayco",
  responseUrl,
  confirmationUrl,
}) {
  const handlerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.epayco && !handlerRef.current) {
      handlleRef.current = window.ePayco.checkout.configure({
        key: publicKey,
        test,
      });
    }
  }, [publicKey, test]);

  const openCheckout = () => {
    if (!handlleRef.current && window.ePayco) {
      handlleRef.current = window.ePayco.checkout.configure({
        key: publicKey,
        test,
      });
    }
    handlerRef.current?.open({
      name,
      description,
      currency,
      country,
      amount: String(amount),
      tax: String(tax),
      tax_base: String(tax_base),
      external: true,
      response: responseUrl,
      confirmation: confirmationUrl,
    });
  };

  return (
    <>
      <Script
        src="https://checkout.epayco.co/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
            if (window.ePayco && !handlerRef.current){
                handlerRef.current = window.ePayco.checkout.configure({
                    key: publicKey,
                    test,
                });
            }
        }}
      />
        <button onClick={openCheckout} className="epayco-button">
            {buttonText}
        </button>
    </>
  );
}
