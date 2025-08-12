/**
 * RegisterPage.jsx
 * 
 *  Componente de formulario de registro SET-ICAP
 *   - Validación progresiva y global
 *   - Dependencia País -> Ciudad
 *   - Intereses (opción exclusiva)
 *   - Aceptación de políticas obligatoria
 *   - Mostrar/ocultar contraseña + medidor de fortaleza
 *   - Toast de feedback
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

/** Lista de países ordenada alfabéticamente (ES) */
const COUNTRIES = [
  "Argentina",
  "Alemania",
  "Australia",
  "Aruba",
  "Bolivia",
  "Brasil",
  "Islas Virgenes Britanicas",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Republica Dominicana",
  "Ecuador",
  "Emiratos Arabes Unidos",
  "España",
  "Estados Unidos",
  "Francia",
  "Guatemala",
  "Hungria",
  "Italia",
  "Mexico",
  "Nueva Zelanda",
  "Paises Bajos",
  "Panama",
  "Peru",
  "Puerto Rico",
  "Uruguay",
  "Venezuela",
  "otro",
].sort((a, b) => a.localeCompare(b, "es-ES", { sensitivity: "base" }));

/** Ciudades por país (usadas al seleccionar un país) */
const CITIES_BY_COUNTRY = {
  Argentina: [
    "Buenos Aires",
    "Córdoba",
    "Rosario",
    "Mendoza",
    "La Plata",
    "Mar del Plata",
    "San Miguel de Tucumán",
    "Salta",
    "Santa Fe",
    "Corrientes",
  ],
  Alemania: [
    "Berlín",
    "Múnich",
    "Hamburgo",
    "Fráncfort",
    "Colonia",
    "Stuttgart",
    "Düsseldorf",
  ],
  Australia: [
    "Sídney",
    "Melbourne",
    "Brisbane",
    "Perth",
    "Adelaida",
    "Gold Coast",
    "Canberra",
  ],
  Aruba: ["Oranjestad", "San Nicolás", "Paradera", "Santa Cruz", "Noord"],
  Bolivia: [
    "La Paz",
    "Santa Cruz de la Sierra",
    "Cochabamba",
    "Sucre",
    "Oruro",
    "Potosí",
  ],
  Brasil: [
    "São Paulo",
    "Río de Janeiro",
    "Brasilia",
    "Salvador",
    "Fortaleza",
    "Belo Horizonte",
    "Curitiba",
  ],
  "Islas Virgenes Britanicas": [
    "Road Town",
    "Spanish Town",
    "Anegada",
    "Great Harbour",
  ],
  Canada: [
    "Toronto",
    "Vancouver",
    "Montreal",
    "Calgary",
    "Ottawa",
    "Edmonton",
    "Quebec",
  ],
  Chile: [
    "Santiago",
    "Valparaíso",
    "Concepción",
    "La Serena",
    "Antofagasta",
    "Temuco",
    "Rancagua",
    "Iquique",
    "Talca",
  ],
  China: [
    "Pekín",
    "Shanghái",
    "Guangzhou",
    "Shenzhen",
    "Chengdu",
    "Wuhan",
    "Hangzhou",
  ],
  Colombia: [
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Bucaramanga",
    "Pereira",
    "Manizales",
    "Cúcuta",
    "Santa Marta",
    "Ibagué",
    "Villavicencio",
    "Pasto",
    "Montería",
    "Neiva",
    "Armenia",
  ],
  "Costa Rica": [
    "San José",
    "Alajuela",
    "Cartago",
    "Heredia",
    "Puntarenas",
    "Liberia",
    "Limón",
  ],
  "Republica Dominicana": [
    "Santo Domingo",
    "Santiago de los Caballeros",
    "La Romana",
    "San Pedro de Macorís",
    "Puerto Plata",
    "Higüey",
  ],
  Ecuador: [
    "Quito",
    "Guayaquil",
    "Cuenca",
    "Santo Domingo",
    "Machala",
    "Manta",
    "Ambato",
  ],
  "Emiratos Arabes Unidos": [
    "Dubái",
    "Abu Dabi",
    "Sharjah",
    "Ajmán",
    "Ras al-Jaima",
    "Fujairah",
  ],
  España: [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Sevilla",
    "Zaragoza",
    "Málaga",
    "Murcia",
    "Palma",
    "Bilbao",
    "Alicante",
    "Córdoba",
    "Valladolid",
    "Vigo",
    "Gijón",
    "Hospitalet de Llobregat",
  ],
  "Estados Unidos": [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
    "Austin",
    "Jacksonville",
    "San Francisco",
    "Columbus",
    "Charlotte",
  ],
  Francia: [
    "París",
    "Marsella",
    "Lyon",
    "Toulouse",
    "Niza",
    "Nantes",
    "Estrasburgo",
  ],
  Guatemala: [
    "Ciudad de Guatemala",
    "Quetzaltenango",
    "Escuintla",
    "Antigua Guatemala",
    "Chimaltenango",
  ],
  Hungria: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr"],
  Italia: ["Roma", "Milán", "Nápoles", "Turín", "Palermo", "Génova", "Bolonia"],
  Mexico: [
    "Ciudad de México",
    "Guadalajara",
    "Monterrey",
    "Puebla",
    "Tijuana",
    "León",
    "Querétaro",
    "Mérida",
    "Cancún",
    "Toluca",
    "San Luis Potosí",
    "Aguascalientes",
    "Hermosillo",
    "Chihuahua",
    "Saltillo",
  ],
  "Nueva Zelanda": [
    "Auckland",
    "Wellington",
    "Christchurch",
    "Hamilton",
    "Tauranga",
    "Dunedin",
  ],
  "Paises Bajos": [
    "Ámsterdam",
    "Róterdam",
    "La Haya",
    "Utrecht",
    "Eindhoven",
    "Tilburgo",
  ],
  Panama: [
    "Ciudad de Panamá",
    "Colón",
    "David",
    "Santiago",
    "Chitré",
    "La Chorrera",
  ],
  Peru: [
    "Lima",
    "Arequipa",
    "Trujillo",
    "Chiclayo",
    "Piura",
    "Cusco",
    "Iquitos",
    "Huancayo",
    "Tacna",
    "Pucallpa",
  ],
  "Puerto Rico": [
    "San Juan",
    "Ponce",
    "Mayagüez",
    "Bayamón",
    "Carolina",
    "Arecibo",
  ],
  Uruguay: [
    "Montevideo",
    "Salto",
    "Paysandú",
    "Las Piedras",
    "Rivera",
    "Maldonado",
  ],
  Venezuela: [
    "Caracas",
    "Maracaibo",
    "Valencia",
    "Barquisimeto",
    "Maracay",
    "Ciudad Guayana",
    "Maturín",
  ],
  otro: ["Otra ciudad"],
};

