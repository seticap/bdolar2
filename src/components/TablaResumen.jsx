"use client";

import React from 'react';
import { useWebSocketData } from '../componentServer/WebSocketDataContext';

const TablaResumen = () => {
    const { dataById } = useWebSocketData();
    const precios = dataById[1006]?.data || {};
    console.log(precios);
    const montos = dataById[1005]?.data || {};
    const promedio = dataById[1007]?.data || {};

    return (
        <div>
        <div style={{ fontFamily: 'Arial', maxWidth: '400px', background: '#1b1b1b', color: '#fff', padding: '20px', borderRadius: '10px' }}>
            <h3>PRECIOS</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}> </th>
                        <th>HOY</th>
                        <th>AYER</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { label: 'CIERRE', hoy: precios.trm },
                        { label: 'MÁXIMO', hoy: precios.high },
                        { label: 'MÍNIMO', hoy: precios.low },
                        { label: 'APERTURA', hoy: precios.open },
                    ].map(({ label, hoy, ayer }) => (
                        <tr key={label}>
                            <td>{label}</td>
                            <td>{hoy}</td>
                            <td>{ayer}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <br/>
        <div style={{ fontFamily: 'Arial', maxWidth: '400px', background: '#1b1b1b', color: '#fff', padding: '20px', borderRadius: '10px'  }}>
            <h3>Montos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white'}}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}> </th>
                        <th>HOY</th>
                        <th>AYER</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { label: 'NEGOCIADO', hoy: montos.sum },
                        { label: 'ULTIMO', hoy: montos.close },
                        { label: 'PROMEDIO', hoy: montos.avg },
                        { label: 'MAXIMO', hoy: montos.high },
                        { label: 'MINIMO', hoy: montos.low },
                        { label: 'TRANSACCIONES', hoy: montos.count },
                    ].map(({ label, hoy, ayer }) => (
                        <tr key={label}>
                            <td>{label}</td>
                            <td>{hoy}</td>
                            <td>{ayer}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <br/>
        <div style={{ fontFamily: 'Arial', maxWidth: '400px', background: '#1b1b1b', color: '#fff', padding: '20px', borderRadius: '10px'  }}>
            <h3>Promedio</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white'}}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}> </th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        { label: 'PROMEDIO', hoy: promedio.avg },
                        { label: 'CIERRE', hoy: promedio.close }
                    ].map(({ label, hoy, ayer }) => (
                        <tr key={label}>
                            <td>{label}</td>
                            <td>{hoy}</td>
                            <td>{ayer}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        </div>
    
    );
};

export default TablaResumen;