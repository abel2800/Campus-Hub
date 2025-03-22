module.exports = (io, socket) => {
    // Handle sending messages
    socket.on('send_message', (data) => {
      console.log(`Message received from ${socket.id}:`, data);
      io.emit('receive_message', data); // Broadcast to all connected clients
    });
  
    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.broadcast.emit('typing', data);
    });
  
    // Handle stopped typing indicator
    socket.on('stop_typing', () => {
      socket.broadcast.emit('stop_typing');
    });
  };
  