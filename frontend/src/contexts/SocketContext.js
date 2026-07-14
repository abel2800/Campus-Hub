import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setConnected(false);
  };

  const initializeSocket = (token) => {
    disconnectSocket();
    if (!token) return null;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    return newSocket;
  };

  useEffect(() => {
    const syncSocket = () => {
      const token = localStorage.getItem('token');
      if (token) {
        initializeSocket(token);
      } else {
        disconnectSocket();
      }
    };

    syncSocket();
    window.addEventListener('auth-changed', syncSocket);
    window.addEventListener('storage', syncSocket);

    return () => {
      window.removeEventListener('auth-changed', syncSocket);
      window.removeEventListener('storage', syncSocket);
      disconnectSocket();
    };
  }, []);

  const sendMessage = (event, data) => {
    if (socket) {
      socket.emit(event, data);
    } else {
      console.error('Cannot send message, socket not connected');
    }
  };

  const value = {
    socket,
    connected,
    sendMessage,
    initializeSocket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
