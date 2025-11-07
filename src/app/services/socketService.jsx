"use client"

import axios from "axios"
import * as neffos from "neffos.js"

const TOKEN_URL = "http://set-fx.com/api/v1/auth/access/token/";
const WS_BASE_URL = "ws://set-fx.com/ws/dolar";

class TokenService {
    constructor() {
        this.token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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
        try {
            const token = await this.#getToken(username, password);
            if (!token) throw new Error("No se recibio el token");
            this.token = token;
            localStorage.setItem("auth-token", token);
            return token;
        } catch (err) {
            console.error("Error al obtener el token", err);
            throw err;
        }
    }

    getToken() {
        return this.token
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem("auth-token");
    }
}

class WebSocketService {
    constructor() {
        this.connection = null;
        this.listener = [];
    }

    async connect(token){
        const wsURL = `${WS_BASE_URL}?token=${token}`;
        this.connection = await neffos.dial(wsURL, {
            delay: {
                chat: (NSConn, msg) => {
                    this.listener.forEach((listener) => listener(msg.Body));
                },
            },
        });
        await this.connection.connect("delay");
    }

    addListener(listener) {
        this.listener.push(listener);
    }

    disconnect() {
        this.connection?.close();
        this.connection = null;
    }
}

export const tokenServices = new TokenService();
export const webSocketServices = new WebSocketService();