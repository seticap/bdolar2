import * as neffos from 'neffos.js';

const WS_BASE_URL = 'wss://set-fx.com/ws/dolar';

class WebSocketService {
    constructor() {
        this.connection = null;
        this.listeners = [];
    }

    async connect(token) {
        const wsURL = `${WS_BASE_URL}?token=${token}`;

        this.connection = await neffos.dial(wsURL, {
            delay: {
                chat: (nsConn, msg) => {
                    this.listeners.forEach(listener => listener(msg.Body));
                }
            }
        });
        
        await this.connection.connect('delay');
        
    }
    

    addListener(listener) {
        this.listeners.push(listener);
        
    }

    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    }
}


const instance = new WebSocketService();
export default instance;
