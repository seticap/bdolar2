"use client";

import axios from "axios";
import * as neffos from "neffos.js";

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
    const token = await this.#getToken(username, password);
    if (!token) throw new Error("No se recibió token");
    this.token = token;
    localStorage.setItem("auth-token", token);
    return token;
  }
  getToken() { return this.token; }
  clearToken() { this.token = null; localStorage.removeItem("auth-token"); }
}

class WebSocketService {
  constructor() {
    this.connection = null;  // dial()
    this.ns = null;          // nsConn de "delay"
    this.listener = [];      // callbacks
  }

  async connect(token) {
    const wsURL = `${WS_BASE_URL}?token=${token}`;

    this.connection = await neffos.dial(wsURL, {
      delay: {
        // el servidor usa el evento "chat"
        chat: (_nsConn, msg) => {
          const body = msg.Body;
          // console.log("[WS] <-", body);
          this.listener.forEach(fn => {
            try { fn(body); } catch {}
          });
        },
      },
    });

    // guarda el nsConn para poder emitir luego
    this.ns = await this.connection.connect("delay");
    // console.log("[WS] connected to namespace 'delay'");
  }

  addListener(fn) { this.listener.push(fn); }

  // ✅ ahora sí tenemos un send
  send(payload) {
    if (!this.ns) return;
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    try {
      // console.log("[WS] ->", body);
      this.ns.emit("chat", body);
    } catch {}
  }

  disconnect() {
    try { this.ns?.close(); } catch {}
    try { this.connection?.close(); } catch {}
    this.ns = null;
    this.connection = null;
  }
}

export const tokenServices = new TokenService();
export const webSocketServices = new WebSocketService();
