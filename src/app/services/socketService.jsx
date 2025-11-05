/**
 * app/services/TokenService.js (o ruta equivalente)
 * Autor: Juan Jose Peña Quiñonez — CC: 1000273604
 *
 * Servicios:
 * - TokenService: obtiene y persiste token OAuth-like (password grant) en localStorage.
 * - WebSocketService: cliente neffos (Iris) para canal "delay" y evento "chat".
 *
 * Notas:
 * - Este archivo es "use client" (usa localStorage, window, WebSocket).
 * - Seguridad: actualmente envía el token por query string (URL) → ver README para recomendaciones.
 */
"use client";

import axios from "axios";
import * as neffos from "neffos.js";
/** Endpoints de auth y WS (HTTP y WS planos) */
const TOKEN_URL = "http://set-fx.com/api/v1/auth/access/token/";
const WS_BASE_URL = "ws://set-fx.com/ws/dolar";
/**
 * TokenService
 * - Administra un access_token en memoria y en localStorage.
 * - Implementa el "password grant" contra TOKEN_URL.
 */
class TokenService {
  constructor() {
    /** Token en memoria (si existe en localStorage, lo carga). */
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
  }
  /**
   * Solicita un access_token al backend (grant_type password).
   * @private
   * @param {string} username
   * @param {string} password
   * @returns {Promise<string|undefined>} access_token
   */
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
    /**
   * Flujo público para obtener y persistir token.
   * - Lanza error si el backend no retorna token.
   * - Persiste en memoria y localStorage.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<string>} token
   */
  async fetchToken(username, password) {
    const token = await this.#getToken(username, password);
    if (!token) throw new Error("No se recibió token");
    this.token = token;
    localStorage.setItem("auth-token", token);
    return token;
  }
  /** Devuelve el token actual (puede ser null). */
  getToken() { return this.token; }
  /** Limpia token en memoria y storage. */
  clearToken() { this.token = null; localStorage.removeItem("auth-token"); }
}
/**
 * WebSocketService (neffos.js)
 *
 * - Conecta a WS_BASE_URL incluyendo el token como query: `?token=...`
 * - Usa el namespace "delay" y el evento "chat".
 * - Expone:
 *   - addListener(fn): registra listeners a los mensajes entrantes.
 *   - send(payload): emite por "chat" (string o JSON.stringify(payload)).
 *   - disconnect(): cierra conexión y limpia refs.
 *
 * Notas:
 * - `neffos.dial` devuelve la conexión; luego `connection.connect("delay")` devuelve `nsConn`.
 * - `listener` es un arreglo de callbacks de usuario, que reciben `msg.Body`.
 * - No implementa reconexión ni validación de origen.
 */
class WebSocketService {
  constructor() {
    /** @type {neffos.Connection|null} conexión raíz (dial) */
    this.connection = null;  // dial()
    /** @type {neffos.NSConn|null} namespace "delay" */
    this.ns = null;          // nsConn de "delay"
    /** @type {Array<(data:any)=>void>} listeners de mensajes entrantes */
    this.listener = [];      // callbacks
  }
 /**
   * Conecta al servidor de WS con el token provisto.
   * @param {string} token
   * @returns {Promise<void>}
   */
  async connect(token) {
    const wsURL = `${WS_BASE_URL}?token=${token}`;

    this.connection = await neffos.dial(wsURL, {
      delay: {
         // El servidor envía mensajes por el evento "chat"
        chat: (_nsConn, msg) => {
          const body = msg.Body;
          // Distribuye el payload a todos los listeners registrados
          this.listener.forEach(fn => {
            try { fn(body); } catch {}  /* evitar romper el loop por errores de usuario */
          });
        },
      },
    });

    // Conecta al namespace "delay" y guarda el nsConn
    this.ns = await this.connection.connect("delay");
    // console.log("[WS] connected to namespace 'delay'");
  }
/**
   * Registra un listener para los mensajes entrantes.
   * @param {(data:any)=>void} fn
   */
  addListener(fn) { this.listener.push(fn); }
/**
   * Envía un payload por el evento "chat".
   * - Si `payload` no es string, se serializa a JSON.
   * - Si no hay nsConn, no hace nada.
   * @param {string|any} payload
   */
  send(payload) {
    if (!this.ns) return;
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    try {
      // console.log("[WS] ->", body);
      this.ns.emit("chat", body);
    } catch {}
    /* silencioso por ahora */
  }
/**
   * Cierra conexiones y limpia referencias.
   */
  disconnect() {
    try { this.ns?.close(); } catch {}
    try { this.connection?.close(); } catch {}
    this.ns = null;
    this.connection = null;
  }
}
/** Instancias únicas para uso global (singleton-like). */
export const tokenServices = new TokenService();
export const webSocketServices = new WebSocketService();
