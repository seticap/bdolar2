// src/services/TokenService.js
"use client"; // Añadir esto para Next.js

import { getToken } from "./axiosconnect";

class TokenService {
  constructor() {
    this.token =
      typeof window !== "undefined"
        ? localStorage.getItem("token-socket")
        : null;
  }

  async fetchToken(username, password) {

    const { success, token, error } = await getToken(username, password);
    if (success) {
      this.token = token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token-socket", token);
      }
      return token;
    } else {
      throw new Error(error);
    }
  }

  getToken() {
    return this.token;
    
  }
  
  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("token-socket");
    }
  }
}
// console.log(getToken);

const instance = new TokenService();
export default instance;
