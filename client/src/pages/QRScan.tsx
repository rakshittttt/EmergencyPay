import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';

const QRScan: React.FC = () => {
  const [, navigate] = useLocation();
  const { merchants, selectMerchant } = useAppContext();
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Simulate scanning
    let scanTimer: NodeJS.Timeout;
    
    if (scanning) {
      scanTimer = setTimeout(() => {
        // Randomly pick a merchant
        const randomIndex = Math.floor(Math.random() * merchants.length);
        const randomMerchant = merchants[randomIndex];
        
        if (randomMerchant) {
          selectMerchant(randomMerchant);
          navigate(`/payment-amount/${randomMerchant.id}`);
        }
      }, 3000);
    }
    
    return () => clearTimeout(scanTimer);
  }, [scanning, merchants, navigate, selectMerchant]);

  const startScanning = () => {
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
    navigate('/');
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-gray-900/95 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between text-white">
        <button 
          onClick={stopScanning}
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Scan QR Code</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          <div className="h-64 w-64 border-2 border-white/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 border-2 border-primary rounded-lg"></div>
              <div className="absolute top-0 left-0 h-12 w-12 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 h-12 w-12 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 h-12 w-12 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
              <motion.div 
                className="absolute w-full bg-primary"
                style={{ height: 2 }}
                animate={{ 
                  top: scanning ? ['30%', '70%', '30%'] : '50%'
                }}
                transition={{ 
                  duration: 3, 
                  ease: "easeInOut", 
                  repeat: scanning ? Infinity : 0,
                  repeatType: "reverse" 
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-white/80 text-center mb-4">Position the QR code within the frame to scan</p>
        <div className="flex space-x-4">
          <button className="bg-white/10 text-white py-2 px-4 rounded-lg flex items-center">
            <i className="ri-image-line mr-2"></i>
            Gallery
          </button>
          <button 
            className={`${flashOn ? 'bg-white/20' : 'bg-white/10'} text-white py-2 px-4 rounded-lg flex items-center`}
            onClick={toggleFlash}
          >
            <i className="ri-flashlight-line mr-2"></i>
            {flashOn ? 'Flash On' : 'Flash Off'}
          </button>
        </div>
        
        <motion.button
          className="mt-8 bg-primary text-white py-3 px-8 rounded-lg font-medium"
          onClick={startScanning}
          whileTap={{ scale: 0.95 }}
          disabled={scanning}
        >
          {scanning ? 'Scanning...' : 'Start Scan'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QRScan;
