import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';

const PaymentAmount: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { 
    merchants, 
    connectionStatus, 
    isEmergencyMode, 
    selectedMerchant,
    selectMerchant,
    initiatePayment
  } = useAppContext();
  
  const [amount, setAmount] = useState('450.00');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // If there's no selected merchant but we have an ID, find the merchant
    if ((!selectedMerchant || selectedMerchant.id !== parseInt(id || '0')) && id) {
      const merchant = merchants.find(m => m.id === parseInt(id));
      if (merchant) {
        // Select this merchant in context
        console.log("Found merchant, selecting:", merchant);
        selectMerchant(merchant);
      } else {
        console.log("Merchant not found, redirecting");
        navigate('/');
      }
    }
  }, [selectedMerchant, id, merchants, navigate, selectMerchant]);
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  const handleConfirmPayment = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      // Show some error to the user
      alert("Please enter a valid amount");
      setIsProcessing(false);
      return;
    }
    
    try {
      const transaction = await initiatePayment(parsedAmount);
      
      if (transaction && transaction.id) {
        console.log("Payment successful, transaction:", transaction);
        navigate(`/payment-success/${transaction.id}`);
      } else {
        console.error("Payment failed - no transaction returned");
        alert("Payment failed. Please try again.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("An error occurred during payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!selectedMerchant) {
    return null; // Or a loading spinner
  }

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
          disabled={isProcessing}
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Make Payment</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-4 text-center">
          <motion.div 
            className="mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
              <i className="ri-store-2-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mt-2">{selectedMerchant.name}</h3>
            <p className="text-gray-500 text-sm">{selectedMerchant.category.charAt(0).toUpperCase() + selectedMerchant.category.slice(1)} Store</p>
          </motion.div>
          
          <motion.div 
            className="my-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <p className="text-gray-500 mb-2">Enter Amount</p>
            <div className="flex items-center justify-center text-4xl font-bold">
              <span className="text-gray-400 mr-1">₹</span>
              <input 
                type="text" 
                value={amount} 
                onChange={handleAmountChange}
                className="w-40 text-center outline-none bg-transparent"
                disabled={isProcessing}
              />
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 rounded-lg p-4 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Mode</span>
              <span className="text-gray-800 font-medium flex items-center">
                <i className="ri-bluetooth-line mr-1"></i> Bluetooth (Offline)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="text-amber-600 font-medium">Will sync when online</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="space-y-2 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <button 
              onClick={handleConfirmPayment}
              className="w-full bg-primary text-white font-medium py-3 rounded-lg disabled:opacity-70"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
            <button 
              onClick={handleGoBack}
              className="w-full bg-gray-200 text-gray-800 font-medium py-3 rounded-lg"
              disabled={isProcessing}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentAmount;
