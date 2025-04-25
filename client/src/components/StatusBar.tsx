import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import EmergencyToggle from './EmergencyToggle';

const StatusBar: React.FC = () => {
  const { connectionStatus } = useAppContext();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationRef = React.useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef]);

  // Determine status indicator color
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-amber-500';
      case 'emergency':
        return 'bg-emergency-500';
      default:
        return 'bg-gray-400';
    }
  };

  // Determine status text
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'emergency':
        return 'Emergency Mode';
      default:
        return 'Unknown';
    }
  };

  // Determine status text color
  const getStatusTextColor = () => {
    switch (connectionStatus) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-amber-600';
      case 'emergency':
        return 'text-emergency-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <span className="inline-flex relative mr-1">
            <motion.span 
              className={`h-3 w-3 rounded-full ${getStatusColor()}`}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {connectionStatus === 'online' && (
              <motion.span 
                className="absolute inset-0 h-3 w-3 rounded-full bg-green-400 opacity-75"
                animate={{ scale: [1, 2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            {connectionStatus === 'online' && (
              <motion.span 
                className="absolute inset-0 h-3 w-3 rounded-full bg-green-300 opacity-40"
                animate={{ scale: [1, 2.5, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
            {connectionStatus === 'offline' && (
              <motion.span 
                className="absolute inset-0 h-3 w-3 rounded-full bg-amber-400 opacity-75"
                animate={{ scale: [1, 1.8, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {connectionStatus === 'emergency' && (
              <motion.span 
                className="absolute inset-0 h-3 w-3 rounded-full bg-emergency-500 opacity-75"
                animate={{ scale: [1, 2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            {connectionStatus === 'emergency' && (
              <motion.span 
                className="absolute inset-0 h-3 w-3 rounded-full bg-emergency-400 opacity-50"
                animate={{ scale: [1, 2.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </span>
          <span className={`ml-2 text-sm font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <EmergencyToggle />
        <div className="relative" ref={notificationRef}>
          <button 
            className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <i className="ri-notification-3-line text-lg text-gray-600"></i>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
          </button>
          
          {showNotifications && (
            <motion.div 
              className="absolute right-0 top-10 w-64 bg-white shadow-lg rounded-lg border border-gray-200 z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-3 border-b border-gray-200">
                <h4 className="font-medium">Notifications</h4>
              </div>
              <div className="p-2 max-h-72 overflow-auto">
                <div className="p-2 text-sm border-b border-gray-100">
                  <div className="flex items-start">
                    <span className="h-2 w-2 mt-1.5 rounded-full bg-primary mr-2 flex-shrink-0"></span>
                    <div>
                      <p className="font-medium">Emergency Mode Activated</p>
                      <p className="text-gray-500 text-xs mt-1">UPI servers are currently down. Emergency payments are now active.</p>
                      <p className="text-gray-400 text-xs mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 text-sm">
                  <div className="flex items-start">
                    <span className="h-2 w-2 mt-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0"></span>
                    <div>
                      <p className="font-medium">Payment Successful</p>
                      <p className="text-gray-500 text-xs mt-1">You paid ₹250 to MedPlus Pharmacy</p>
                      <p className="text-gray-400 text-xs mt-1">Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-gray-200">
                <button className="w-full text-center text-xs text-primary py-1">
                  View All Notifications
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
