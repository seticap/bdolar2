"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Lista de países (puedes ampliarla/ajustarla)
const COUNTRIES = [
  "Argentina","Bolivia","Brasil","Chile","Colombia","Costa Rica","Cuba","Ecuador","El Salvador",
  "España","Estados Unidos","Guatemala","Honduras","México","Nicaragua","Panamá","Paraguay",
  "Perú","Puerto Rico","República Dominicana","Uruguay","Venezuela",
  "Alemania","Arabia Saudita","Australia","Austria","Bélgica","Canadá","China","Corea del Sur",
  "Dinamarca","Egipto","Emiratos Árabes Unidos","Eslovaquia","Eslovenia","Filipinas","Finlandia",
  "Francia","Grecia","Hungría","India","Indonesia","Irlanda","Israel","Italia","Japón","Luxemburgo",
  "Marruecos","Noruega","Nueva Zelanda","Países Bajos","Polonia","Portugal","Reino Unido","Rumanía",
  "Rusia","Singapur","Sudáfrica","Suecia","Suiza","Turquía","Ucrania","Vietnam",
].sort();

// Ciudades por país (amplía si quieres)
const CITIES_BY_COUNTRY = {
  Colombia: [
    "Bogotá","Medellín","Cali","Barranquilla","Cartagena","Bucaramanga","Pereira","Manizales",
    "Cúcuta","Santa Marta","Ibagué","Villavicencio","Pasto","Montería","Neiva","Armenia",
  ],
  México: [
    "Ciudad de México","Guadalajara","Monterrey","Puebla","Tijuana","León","Querétaro","Mérida",
    "Cancún","Toluca","San Luis Potosí","Aguascalientes","Hermosillo","Chihuahua","Saltillo",
  ],
  "Estados Unidos": [
    "New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego",
    "Dallas","San Jose","Austin","Jacksonville","San Francisco","Columbus","Charlotte",
  ],
  España: [
    "Madrid","Barcelona","Valencia","Sevilla","Zaragoza","Málaga","Murcia","Palma","Bilbao",
    "Alicante","Córdoba","Valladolid","Vigo","Gijón","Hospitalet de Llobregat",
  ],
  Perú: [
    "Lima","Arequipa","Trujillo","Chiclayo","Piura","Cusco","Iquitos","Huancayo","Tacna","Pucallpa",
  ],
  Chile: [
    "Santiago","Valparaíso","Concepción","La Serena","Antofagasta","Temuco","Rancagua","Iquique","Talca",
  ],
  Argentina: [
    "Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","San Miguel de Tucumán",
    "Salta","Santa Fe","Corrientes",
  ],
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    idType: "",
    idNumber: "",
    personType: "",
    country: "",
    city: "",
    company: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    interesDolar: false,
    interesAnalisis: false,
    aceptaTyC: false,
    aceptaDatosFX: false,
    aceptaDatosSecurities: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Solo letras (con tildes), espacios, apóstrofe y guion
  const sanitizeName = (v) => v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]/g, "");
  // Solo números
  const digitsOnly = (v) => v.replace(/\D/g, "");

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "firstName" || name === "lastName") {
      return setForm((f) => ({ ...f, [name]: sanitizeName(value) }));
    }
    if (name === "idNumber") {
      return setForm((f) => ({ ...f, idNumber: digitsOnly(value) }));
    }
    if (name === "country") {
      // Resetear ciudad cuando cambia el país
      return setForm((f) => ({ ...f, country: value, city: "" }));
    }

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Completa los campos obligatorios marcados con *");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!form.aceptaTyC || !form.aceptaDatosFX || !form.aceptaDatosSecurities) {
      setError("Debes aceptar todos los términos y políticas");
      return;
    }

    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 800));
    alert("Registro enviado. Revisaremos tu información.");
    router.push("/");
  };

  const citiesForCountry = CITIES_BY_COUNTRY[form.country] || null;

  return (
    <main className="min-h-screen bg-[#0d0b1d] flex justify-center items-start px-4 py-10">
      {/* Contenedor */}
      <div className="w-full bg-[#1f1f1f] rounded-xl md:rounded-2xl shadow-md overflow-hidden max-w-3xl md:max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Logo desktop */}
          <div className="col-span-2 hidden md:flex items-center justify-center p-8">
            <img src="/logoSet.png" alt="SET ICAP Logo" className="max-w-[80%] h-auto" />
          </div>

          {/* Logo mobile */}
          <div className="md:hidden flex items-center justify-center p-6">
            <img src="/logoSet.png" alt="SET ICAP Logo" className="max-w-[55%] h-auto" />
          </div>

          {/* Formulario */}
          <div className="col-span-3 px-5 py-6 sm:px-8 sm:py-8">
            <h2 className="text-white text-2xl font-bold mb-2">Registro</h2>
            <p className="text-gray-400 text-sm mb-6">
              Completa el formulario para crear tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre / Apellido */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">* Nombre</label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={onChange}
                    type="text"
                    placeholder="Nombre"
                    autoComplete="given-name"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">* Apellido</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={onChange}
                    type="text"
                    placeholder="Apellido"
                    autoComplete="family-name"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Tipo doc / Número */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Tipo de Id</label>
                  <select
                    name="idType"
                    value={form.idType}
                    onChange={onChange}
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  >
                    <option value="">Seleccione</option>
                    <option value="CC">Cédula</option>
                    <option value="CE">Cédula Extranjería</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Num. Identificación</label>
                  <input
                    name="idNumber"
                    value={form.idNumber}
                    onChange={onChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Número de documento"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
              </div>

              {/* País / Ciudad (dependiente) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">País</label>
                  <select
                    name="country"
                    value={form.country}
                    onChange={onChange}
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  >
                    <option value="">Seleccione un país</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 text-sm block mb-1">Ciudad</label>
                  {citiesForCountry ? (
                    <select
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      disabled={!form.country}
                      className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400 disabled:opacity-60"
                    >
                      <option value="">
                        {form.country ? "Seleccione ciudad" : "Seleccione país"}
                      </option>
                      {citiesForCountry.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      disabled={!form.country}
                      placeholder={form.country ? "Ciudad" : "Seleccione país"}
                      className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400 disabled:opacity-60"
                    />
                  )}
                </div>
              </div>

              {/* Tipo persona / Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Tipo de Persona</label>
                  <select
                    name="personType"
                    value={form.personType}
                    onChange={onChange}
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  >
                    <option value="">Seleccione</option>
                    <option value="NATURAL">Persona Natural</option>
                    <option value="JURIDICA">Persona Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Empresa</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={onChange}
                    type="text"
                    placeholder="Empresa"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Email / Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">* Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    type="email"
                    placeholder="Correo electrónico"
                    autoComplete="email"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">Teléfono</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    type="tel"
                    placeholder="+57 300 000 0000"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Password / Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 text-sm block mb-1">* Contraseña</label>
                  <input
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm block mb-1">* Repite contraseña</label>
                  <input
                    name="confirm"
                    value={form.confirm}
                    onChange={onChange}
                    type="password"
                    placeholder="Repite contraseña"
                    className="w-full px-4 py-2 rounded bg-[#1f1f1f] text-white placeholder-gray-500 border border-gray-600 focus:outline-none focus:ring-0 focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Intereses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2 text-gray-200">
                  <input
                    type="checkbox"
                    name="interesDolar"
                    checked={form.interesDolar}
                    onChange={onChange}
                    className="accent-[#1f4e85]"
                  />
                  Dólar
                </label>
                <label className="flex items-center gap-2 text-gray-200">
                  <input
                    type="checkbox"
                    name="interesAnalisis"
                    checked={form.interesAnalisis}
                    onChange={onChange}
                    className="accent-[#1f4e85]"
                  />
                  Análisis Técnico
                </label>
              </div>

              {/* Términos y políticas */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    name="aceptaTyC"
                    checked={form.aceptaTyC}
                    onChange={onChange}
                    className="accent-[#1f4e85]"
                  />
                  Acepto los <a href="#" className="underline">Términos y Condiciones</a>
                </label>

                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    name="aceptaDatosFX"
                    checked={form.aceptaDatosFX}
                    onChange={onChange}
                    className="accent-[#1f4e85]"
                  />
                  Acepto las Políticas de Tratamiento de Datos personales SET‑ICAP FX
                </label>

                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    name="aceptaDatosSecurities"
                    checked={form.aceptaDatosSecurities}
                    onChange={onChange}
                    className="accent-[#1f4e85]"
                  />
                  Acepto las Políticas de Tratamiento de Datos personales SET‑ICAP SECURITIES
                </label>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1f4e85] text-white py-2 rounded hover:bg-[#173861] transition-colors disabled:opacity-60"
              >
                {submitting ? "Registrando..." : "Registrarse"}
              </button>

              <div className="mt-3 text-center">
                <a href="/" className="text-sm text-gray-300 hover:underline">
                  Regresar al inicio de sesión
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
