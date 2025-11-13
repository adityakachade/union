let io = null;

/**
 * Initialize Socket.io service
 */
const initializeSocket = (socketIo) => {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join user-specific room for targeted notifications
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit notification to specific user
 * @param {number} userId - User ID to notify
 * @param {object} notification - Notification data
 */
const notifyUser = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
    console.log(`📡 Notification sent to user ${userId}`);
  }
};

/**
 * Emit notification to all connected clients
 * @param {object} notification - Notification data
 */
const notifyAll = (notification) => {
  if (io) {
    io.emit('notification', notification);
    console.log('📡 Notification broadcasted to all clients');
  }
};

/**
 * Emit lead update to all connected clients
 * @param {object} lead - Updated lead data
 */
const emitLeadUpdate = (lead) => {
  if (io) {
    io.emit('lead-updated', lead);
  }
};

module.exports = {
  initializeSocket,
  notifyUser,
  notifyAll,
  emitLeadUpdate
};

