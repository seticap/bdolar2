"use client";

import axios from "axios";
import * as neffos from "neffos.js";

const TOKEN_URL = "http://set-fx.com/api/v1/auth/access/token/";
const WS_BASE_URL = "ws://set-fx.com/ws/dolar";

class TokenService {
    constructor() {
        this.token =
            typeof window !== "undefined"
                ? localStorage.getItem("auth-token")
                : null;
    }

    async #getToken(username, password) {
        const requestData = {
            grant_type: "password",
            username,
            password,
            project_id: "19e28843-6f59-461e-af9e-effbce1f5dd4",
        };

        const response = await axios.post(TOKEN_URL, requestData);
        return response.data?.payload?.access_token;
    }

    async fetchToken(username, password) {
        const token = await this.#getToken(username, password);
        if (!token) throw new Error("No se recibió token");

        this.token = token;
        localStorage.setItem("auth-token", token);
        return token;
    }

    getToken() {
        return this.token;
    }
}

class WebSocketService {
    constructor() {
        this.connection = null;
        this.listeners = new Set(); // <--- evita duplicados
        this.lastToken = null;
        this.currentNS = null; // canal activo
    }

    addListener(fn) {
        this.listeners.add(fn);
    }

    removeListener(fn) {
        this.listeners.delete(fn);
    }

    async connect(token, namespace = "delay") {
        // evitar reconectar al mismo canal
        if (this.connection && this.currentNS === namespace) {
            console.warn("WS: ya conectado a", namespace);
            return;
        }

        // cerrar conexión anterior
        if (this.connection) {
            try {
                this.connection.close();
            } catch (_) {}
            this.connection = null;
        }

        this.lastToken = token;
        this.currentNS = namespace;

        const wsURL = `${WS_BASE_URL}?token=${token}`;

        const namespaces = {
            [namespace]: {
                chat: (_c, msg) => {
                    for (const fn of this.listeners) {
                        fn({
                            ns: namespace,
                            text: msg.Body,
                        });
                    }
                },
            },
        };

        this.connection = await neffos.dial(wsURL, namespaces);
        await this.connection.connect(namespace);
    }

    disconnect() {
        try {
            this.connection?.close();
        } catch (_) {}
        this.connection = null;
        this.currentNS = null;
    }
}

export const tokenServices = new TokenService();
export const webSocketServices = new WebSocketService();
