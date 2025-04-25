import { io, Socket } from 'socket.io-client';
import { toast as showToast } from '@/hooks/use-toast';
import { queryClient } from './queryClient';
import { Notification } from '@/context/NotificationContext';

let socket: Socket | null = null;
let isConnected = false;
let notificationCallback: ((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void) | null = null;

// Register notification callback
export function registerNotificationHandler(callback: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void): void {
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
      
      notificationCallback({
        title: isSuccess ? 'Payment Successful' : 'Payment Processing',
        message: `Transaction ${data.transactionId} - ${data.message || ''}`,
        type: 'payment',
        link: `/transaction/${data.transactionId}`
      });
    }
  });
  
  // Balance updates
  socket.on('balance-update', (data) => {
    console.log('Balance update received:', data);
    
    // Invalidate user cache to refresh balances
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    
    // Create notification and show toast
    if (notificationCallback) {
      notificationCallback({
        title: 'Balance Updated',
        message: data.message,
        type: 'system'
      });
    }
    
    showToast({
      title: 'Balance Updated',
      description: data.message,
      variant: 'default',
    });
  });
  
  // Emergency transaction updates
  socket.on('emergency-transaction-completed', (data) => {
    console.log('Emergency transaction completed:', data);
    
    // Invalidate both user and transactions cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    
    // Create notification
    if (notificationCallback) {
      notificationCallback({
        title: 'Emergency Payment Complete',
        message: `Transaction ${data.transactionId} has been completed in emergency mode`,
        type: 'emergency',
        link: `/transaction/${data.transactionId}`
      });
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
        type: 'system'
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
    
    if (completedCount > 0) {
      // Show toast notification
      showToast({
        title: 'Reconciliation Complete',
        description: `${completedCount} transaction(s) have been processed`,
        variant: 'default',
        duration: 5000,
      });
      
      // Create notification
      if (notificationCallback) {
        notificationCallback({
          title: 'Transactions Reconciled',
          message: `${completedCount} offline transaction(s) have been successfully processed now that you're back online`,
          type: 'reconciliation'
        });
      }
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