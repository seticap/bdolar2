"use client";

export const cookieManager = {
    // Establecer una cookie
    setCookie(name, value, days) {
        if (typeof document === "undefined") return;

        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
        }

        document.cookie =
            name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    },

    // Obtener una cookie
    getCookie(name) {
        if (typeof document === "undefined") return null;

        const nameEQ = name + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    },

    // Eliminar una cookie
    deleteCookie(name) {
        if (typeof document === "undefined") return;

        document.cookie =
            name +
            "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;";
    },

    // Verificar si existe una cookie (SIN usar `this` para evitar problemas)
    hasCookie(name) {
        if (typeof document === "undefined") return false;

        const cookies = document.cookie.split(";").map((c) => c.trim());
        const found = cookies.some((c) => c.startsWith(`${name}=`));

        console.log("[cookieManager] hasCookie", name, "=>", found);
        return found;
    },
};
