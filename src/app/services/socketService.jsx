"use client";

import axios from "axios";
import * as neffos from "neffos.js";

const TOKEN_URL = "http://set-fx.com/api/v1/auth/access/token/";
const WS_BASE_URL = "ws://set-fx.com/ws/dolar";

class TokenService {
  constructor() {
    this.token =
      typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
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
    if (!token) throw new Error("No se recibió el token");
    this.token = token;
    localStorage.setItem("auth-token", token);
    return token;
  }

  getToken() {
    return this.token;
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
    this.currentNS = "delay";
    this.lastToken = null;
  }

  addListener(listener) {
    this.listener.push(listener);
  }

  async connect(token, namespace = "delay") {
    if (this.connection) {
      try {
        this.connection.close();
      } catch (_) {}
      this.connection = null;
    }

    this.lastToken = token;
    this.currentNS = namespace;

    const wsURL = `${WS_BASE_URL}?token=${token}`;

    const namespaces = {};
    namespaces[namespace] = {
      chat: (_NSConn, msg) => {
        this.listener.forEach((listener) => listener(msg.Body));
      },
    };

    this.connection = await neffos.dial(wsURL, namespaces);
    await this.connection.connect(namespace);
  }

  async switchNamespace(namespace) {
    if (!this.lastToken) throw new Error("No hay token para reconectar");
    await this.connect(this.lastToken, namespace);
  }

  disconnect() {
    try {
      this.connection?.close();
    } catch (_) {}
    this.connection = null;
  }
}

export const tokenServices = new TokenService();
export const webSocketServices = new WebSocketService();
