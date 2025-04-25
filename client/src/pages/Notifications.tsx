import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { format } from 'date-fns';

const Notifications: React.FC = () => {
  const [, navigate] = useLocation();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return 'ri-bank-card-line';
      case 'emergency':
        return 'ri-alarm-warning-line';
      case 'reconciliation':
        return 'ri-refresh-line';
      case 'system':
        return 'ri-information-line';
      default:
        return 'ri-notification-3-line';
    }
  };
  
  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'payment':
        return 'text-primary bg-primary-50';
      case 'emergency':
        return 'text-emergency-500 bg-emergency-50';
      case 'reconciliation':
        return 'text-green-600 bg-green-50';
      case 'system':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 172800) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  return (
    <motion.div 
      className="fixed inset-0 bg-white z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={handleGoBack}
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Notifications</h2>
        <button 
          onClick={markAllAsRead}
          className="text-sm text-primary"
        >
          Mark all read
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <i className="ri-notification-off-line text-2xl text-gray-400"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-800">No Notifications</h3>
            <p className="text-gray-500 mt-2">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <motion.div 
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-70' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${getNotificationColor(notification.type)}`}>
                    <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{getTimeAgo(notification.timestamp)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;