export default function RegisterPage() {
  const router = useRouter();

  /** Estado del formulario (datos controlados) */
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
/**Mensajes de error por campo */
  const [errors, setErrors] = useState({});
/**Estado de envío */
  const [submitting, setSubmitting] = useState(false);

/** Toast flotante (éxito/error) */
  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });
  /** Toggle de visibilidad de contraseñas */
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /**
   * Evalúa la fortaleza de una contraseña.
   * Retorna Label/color/percent para la barra visual
   * 
   */
  function passwordStrength(pw = "") {
    const length = pw.length >= 8;
    const lower = /[a-z]/.test(pw);
    const upper = /[A-Z]/.test(pw);
    const digit = /\d/.test(pw);
    const special = /[^\w\s]/.test(pw);

    let score = 0;
    if (length && lower) score++;
    if (length && upper) score++;
    if (length && digit) score++;
    if (length && special) score++;

    let label = "Débil",
      color = "bg-red-500";
    if (score === 2) {
      label = "Aceptable";
      color = "bg-yellow-500";
    }
    if (score === 3) {
      label = "Buena";
      color = "bg-emerald-500";
    }
    if (score === 4) {
      label = "Fuerte";
      color = "bg-green-600";
    }

    const percent = (score / 4) * 100;
    return { score, label, color, percent };
  }
/**
 * Muestra un toast por x ms
 *  Guardamos el id del timeout en una propiedad del mismo function object
 *  para poder limpiarlo entre invocaciones consecutivas.
 */
  const showToast = (type, message, duration = 3500) => {
    setToast({ show: true, type, message });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(
      () => setToast((t) => ({ ...t, show: false })),
      duration
    );
  };

