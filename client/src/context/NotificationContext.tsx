import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from './AppContext';
import { Transaction } from '@shared/schema';
import { registerNotificationHandler } from '@/lib/socket';

// Notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'payment' | 'emergency' | 'reconciliation' | 'system';
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, showToastNotification?: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Generate a random ID for notifications
const generateId = () => Math.random().toString(36).substring(2, 9);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { transactions, isEmergencyMode, connectionStatus } = useAppContext();
  
  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, showToastNotification = false) => {
    // Check if a similar notification already exists to prevent duplication
    const isDuplicate = notifications.some(
      n => n.title === notification.title && 
           n.message === notification.message && 
           new Date().getTime() - new Date(n.timestamp).getTime() < 5000 // Within last 5 seconds
    );
    
    if (isDuplicate) {
      return; // Skip duplicate notifications
    }
    
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Only show toast if specifically requested
    if (showToastNotification) {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Watch for emergency mode changes
  useEffect(() => {
    if (isEmergencyMode) {
      addNotification({
        title: "Emergency Mode Activated",
        message: "UPI servers are currently down. Emergency payments are now active.",
        type: "emergency"
      });
    } else if (connectionStatus === 'online' && notifications.some(n => n.type === 'emergency' && !n.read)) {
      addNotification({
        title: "Normal Mode Restored",
        message: "UPI servers are back online. Regular payments have been restored.",
        type: "system"
      });
    }
  }, [isEmergencyMode, connectionStatus]);
  
  // Load initial notifications
  useEffect(() => {
    // Add initial system notification
    if (notifications.length === 0) {
      setNotifications([
        {
          id: generateId(),
          title: "Welcome to EmergencyPay",
          message: "Your offline payment system is ready to use.",
          timestamp: new Date(),
          read: false,
          type: "system"
        }
      ]);
    }
  }, []);
  
  // Watch for transaction changes
  useEffect(() => {
    const lastTransaction = transactions[0];
    if (lastTransaction) {
      const existingNotification = notifications.find(
        n => n.title.includes(lastTransaction.id.toString()) && n.type === 'payment'
      );
      
      if (!existingNotification) {
        // This is a new transaction, add a notification
        addNotification({
          title: `Payment ${lastTransaction.status === 'completed' ? 'Successful' : 'Pending'}`,
          message: `₹${lastTransaction.amount} ${lastTransaction.status === 'completed' ? 'paid' : 'processing'}`,
          type: "payment",
          link: `/transaction/${lastTransaction.id}`
        });
      }
    }
  }, [transactions]);
  
  // Register the notification handler for socket events
  useEffect(() => {
    registerNotificationHandler(addNotification);
  }, []);
  
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};