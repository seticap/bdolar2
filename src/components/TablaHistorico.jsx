import React from "react";
import { useWebSocketData } from "./WebSocketDataContext";

const TablaHistorico1007 = () => {
  const { historico } = useWebSocketData();

  const horasOrdenadas = Object.keys(historico || {})
    .filter((h) => {
      const hNum = parseInt(h.split(":")[0]);
      return hNum >= 9 && hNum <= 12;
    })
    .sort();

  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "#1b1b1b",
        color: "#fff",
        padding: "20px",
        borderRadius: "10px",
        maxWidth: "400px",
      }}
    >
      <h3 style={{ textAlign: "center" }}>Promedio y Cierre</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Promedio</th>
            <th>Cierre</th>
          </tr>
        </thead>
        <tbody>
          {horasOrdenadas.map((hora) => (
            <tr key={hora}>
              <td>{hora}</td>
              <td>${historico[hora].avg}</td>
              <td>${historico[hora].close}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaHistorico1007;