//------------- Helpers de formato/validación -----------------
  
  /**Permite solo letras, acentos, espacios, apóstrofe y guion (para nombres) */
  const sanitizeName = (v) => v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]/g, "");
  /** Solo dígitos (para documento y telefono) */
  const digitsOnly = (v) => v.replace(/\D/g, "");
  /** Email simple */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v);
  /** Contraseña robusta: 8+, minúscula, mayúscula, número y simbolo */
  const isStrongPass = (v) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(v);
  /** Seteo (o Limpia) el error de un campo */
  const setFieldError = (name, message) =>
    setErrors((prev) => ({ ...prev, [name]: message || undefined }));

  /**Valida un campo y devuelve el mensaje de error (o cadena vacia si esta ok) */
  const validateField = (name, value, current = form) => {
    switch (name) {
      case "firstName":
        if (!value) return "El nombre es obligatorio.";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(value))
          return "Solo letras y espacios.";
        return "";
      case "lastName":
        if (!value) return "El apellido es obligatorio.";
        if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/.test(value))
          return "Solo letras y espacios.";
        return "";
      case "email":
        if (!value) return "El email es obligatorio.";
        if (!isEmail(value)) return "Email inválido.";
        return "";
      case "idType":
        if (!value) return "Selecciona un tipo de Id.";
        return "";
      case "country":
        if (!value) return "Selecciona un país.";
        return "";
      case "city":
        if (!value) return "Selecciona una ciudad.";
        return "";
      case "personType":
        if (!value) return "Selecciona un tipo de persona.";
        return "";
      case "idNumber":
        if (!value) return "El número de identificación es obligatorio.";
        if (!/^\d+$/.test(value)) return "Solo números.";
        return "";
      case "phone":
        if (!value) return "El teléfono es obligatorio.";
        if (!/^\d+$/.test(value)) return "Solo números.";
        if (value.length < 10) return "Debe tener al menos 10 dígitos.";
        return "";
      case "company":
        if (!value.trim()) return "La empresa es obligatoria.";
        return "";
      case "password":
        if (!value) return "La contraseña es obligatoria.";
        if (!isStrongPass(value))
          return "Mín. 8, mayúscula, minúscula, número y especial.";
        return "";
      case "confirm":
        if (!value) return "Confirma la contraseña.";
        if (value !== current.password) return "No coincide con la contraseña.";
        return "";
      default:
        return "";
    }
  };
/** Valida todos los campos requeridos y reglas de negocio */
  const validateAll = () => {
    const fields = [
      "firstName",
      "lastName",
      "email",
      "idType",
      "country",
      "city",
      "personType",
      "idNumber",
      "phone",
      "company",
      "password",
      "confirm",
    ];
    const newErrors = {};
    fields.forEach((f) => {
      const msg = validateField(f, form[f]);
      if (msg) newErrors[f] = msg;
    });
    // Debe seleccionar al menos un interés
    if (!(form.interesDolar || form.interesAnalisis)) {
      newErrors.interes = "Selecciona una opción de interés.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
/** Maneja cambios; normaliza valores y revalida el campo actualizado */
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    // Exclusividad entre intereses
    if (name === "interesDolar" || name === "interesAnalisis") {
      const updated = {
        ...form,
        interesDolar: name === "interesDolar" ? checked : false,
        interesAnalisis: name === "interesAnalisis" ? checked : false,
      };
      setForm(updated);
      setFieldError(
        "interes",
        !(updated.interesDolar || updated.interesAnalisis)
          ? "Selecciona una opción de interés."
          : ""
      );
      return;
    }
// Normalizaciones
    let nextValue = value;
    if (name === "firstName" || name === "lastName")
      nextValue = sanitizeName(value);
    if (name === "idNumber" || name === "phone") nextValue = digitsOnly(value);

    const updated = {
      ...form,
      [name]: type === "checkbox" ? checked : nextValue,
      ...(name === "country" ? { city: "" } : {}), // reset de ciudad al cambiar pais
    };
    setForm(updated);
    setFieldError(name, validateField(name, nextValue, updated));
  };

    /**Valida al perder foco */
  const onBlur = (e) => {
    const { name, value } = e.target;
    if (name === "interesDolar" || name === "interesAnalisis") {
      setFieldError(
        "interes",
        !(form.interesDolar || form.interesAnalisis)
          ? "Selecciona una opción de interés."
          : ""
      );
      return;
    }
    setFieldError(name, validateField(name, value));
  };
/** Envio del formulario ( simulado ) */
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!validateAll()) {
      showToast("error", "Corrige los campos resaltados e inténtalo de nuevo.");
      return;
    }
    // Todas las politicas son obligatorias
    if (!form.aceptaTyC || !form.aceptaDatosFX || !form.aceptaDatosSecurities) {
      setFieldError(
        "policies",
        "Debes aceptar todos los términos y políticas."
      );
      showToast("error", "Debes aceptar los términos y políticas.");
      return;
    } else {
      setFieldError("policies", "");
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    showToast("success", "Registro enviado. Revisaremos tu información.");
    setTimeout(() => router.push("/"), 900);
  };
