import { io } from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (projectId) => {
  if (!socketInstance) {
    socketInstance = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem('token') },
      query: { projectId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      withCredentials: true
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }
  return socketInstance;
};

export const receiveMessage = (eventName, callback) => {
  socketInstance?.on(eventName, callback);
};

export const sendMessage = (eventName, data) => {
  socketInstance?.emit(eventName, data);
};