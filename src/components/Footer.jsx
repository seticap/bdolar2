const FooterPage = () => {
  return (
    <footer className="bg-custom-colortwo text-white text-sm pt-0">
      {/* Logos superiores */}
      <div className="bg-[#282727] flex flex-col md:flex-row justify-between items-center px-8 border-b border-gray-600 pb-4 h-[15vh]">
        <div className="flex items-center gap-4">
          <img
            src="/logoSet.png"
            alt="Logo SET ICAP"
            className="h-[120px] px-30"
          />
        </div>

        <div className="hidden md:flex h-25 border-l border-gray-500 mx-8 items-center mt-3" />

        <div className="flex items-center gap-8">
          <img src="images/sfclogo.png" alt="sfc" className="h-[110px] px-10" />
          <img
            src="images/tpicap.png"
            alt="tpicap"
            className="h-[110px] px-10"
          />
          <img
            src="images/bvclogo1.png"
            alt="bvc1"
            className="h-[110px] px-10"
          />
        </div>
      </div>

      {/* Información inferior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 space-x-20 py-6 max-w-6xl mx-auto items-start text-center md:text-left">

        <div>
          <h3 className="text-lg font-semibold mb-2">Políticas</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Política de Privacidad y Tratamiento de Datos Personales</li>
            <li>Términos y Condiciones de Uso</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Mapa del sitio</h3>
          <ul className="list-disc list-inside text-gray-300 space-x-20">
            <li>Productos y Servicios</li>
            <li>Mercado Cambiario</li>
            <li>SET-FX</li>
            <li>Contacto</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Contactenos</h3>
          <ul className="text-gray-300 space-y-1">
            <li>Cra. 11 No. 93 - 46 Oficina 403</li>
            <li>Llame: (601) 742 77 77</li>
            <li>Escríbanos: info@set-icap.co</li>
            <li>PQRS: quejasyreclamos@set-icap.co</li>
            <li>Bogotá D.C</li>
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