/** Lista de ciudades del pais actual (si aplica) */
  const citiesForCountry = CITIES_BY_COUNTRY[form.country] || null;

  /**Clases base para inputs compactos */
  const inputBase =
    "w-full h-8 px-2.5 rounded-sm bg-[#1f1f1f] text-white text-[13px] \
placeholder-gray-500 border border-gray-600 focus:outline-none \
focus:ring-0 focus:border-gray-400";

  return (
    <main className="min-h-screen w-full bg-[#0d0b1d] flex items-center justify-center px-3 sm:px-6 py-6">
      {/* Card principal (con scroll interno en el formulario) */}
      <section className="w-full max-w-4xl lg:max-w-5xl bg-[#1f1f1f] border border-gray-700 rounded-md shadow-sm overflow-hidden max-h-[90vh]">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* columna de lo logo */}
          <div className="lg:col-span-2 flex items-center justify-center p-5 lg:p-6 bg-[#1f1f1f] border-b border-gray-700 lg:border-b-0 lg:border-r">
            <img
              src="/logoSet.png"
              alt="SET ICAP Logo"
              className="w-36 sm:w-44 lg:w-52 h-auto"
            />
          </div>

          {/* Formulario: scroll interno si llegase a faltar espacio */}
          {/* Formulario: contenido scroll + footer sticky */}
          {/* Formulario: contenido scroll + footer sticky */}
          <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col max-h-[88vh]">
            <h2 className="text-white text-xl font-semibold mb-1">Registro</h2>
            <p className="text-gray-400 text-[11px] mb-2">
              Completa el formulario para crear tu cuenta.
            </p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="relative flex-1 flex flex-col min-h-0"
            >
              {/* CONTENIDO: scrollea si hace falta */}
              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-2">
                {/* ...(todos los campos)*/}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Nombre
                    </label>
                    <input
                      name="firstName"
                      value={form.firstName}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="text"
                      required
                      placeholder="Nombre"
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                      className={`${inputBase} ${
                        errors.firstName && "border-red-500"
                      }`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 text-xs block mb-0.5">
                      - Apellido
                    </label>
                    <input
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="text"
                      required
                      placeholder="Apellido"
                      autoComplete="family-name"
                      aria-invalid={!!errors.lastName}
                      className={`${inputBase} ${
                        errors.lastName && "border-red-500"
                      }`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tipo doc / Número */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Tipo de Id
                    </label>
                    <select
                      name="idType"
                      value={form.idType}
                      onChange={onChange}
                      onBlur={onBlur}
                      required
                      aria-invalid={!!errors.idType}
                      className={`${inputBase} ${
                        errors.idType && "border-red-500"
                      }`}
                    >
                      <option value="">Seleccione</option>
                      <option value="CC">Cédula</option>
                      <option value="CE">Cédula Extranjería</option>
                      <option value="NIT">NIT</option>
                      <option value="PAS">Pasaporte</option>
                    </select>
                    {errors.idType && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.idType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Num. Identificación
                    </label>
                    <input
                      name="idNumber"
                      value={form.idNumber}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Número de documento"
                      aria-invalid={!!errors.idNumber}
                      className={`${inputBase} ${
                        errors.idNumber && "border-red-500"
                      }`}
                    />
                    {errors.idNumber && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.idNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* País / Ciudad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - País
                    </label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={onChange}
                      onBlur={onBlur}
                      required
                      aria-invalid={!!errors.country}
                      className={`${inputBase} ${
                        errors.country && "border-red-500"
                      }`}
                    >
                      <option value="">Seleccione un país</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.country && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.country}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Ciudad
                    </label>
                    {CITIES_BY_COUNTRY[form.country] ? (
                      <select
                        name="city"
                        value={form.city}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={!form.country}
                        required
                        aria-invalid={!!errors.city}
                        className={`${inputBase} ${
                          errors.city && "border-red-500"
                        } disabled:opacity-60`}
                      >
                        <option value="">
                          {form.country
                            ? "Seleccione ciudad"
                            : "Seleccione país"}
                        </option>
                        {CITIES_BY_COUNTRY[form.country].map((city) => (
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
                        onBlur={onBlur}
                        disabled={!form.country}
                        required
                        aria-invalid={!!errors.city}
                        placeholder={
                          form.country ? "Ciudad" : "Seleccione país"
                        }
                        className={`${inputBase} ${
                          errors.city && "border-red-500"
                        } disabled:opacity-60`}
                      />
                    )}
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-400">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Tipo persona / Empresa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Tipo de Persona
                    </label>
                    <select
                      name="personType"
                      value={form.personType}
                      onChange={onChange}
                      onBlur={onBlur}
                      required
                      aria-invalid={!!errors.personType}
                      className={`${inputBase} ${
                        errors.personType && "border-red-500"
                      }`}
                    >
                      <option value="">Seleccione</option>
                      <option value="NATURAL">Persona Natural</option>
                      <option value="JURIDICA">Persona Jurídica</option>
                    </select>
                    {errors.personType && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.personType}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Empresa
                    </label>
                    <input
                      name="company"
                      value={form.company}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="text"
                      required
                      placeholder="Empresa"
                      aria-invalid={!!errors.company}
                      className={`${inputBase} ${
                        errors.company && "border-red-500"
                      }`}
                    />
                    {errors.company && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email / Teléfono */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Email
                    </label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="email"
                      required
                      placeholder="correo@dominio.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      className={`${inputBase} ${
                        errors.email && "border-red-500"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Teléfono
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      onBlur={onBlur}
                      type="tel"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="+57 3000000000"
                      aria-invalid={!!errors.phone}
                      className={`${inputBase} ${
                        errors.phone && "border-red-500"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Password / Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Contraseña
                    </label>

                    <div className="relative">
                      <input
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        onBlur={onBlur}
                        type={showPass ? "text" : "password"}
                        required
                        placeholder="Contraseña"
                        autoComplete="new-password"
                        aria-invalid={!!errors.password}
                        className={`${inputBase} ${
                          errors.password && "border-red-500"
                        } pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-white focus:outline-none"
                      >
                        {showPass ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* Barra de fortaleza */}
                    {form.password &&
                      (() => {
                        const { label, color, percent } = passwordStrength(
                          form.password
                        );
                        return (
                          <div className="mt-1">
                            <div className="h-1.5 w-full bg-gray-700 rounded">
                              <div
                                className={`h-1.5 rounded ${color} transition-all`}
                                style={{ width: `${percent}%` }}
                                aria-hidden="true"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Fortaleza:{" "}
                              <span className="text-white">{label}</span>
                            </p>
                          </div>
                        );
                      })()}

                    <p className="text-[10px] leading-tight text-gray-400 mt-0.5">
                      Debe incluir mayúscula, minúscula, número y caracter
                      especial.
                    </p>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-400" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm block mb-1">
                      - Repite contraseña
                    </label>
                    <div className="relative">
                      <input
                        name="confirm"
                        value={form.confirm}
                        onChange={onChange}
                        onBlur={onBlur}
                        type={showConfirm ? "text" : "password"}
                        required
                        placeholder="Repite contraseña"
                        autoComplete="new-password"
                        aria-invalid={!!errors.confirm}
                        className={`${inputBase} ${
                          errors.confirm && "border-red-500"
                        } pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-white focus:outline-none"
                      >
                        {showConfirm ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirm && (
                      <p className="mt-1 text-xs text-red-400" role="alert">
                        {errors.confirm}
                      </p>
                    )}
                  </div>
                </div>

                {/* Intereses */}
                <p className="text-gray-300">
                  Indique los servicios que necesitas:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <label className="flex items-center gap-2 text-gray-200 text-xs">
                    <input
                      type="checkbox"
                      name="interesDolar"
                      checked={form.interesDolar}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="accent-[#1f4e85]"
                    />
                    Plataforma Dólar
                  </label>
                  <label className="flex items-center gap-2 text-gray-200 text-xs leading-tight">
                    <input
                      type="checkbox"
                      name="interesAnalisis"
                      checked={form.interesAnalisis}
                      onChange={onChange}
                      onBlur={onBlur}
                      className="accent-[#1f4e85]"
                    />
                    Análisis Técnico
                  </label>
                </div>
                {errors.interes && (
                  <p className="text-xs text-red-400">{errors.interes}</p>
                )}

                {/* Términos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  <label className="flex items-start gap-2 text-gray-300 text-xs leading-tight">
                    <input
                      type="checkbox"
                      name="aceptaTyC"
                      checked={form.aceptaTyC}
                      onChange={onChange}
                      className="accent-[#1f4e85] mt-0.5"
                    />
                    <span>
                      Acepto los{" "}
                      <a
                        href="https://set-icap.com/terminos-y-condiciones.pdf"
                        className="underline"
                      >
                        Términos y Condiciones
                      </a>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-gray-300 text-xs leading-tight sm:col-span-2">
                    <input
                      type="checkbox"
                      name="aceptaDatosFX"
                      checked={form.aceptaDatosFX}
                      onChange={onChange}
                      className="accent-[#1f4e85] mt-0.5"
                    />
                    <span>
                      Acepto las {""}
                      <a
                        href="https://set-icap.com/Descargas/Autorizaci%C3%B3n%20Tratamiento%20de%20Datos%20personales%20Set-Icap%20Fx.pdf"
                        className="underline"
                      >
                        Políticas de Tratamiento de Datos personales SET‑ICAP FX
                      </a>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-gray-300 text-xs leading-tight sm:col-span-2">
                    <input
                      type="checkbox"
                      name="aceptaDatosSecurities"
                      checked={form.aceptaDatosSecurities}
                      onChange={onChange}
                      className="accent-[#1f4e85] mt-0.5"
                    />
                    <span>
                      Acepto las {""}
                      <a
                        href="https://set-icap.com/Descargas/Autorizaci%C3%B3n%20Tratamiento%20de%20Datos%20personales%20Set-Icap%20Securities.pdf"
                        className="underline"
                      >
                        Políticas de Tratamiento de Datos personales SET‑ICAP
                        SECURITIES
                      </a>
                    </span>
                  </label>
                </div>
                {errors.policies && (
                  <p className="text-xs text-red-400">{errors.policies}</p>
                )}
              </div>
              <br></br>
              {/* FOOTER STICKY: (boton + link) */}
              <div className="-mx-5 sm:-mx-6 sticky bottom-0 bg-[#1f1f1f] border-t border-gray-700 px-5 sm:px-6 pt-1.5 pb-1.5">
                <button className="w-full bg-[#1f4e85] text-white py-1.5 text-sm rounded-sm hover:bg-[#173861] transition-colors disabled:opacity-60">
                  {submitting ? "Registrando..." : "Registrarse"}
                </button>
                <div className="mt-1 text-center">
                  <a href="/" className="text-xs text-gray-300 hover:underline">
                    Regresar al inicio de sesión
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Toast modal centrado*/}
      {toast.show && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className={`relative mx-4 rounded-md px-6 py-4 shadow-2xl border text-base sm:text-lg font-medium
              ${
                toast.type === "success"
                  ? "bg-green-600 border-green-400 text-white"
                  : "bg-red-600 border-red-400 text-white"
              }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5">
                {toast.type === "success" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div className="text-sm sm:text-base">{toast.message}</div>
              <button
                onClick={() => setToast((t) => ({ ...t, show: false }))}
                className="ml-2 text-white/90 hover:text-white"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
