import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}
