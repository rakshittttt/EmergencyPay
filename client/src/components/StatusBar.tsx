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
      </div>
    </div>
  );
};

export default StatusBar;