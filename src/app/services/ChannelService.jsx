"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

const ChannelContext = createContext();

export const VALID_CHANNELS = ["delay", "dolar"];

export function ChannelProvider({ children, defaultChannel = "delay" }) {
    const [channel, setChannel] = useState(
        VALID_CHANNELS.includes(defaultChannel) ? defaultChannel : "delay"
    );

    const value = useMemo(() => ({ channel, setChannel, VALID_CHANNELS }), [channel]);
    return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>;
}

export const useChannel = () => useContext(ChannelContext);
