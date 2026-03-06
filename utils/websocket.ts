
import type { Company, Action } from '../types';

let socket: WebSocket | null = null;
let reconnectInterval: ReturnType<typeof setInterval> | null = null;

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
// This URL connects to the same host and port as the web page.
// The Vite dev server now handles this WebSocket connection directly through
// its integrated backend middleware, providing a true single-port setup.
const WS_URL = `${protocol}://${window.location.host}/app-ws`;

interface WebSocketCallbacks {
  onStateUpdate: (companies: Company[]) => void;
  onOpen: () => void;
  onClose: () => void;
}

function connect(callbacks: WebSocketCallbacks) {
    // Clean up previous connection if any
    if (socket) {
        socket.close();
    }
    if (reconnectInterval) {
        clearInterval(reconnectInterval);
    }

    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log('WebSocket connection established.');
        callbacks.onOpen();
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            // The server broadcasts the full state on any change, which becomes the source of truth.
            if (Array.isArray(data)) {
                 callbacks.onStateUpdate(data);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    socket.onerror = (error) => {
        console.error(
            '[WebSocket Error] Connection failed. This is expected if the backend server is not running. Please ensure your backend server is active and accessible.', 
            error
        );
        socket?.close(); // onclose will be called subsequently
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed. Attempting to reconnect in 5s...');
        callbacks.onClose();
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                connect(callbacks);
            }, 5000);
        }
    };
}

export function connectWebSocket(callbacks: WebSocketCallbacks) {
    connect(callbacks);
}

export function sendAction(action: Action) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(action));
    } else {
        console.warn('WebSocket is not connected. Action was not sent.');
    }
}