
// import React, { useState } from 'react';
// import TokenService from '../services/TokenService';

// const TokenTester = () => {
//     const [mensaje, setMensaje] = useState('');

//     const username = 'sysdev';
//     const password = '$MasterDev1972*';

//     const generarToken = async () => {
//         setMensaje('Generando token...');
//         try {
//             const token = await TokenService.fetchToken(username, password);
//             localStorage.setItem('token-socket', token);
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     const borrarToken = () => {
//         localStorage.removeItem('token-socket');
//     };

//     return (
//         <div style={{ marginTop: '20px' }}>
//             <button onClick={generarToken} style={{ marginRight: '10px', padding: '8px 16px' }}>
//                 Generar Token
//             </button>
//             <button onClick={borrarToken} style={{ padding: '8px 16px' }}>
//                 Borrar Token
//             </button>
//             <p style={{ marginTop: '10px' }}>{mensaje}</p>
//         </div>
//     );
// };

// export default TokenTester;
