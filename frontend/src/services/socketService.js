import { io } from 'socket.io-client';
import { store } from '../store/store';
import { addNotification, markNotificationRead } from '../store/slices/notificationSlice';
import { updateLeadInList, removeLeadFromList } from '../store/slices/leadSlice';
import { toast } from 'react-toastify';

let socket = null;

export const initializeSocket = (userId) => {
  if (socket?.connected) {
    return socket;
  }

  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
  
  socket = io(WS_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    // Join user-specific room for notifications
    socket.emit('join-user-room', userId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from WebSocket server');
  });

  // Listen for notifications
  socket.on('notification', (notification) => {
    store.dispatch(addNotification(notification));
    toast.info(notification.message, {
      onClick: () => {
        if (notification.link) {
          window.location.href = notification.link;
        }
      }
    });
  });

  // Listen for lead updates
  socket.on('lead-updated', (lead) => {
    if (lead.deleted) {
      store.dispatch(removeLeadFromList(lead.id));
    } else {
      store.dispatch(updateLeadInList(lead));
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;

