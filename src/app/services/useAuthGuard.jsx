"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cookieManager } from "@/app/services/cookieManager";
import { webSocketServices } from "@/app/services/socketService";

export const useAuthGuard = () => {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const hasAuth = cookieManager.hasCookie("auth-token");

        if (!hasAuth) {
            try {
                webSocketServices.disconnect();
            } catch (_) {}

            window.localStorage.removeItem("auth-token");
            router.replace("/");
        }
    }, [router]);
};
