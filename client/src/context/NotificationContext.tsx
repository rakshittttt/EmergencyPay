import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAppContext } from './AppContext';
import { registerSocketNotificationHandler } from '@/lib/socket';

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

// Context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Generate a random ID for notifications
const generateId = () => Math.random().toString(36).substring(2, 9);

// Simple singleton for tracking recently shown toasts
const ToastManager = {
  recentToasts: new Map<string, number>(),
  
  showToast(title: string, message: string): void {
    const key = `${title}:${message}`;
    const now = Date.now();
    
    // Check if we've shown this toast recently (within 5 seconds)
    if (this.recentToasts.has(key)) {
      const lastShown = this.recentToasts.get(key) || 0;
      if (now - lastShown < 5000) {
        return; // Don't show duplicate toast
      }
    }
    
    // Show the toast
    toast({
      title,
      description: message,
      duration: 5000
    });
    
    // Record that we showed this toast
    this.recentToasts.set(key, now);
    
    // Clean up old entries after 5 seconds
    setTimeout(() => {
      this.recentToasts.delete(key);
    }, 5000);
  }
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isEmergencyMode, connectionStatus } = useAppContext();
  
  // Calculate unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Add a new notification - this function is purposely not exposed in the context
  // Instead it's only used internally and passed to the socket handler
  const addNotification = (data: { title: string; message: string; type: Notification['type']; link?: string; showToast?: boolean }) => {
    // Create the notification
    const newNotification: Notification = {
      id: generateId(),
      title: data.title,
      message: data.message,
      timestamp: new Date(),
      read: false,
      type: data.type,
      link: data.link
    };
    
    // Add to notifications state
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show toast if requested
    if (data.showToast) {
      ToastManager.showToast(data.title, data.message);
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
        type: "emergency",
        showToast: true
      });
    } else if (connectionStatus === 'online' && notifications.some(n => n.type === 'emergency' && !n.read)) {
      addNotification({
        title: "Normal Mode Restored",
        message: "UPI servers are back online. Regular payments have been restored.",
        type: "system",
        showToast: true
      });
    }
  }, [isEmergencyMode, connectionStatus]);
  
  // Add welcome notification on first load
  useEffect(() => {
    if (notifications.length === 0) {
      addNotification({
        title: "Welcome to EmergencyPay",
        message: "Your offline payment system is ready to use.",
        type: "system"
      });
    }
  }, []);
  
  // Register the notification handler for socket events
  useEffect(() => {
    // Register handler for socket events
    const unregister = registerSocketNotificationHandler((data) => {
      addNotification(data);
    });
    
    // Cleanup when component unmounts
    return () => {
      if (unregister) unregister();
    };
  }, []);
  
  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
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

// Custom hook to use the notifications context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}