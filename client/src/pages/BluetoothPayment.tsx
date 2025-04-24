import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import MerchantItem from '@/components/MerchantItem';

const BluetoothPayment: React.FC = () => {
  const [, navigate] = useLocation();
  const { 
    isEmergencyMode,
    startDeviceDiscovery,
    stopDeviceDiscovery,
    isScanning,
    discoveredDevices,
    selectMerchant
  } = useAppContext();

  useEffect(() => {
    // Start scanning when component mounts
    startDeviceDiscovery();
    
    // Stop scanning when component unmounts
    return () => stopDeviceDiscovery();
  }, [startDeviceDiscovery, stopDeviceDiscovery]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleConnect = (merchant: typeof discoveredDevices[0]) => {
    selectMerchant(merchant);
    navigate(`/payment-amount/${merchant.id}`);
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
        <h2 className="text-lg font-medium">Emergency Pay</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="px-4 py-6 border-b border-gray-200">
          <div className="bg-amber-50 rounded-lg p-4 flex items-start">
            <i className="ri-information-line text-amber-500 mt-0.5 mr-3 text-lg"></i>
            <div>
              <h3 className="font-medium text-amber-700">Emergency Mode Active</h3>
              <p className="text-sm text-amber-700/80">You can make payments using Bluetooth when UPI services are down.</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 text-center">
          <motion.div 
            className="relative ble-scan-animation"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
              <i className="ri-bluetooth-line text-4xl text-primary"></i>
            </div>
          </motion.div>
          <h3 className="text-lg font-medium mt-6 mb-2">
            {isScanning ? 'Scanning for devices...' : 'Nearby Merchants'}
          </h3>
          <p className="text-gray-600 mb-6">Keep your device close to the merchant's device</p>
          
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-500 mb-3">AVAILABLE MERCHANTS</h4>
            
            {/* Merchant List */}
            <div className="space-y-3">
              {discoveredDevices.length > 0 ? (
                discoveredDevices.map((merchant, index) => (
                  <MerchantItem 
                    key={merchant.id} 
                    merchant={merchant}
                    distance={Math.floor(Math.random() * 10) + 1} // Random distance 1-10m
                    isInRange={true}
                    index={index}
                    onConnect={() => handleConnect(merchant)}
                  />
                ))
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500">
                    {isScanning ? 'Searching for nearby merchants...' : 'No merchants found'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <motion.button 
            onClick={handleGoBack}
            className="bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg"
            whileTap={{ scale: 0.95 }}
          >
            Cancel Scan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BluetoothPayment;
