// src/services/axiosconnect.js
import axios from 'axios';


const TOKEN_URL = "https://set-fx.com/api/v1/auth/access/token/";

export const getToken = async (username, password) => {
    try {
        const requestData = {
            grant_type: 'password',
            username,
            password,
            project_id: '19e28843-6f59-461e-af9e-effbce1f5dd4'
        };

        const response = await axios.post(TOKEN_URL, requestData);

        if (response.data?.payload?.access_token) {
            return { success: true, token: response.data.payload.access_token };
        } else {
            throw new Error('No se recibió el token en la respuesta.');
        }
    } catch (error) {
        console.error('Error al obtener el token:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};
