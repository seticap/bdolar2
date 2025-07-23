const FooterPage = () => {
  return (
    <footer className="bg-custom-colortwo p-4 text-white text-center text-xs sm:text-sm">
      {/* Sección superior: Logos */}
      <div className="bg-[#282727] flex flex-col md:flex-row justify-between items-center px-4 md:px-8 border-b border-gray-600 pb-4 min-h-[15vh] py-4 md:py-0">
        {/* Logo SET ICAP */}
        <div className="flex items-center justify-center md:justify-start gap-4 mb-4 md:mb-0">
          <img
            src="logoSet.png"
            alt="Logo SET ICAP"
            className="h-[80px] sm:h-[100px] md:h-[120px] px-4 md:px-30"
          />
        </div>

        {/* Separador (solo en desktop) */}
        <div className="hidden md:flex h-25 border-l border-gray-500 mx-8 items-center mt-3" />

        {/* Logos partners */}
        <div className="flex flex-wrap justify-center md:justify-normal items-center gap-4 md:gap-8">
          <img
            src="images/sfclogo.png"
            alt="sfc"
            className="h-[70px] sm:h-[90px] md:h-[110px] px-2 md:px-10"
          />
          <img
            src="images/tpicap.png"
            alt="tpicap"
            className="h-[70px] sm:h-[90px] md:h-[110px] px-2 md:px-10"
          />
          <img
            src="images/bvclogo1.png"
            alt="bvc1"
            className="h-[70px] sm:h-[90px] md:h-[110px] px-2 md:px-10"
          />
        </div>
      </div>

      {/* Información inferior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-18 py-6 max-w-6xl mx-auto px-4 md:px-0">
        {/* Columna Políticas */}
        <div className="mb-4 md:mb-0">
          <h3 className="text-base md:text-lg font-semibold mb-2">Políticas</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-left md:text-center lg:text-left">
            <li className="text-xs md:text-sm">
              Política de Privacidad y Tratamiento de Datos Personales
            </li>
            <li className="text-xs md:text-sm">
              Términos y Condiciones de Uso
            </li>
          </ul>
        </div>

        {/* Columna Mapa del sitio */}
        <div className="mb-4 md:mb-0">
          <h3 className="text-base md:text-lg font-semibold mb-2">
            Mapa del sitio
          </h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-left md:text-center lg:text-left">
            <li className="text-xs md:text-sm">Productos y Servicios</li>
            <li className="text-xs md:text-sm">Mercado Cambiario</li>
            <li className="text-xs md:text-sm">SET-FX</li>
            <li className="text-xs md:text-sm">Contacto</li>
          </ul>
        </div>

        {/* Columna Contacto */}
        <div>
          <h3 className="text-base md:text-lg font-semibold mb-2">
            Contáctenos
          </h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1 text-left md:text-center lg:text-left">
            <li className="text-xs md:text-sm">
              Cra. 11 No. 93 - 46 Oficina 403
            </li>
            <li className="text-xs md:text-sm">Llame: (601) 742 77 77</li>
            <li className="text-xs md:text-sm">Escríbanos: info@set-icap.co</li>
            <li className="text-xs md:text-sm">
              PQRS: quejasyreclamos@set-icap.co
            </li>
            <li className="text-xs md:text-sm">Bogotá D.C</li>
          </ul>
        </div>
      </div>

      {/* Línea y derechos reservados */}
      <div className="border-t border-gray-600 text-center text-gray-400 py-4 text-xs">
        © 2025 SET-ICAP FX S.A | Todos los derechos reservados
      </div>
    </footer>
  );
};

export default FooterPage;