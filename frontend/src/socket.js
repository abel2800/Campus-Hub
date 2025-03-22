import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.info('Connected to socket server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.info('Disconnected from socket server:', reason);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Add these new helper functions
export const emitEvent = (eventName, data) => {
  if (socket?.connected) {
    socket.emit(eventName, data);
  }
};

export const subscribeToEvent = (eventName, callback) => {
  if (socket) {
    socket.on(eventName, callback);
    return () => socket.off(eventName, callback);
  }
  return () => {};
};

export const joinRoom = (roomId) => {
  if (socket?.connected) {
    socket.emit('join_room', roomId);
  }
};

export const leaveRoom = (roomId) => {
  if (socket?.connected) {
    socket.emit('leave_room', roomId);
  }
};

// Helper functions for socket management
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const sendTyping = (roomId) => {
  if (socket?.connected) {
    socket.emit('typing', { roomId });
  }
};

export const stopTyping = (roomId) => {
  if (socket?.connected) {
    socket.emit('stop_typing', { roomId });
  }
};

// Export the socket instance and helper functions
export default {
  socket,
  connectSocket,
  disconnectSocket,
  emitEvent,
  subscribeToEvent,
  // Add connection status getter
  isConnected: () => socket.connected,
  // Add reconnection method
  reconnect: () => {
    if (!socket.connected) {
      socket.connect();
    }
  },
  // Add room management methods
  joinRoom,
  leaveRoom,
  // Add typing indicator methods
  sendTyping,
  stopTyping,
  // Add new methods
  initializeSocket,
  getSocket,
  closeSocket
};
