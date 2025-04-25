import { io, Socket } from 'socket.io-client';
import { toast as showToast } from '@/hooks/use-toast';
import { queryClient } from './queryClient';
import { Notification } from '@/context/NotificationContext';

let socket: Socket | null = null;
let isConnected = false;
let notificationCallback: ((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, showToast?: boolean) => void) | null = null;

// Register notification callback
export function registerNotificationHandler(callback: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, showToast?: boolean) => void): void {
  notificationCallback = callback;
}

// Initialize Socket.IO connection
export function initializeSocket(): Socket {
  if (socket) return socket;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socketUrl = `${protocol}//${window.location.host}`;
  
  socket = io(socketUrl, {
    path: '/socket.io',
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // Socket connection events
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
    isConnected = true;
    
    showToast({
      title: 'Real-time Updates Active',
      description: 'You will receive instant notifications for transactions',
      duration: 3000,
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
    isConnected = false;
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    isConnected = false;
  });
  
  // Transaction updates
  socket.on('transaction-update', (data) => {
    console.log('Transaction update received:', data);
    
    // Invalidate transactions cache to trigger a re-fetch
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    
    // Create notification
    if (notificationCallback && data.status) {
      const isSuccess = data.status === 'completed';
      
      // Show toast for completed transactions only
      notificationCallback({
        title: isSuccess ? 'Payment Successful' : 'Payment Processing',
        message: `Transaction ${data.transactionId} - ${data.message || ''}`,
        type: 'payment',
        link: `/transaction/${data.transactionId}`,
        sourceId: `socket-transaction-${data.transactionId}`
      }, isSuccess); // Only show toast for successful payments
    }
  });
  
  // Balance updates
  socket.on('balance-update', (data) => {
    console.log('Balance update received:', data);
    
    // Invalidate user cache to refresh balances
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    
    // Create notification with toast
    if (notificationCallback) {
      notificationCallback({
        title: 'Balance Updated',
        message: data.message,
        type: 'system',
        sourceId: `socket-balance-update-${Date.now()}`
      }, true); // Show toast only through notification system
    }
  });
  
  // Emergency transaction updates
  socket.on('emergency-transaction-completed', (data) => {
    console.log('Emergency transaction completed:', data);
    
    // Invalidate both user and transactions cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    
    // Create notification with toast
    if (notificationCallback) {
      notificationCallback({
        title: 'Emergency Payment Complete',
        message: `Transaction ${data.transactionId} has been completed in emergency mode`,
        type: 'emergency',
        link: `/transaction/${data.transactionId}`,
        sourceId: `socket-emergency-transaction-${data.transactionId}`
      }, true); // Show toast for emergency payments
    }
  });
  
  // User updates
  socket.on('user-updated', (data) => {
    console.log('User updated:', data);
    
    // Invalidate user cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    
    // Create notification if update includes important information
    if (notificationCallback && data.message) {
      notificationCallback({
        title: 'Account Updated',
        message: data.message,
        type: 'system',
        sourceId: `socket-user-update-${Date.now()}`
      });
    }
  });
  
  // Reconciliation updates
  socket.on('reconciliation-complete', (data) => {
    console.log('Reconciliation complete:', data);
    
    // Invalidate both user and transactions cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    
    // Only show notification if there are completed transactions
    const completedCount = data.results.filter((r: any) => r.status === 'completed').length;
    
    if (completedCount > 0 && notificationCallback) {
      // Use timestamp to create a unique reconciliation ID to prevent duplicates
      const reconciliationId = `reconciliation-${Date.now()}`;
      
      // Create notification with toast
      notificationCallback({
        title: 'Transactions Reconciled',
        message: `${completedCount} offline transaction(s) have been successfully processed now that you're back online`,
        type: 'reconciliation',
        sourceId: reconciliationId
      }, true); // Show toast through notification system
    }
  });
  
  return socket;
}

// Get the socket instance
export function getSocket(): Socket | null {
  return socket;
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return isConnected;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
  }
}