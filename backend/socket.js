const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.userId = decoded.id;
        next();
      });
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    // Join a room with their user ID for private messages
    socket.join(socket.userId.toString());

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.receiverId.toString()).emit('user_typing', {
        senderId: socket.userId,
        typing: true
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.receiverId.toString()).emit('user_typing', {
        senderId: socket.userId,
        typing: false
      });
    });
  });

  return io;
}; 