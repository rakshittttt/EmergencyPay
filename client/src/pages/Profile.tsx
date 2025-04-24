import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import StatusBar from '@/components/StatusBar';

const Profile: React.FC = () => {
  const { currentUser, connectionStatus, isEmergencyMode, toggleEmergencyMode, reconcileTransactions } = useAppContext();

  if (!currentUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        <div className="bg-primary text-white py-8 px-4 rounded-b-3xl">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center">
              <i className="ri-user-fill text-4xl"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">{currentUser.name}</h1>
          <p className="text-center text-white/80 mt-1">{currentUser.phone}</p>
        </div>
        
        <div className="px-4 py-6">
          <h3 className="text-lg font-medium mb-4">Account</h3>
          
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Balance</h4>
                  <p className="text-gray-500 text-sm">Total funds available</p>
                </div>
                <span className="font-bold text-xl">₹{Number(currentUser.balance).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Emergency Balance</h4>
                  <p className="text-gray-500 text-sm">Reserved for emergencies</p>
                </div>
                <span className="font-bold text-xl">₹{Number(currentUser.emergency_balance).toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Add Money</h4>
                  <p className="text-gray-500 text-sm">Top up your account</p>
                </div>
                <button className="bg-primary text-white px-3 py-1 rounded-md">
                  Add Funds
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-2">
          <h3 className="text-lg font-medium mb-4">Settings</h3>
          
          <div className="bg-white rounded-lg shadow-sm mb-4">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h4 className="font-medium">Connection Status</h4>
                <p className="text-gray-500 text-sm">Current network state</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                connectionStatus === 'online' 
                  ? 'bg-green-100 text-green-800' 
                  : connectionStatus === 'emergency'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
            
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h4 className="font-medium">Emergency Mode</h4>
                <p className="text-gray-500 text-sm">Enable offline payments</p>
              </div>
              <button 
                onClick={toggleEmergencyMode}
                className={`w-12 h-6 rounded-full relative ${
                  isEmergencyMode ? 'bg-emergency-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                  isEmergencyMode ? 'right-1' : 'left-1'
                }`}></span>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">Sync Transactions</h4>
                  <p className="text-gray-500 text-sm">Update pending transactions</p>
                </div>
                <button 
                  onClick={reconcileTransactions}
                  disabled={connectionStatus !== 'online'}
                  className={`px-3 py-1 rounded-md text-white ${
                    connectionStatus === 'online' ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  Sync Now
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-4 border-b flex items-center">
              <i className="ri-shield-keyhole-line text-gray-600 mr-3"></i>
              <span>Security Settings</span>
            </div>
            
            <div className="p-4 border-b flex items-center">
              <i className="ri-notification-3-line text-gray-600 mr-3"></i>
              <span>Notifications</span>
            </div>
            
            <div className="p-4 flex items-center">
              <i className="ri-question-line text-gray-600 mr-3"></i>
              <span>Help & Support</span>
            </div>
          </div>
          
          <button className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-medium mb-8">
            Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
