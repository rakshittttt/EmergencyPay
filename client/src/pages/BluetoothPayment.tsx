import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import MerchantItem from '@/components/MerchantItem';
import { toast } from '@/hooks/use-toast';

const BluetoothPayment: React.FC = () => {
  const [, navigate] = useLocation();
  const { 
    isEmergencyMode,
    startDeviceDiscovery,
    stopDeviceDiscovery,
    isScanning,
    discoveredDevices,
    selectMerchant,
    connectionStatus,
    currentUser
  } = useAppContext();

  // Track connection and payment state
  const [connecting, setConnecting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  useEffect(() => {
    // Start scanning when component mounts
    startDeviceDiscovery();
    
    // Notify user about emergency mode
    if (isEmergencyMode && connectionStatus === 'emergency') {
      toast({
        title: 'Emergency Mode Active',
        description: 'You can make offline payments via Bluetooth',
        variant: 'default',
      });
    }
    
    // Stop scanning when component unmounts
    return () => stopDeviceDiscovery();
  }, [startDeviceDiscovery, stopDeviceDiscovery, isEmergencyMode, connectionStatus]);

  const handleGoBack = () => {
    navigate('/');
  };

  // Function to perform payment directly via banking API
  const performBluetoothPayment = async (merchantId: number, amount: number) => {
    if (!currentUser) return null;
    
    setPaymentProcessing(true);
    
    try {
      const response = await fetch('/api/banking/emergency-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: merchantId,
          amount: amount.toString(),
          method: 'BLUETOOTH'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Payment Successful',
          description: `Paid ₹${amount} via Bluetooth in emergency mode`,
          variant: 'default',
        });
        return result;
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message || 'Failed to process payment',
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      console.error('Bluetooth payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setPaymentProcessing(false);
    }
  };
  
  const handleConnect = async (merchant: typeof discoveredDevices[0]) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to make payments',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if emergency mode is active
    if (!isEmergencyMode || connectionStatus !== 'emergency') {
      toast({
        title: 'Emergency Mode Required',
        description: 'Enable emergency mode in your profile to make offline payments',
        variant: 'destructive',
      });
      return;
    }
    
    // Check if user has sufficient emergency balance
    if (parseFloat(currentUser.emergency_balance) <= 0) {
      toast({
        title: 'Insufficient Emergency Balance',
        description: 'Please add funds to your emergency balance to make offline payments',
        variant: 'destructive',
      });
      return;
    }
    
    setConnecting(true);
    
    try {
      toast({
        title: 'Connecting',
        description: `Connecting to ${merchant.name}...`,
      });
      
      // Continue with navigation to payment amount
      selectMerchant(merchant);
      navigate(`/payment-amount/${merchant.id}`);
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to merchant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
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
        <h2 className="text-lg font-medium">Emergency Pay</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="px-4 py-6 border-b border-gray-200">
          {/* Emergency Balance Card */}
          {currentUser && (
            <div className="bg-primary-50 rounded-lg p-4 flex justify-between items-center mb-3">
              <div>
                <h3 className="font-medium text-primary-800">Emergency Balance</h3>
                <p className="text-2xl font-semibold text-primary-700">
                  ₹{parseFloat(currentUser.emergency_balance).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="ri-wallet-3-line text-primary text-xl"></i>
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 rounded-lg p-4 flex items-start mb-3">
            <i className="ri-information-line text-amber-500 mt-0.5 mr-3 text-lg"></i>
            <div>
              <h3 className="font-medium text-amber-700">Emergency Mode Active</h3>
              <p className="text-sm text-amber-700/80">You can make payments using Bluetooth when UPI services are down.</p>
            </div>
          </div>
          
          {connecting || paymentProcessing ? (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center mb-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-blue-700">
                {connecting ? 'Connecting to merchant...' : 'Processing payment...'}
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4 flex items-start">
              <i className="ri-information-line text-blue-500 mt-0.5 mr-3 text-lg"></i>
              <div>
                <h3 className="font-medium text-blue-700">Simulated Functionality</h3>
                <p className="text-sm text-blue-700/80">This is a simulated demonstration of Bluetooth functionality. In a real application, this would use your device's Bluetooth hardware to discover nearby merchants.</p>
              </div>
            </div>
          )}
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
