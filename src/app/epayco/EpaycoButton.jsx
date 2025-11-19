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
        <div className="w-full flex justify-center mt-4">
            <button
                onClick={openCheckout}
                aria-label={name}
                title={handler ? name : "Cargando…"}
                className={`inline-flex items-center justify-center rounded-md px-5 py-2
                                text-xs font-semibold tracking-[0.08em] uppercase shadow-md
          transition-colors transition-transform duration-150
          ${
                    handler
                        ? "bg-[#33508d] hover:bg-[#354e94] text-white hover:shadow-lg hover:-translate-y-[1px] cursor-pointer"
                        : "bg-slate-600 text-white/70 cursor-not-allowed opacity-70"
                }`}
            >
                Suscribirme
            </button>
        </div>
    );
}