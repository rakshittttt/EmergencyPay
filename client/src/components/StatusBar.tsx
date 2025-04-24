import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import EmergencyToggle from './EmergencyToggle';

const StatusBar: React.FC = () => {
  const { connectionStatus } = useAppContext();

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
          </span>
          <span className={`ml-2 text-sm font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <EmergencyToggle />
        <button className="relative flex items-center justify-center h-8 w-8 rounded-full">
          <i className="ri-notification-3-line text-lg text-gray-600"></i>
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
