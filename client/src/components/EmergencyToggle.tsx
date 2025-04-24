import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

const EmergencyToggle: React.FC = () => {
  const { toggleEmergencyMode, isEmergencyMode } = useAppContext();
  const [showOverlay, setShowOverlay] = useState(false);

  const handleToggleClick = () => {
    if (!isEmergencyMode) {
      setShowOverlay(true);
    } else {
      toggleEmergencyMode();
    }
  };

  const handleConfirm = () => {
    setShowOverlay(false);
    toggleEmergencyMode();
  };

  const handleCancel = () => {
    setShowOverlay(false);
  };

  return (
    <>
      <button 
        onClick={handleToggleClick}
        className={`relative flex items-center justify-center h-8 w-8 rounded-full ${isEmergencyMode ? 'text-emergency-600' : 'text-gray-600'}`}
      >
        <i className="ri-alarm-warning-line text-lg"></i>
      </button>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-emergency-600/90 z-50 flex flex-col justify-center items-center px-6"
          >
            <motion.div 
              className="text-white text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-6">
                <i className="ri-alarm-warning-fill text-6xl"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">Activate Emergency Mode?</h2>
              <p className="mb-8">This mode enables offline payments when UPI services are down. Transactions will be synced when network is restored.</p>
              <div className="flex space-x-4">
                <button 
                  onClick={handleCancel}
                  className="flex-1 bg-white/20 hover:bg-white/30 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className="flex-1 bg-white text-emergency-600 py-3 rounded-lg font-medium transition-colors"
                >
                  Activate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyToggle;
