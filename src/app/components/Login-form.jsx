"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

import { tokenServices } from "@/app/services/socketService";
import { cookieManager } from "@/app/services/cookieManager";

export function LoginForm() {
    const router = useRouter();

    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setLoading(true);

        try {
            const token = await tokenServices.fetchToken(user, password);

            // 🔹 Cookie = condición para acceder a vistas protegidas
            cookieManager.setCookie("auth-token", token, 1);
            cookieManager.setCookie("auth-user", user, 1);

            console.log("[Login] Cookie auth-token creada:", document.cookie);

            router.push("/dashboard/spot");
        } catch (err) {
            console.error("[login] Error: ", err);
            setErrorMsg("Credenciales inválidas o error al autenticar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-180">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2 text-white">
                    <div className="relative hidden md:block gradient-custom-vertical">
                        <img
                            src="/logoSet.png"
                            alt="Image"
                            className="py-30 justify-center items-center"
                        />
                        <div className="text-center text-sm">
                            ¿Aún no tienes una cuenta?{" "}
                            <a
                                className="underline underline-offset-2 hover:underline cursor-pointer"
                                onClick={() => {
                                    router.push("/register");
                                }}
                            >
                                Registrate
                            </a>
                        </div>
                        <br />
                    </div>

                    <form
                        className="p-6 md:p-8 gradient-custom-vertical"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col gap-6 mt-12">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Inicio de Sesión</h1>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="usuario">Usuario</Label>
                                <Input
                                    id="usuario"
                                    type="text"
                                    required
                                    value={user}
                                    onChange={(e) => setUser(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <a
                                        className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer"
                                        onClick={() => {
                                            router.push("/forgot-password");
                                        }}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {errorMsg && (
                                <p className="text-sm text-red-400 text-center">{errorMsg}</p>
                            )}

                            <div className="col-span-2 flex justify-center pt-4">
                                <Button
                                    type="submit"
                                    className="w-40 bg-blue-900"
                                    disabled={loading}
                                >
                                    {loading ? "Ingresando..." : "Iniciar Sesión"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
