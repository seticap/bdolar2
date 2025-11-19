"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

const MarketFilterContext = createContext();

export function MarketFilterProvider({ children, defaultMarket = 71 }) {
    const [market, setMarket] = useState(
        [71, 76, null].includes(defaultMarket) ? defaultMarket : 71
    );

    const value = useMemo(() => ({ market, setMarket }), [market]);
    return (
        <MarketFilterContext.Provider value={value}>
            {children}
        </MarketFilterContext.Provider>
    );
}

export const useMarketFilter = () => useContext(MarketFilterContext);

export function matchesMarket(message, activeMarket) {
    if (activeMarket == null) return true; // sin filtro
    const m =
        message?.market ??
        message?.data?.market ??
        message?.result?.market ??
        message?.message?.market ??
        null;
    return m == null ? true : Number(m) === Number(activeMarket);
}
