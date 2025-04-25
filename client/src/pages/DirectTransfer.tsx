import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const DirectTransfer: React.FC = () => {
  const [, navigate] = useLocation();
  const { 
    currentUser, 
    refreshTransactions, 
    isEmergencyMode, 
    connectionStatus 
  } = useAppContext();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleGoBack = () => {
    navigate('/');
  };
  
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };
  
  const handleTransfer = async () => {
    if (isProcessing) return;
    
    // Validate phone number
    if (phoneNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    // Determine if we're in emergency mode
    const isInEmergencyMode = isEmergencyMode && connectionStatus === 'emergency';
    
    // Check if user has sufficient balance based on mode
    if (currentUser) {
      if (isInEmergencyMode) {
        // Check emergency balance in emergency mode
        if (parseFloat(currentUser.emergency_balance) < parsedAmount) {
          toast({
            title: 'Insufficient Emergency Balance',
            description: 'You do not have enough emergency balance to make this transfer',
            variant: 'destructive',
          });
          return;
        }
      } else {
        // Check regular balance in normal mode
        if (parseFloat(currentUser.balance) < parsedAmount) {
          toast({
            title: 'Insufficient Balance',
            description: 'You do not have enough balance to make this transfer',
            variant: 'destructive',
          });
          return;
        }
      }
    }
    
    setIsProcessing(true);
    
    try {
      // First check if the user exists
      const checkUserResponse = await apiRequest('GET', `/api/users/phone/${phoneNumber}`);
      
      if (!checkUserResponse.ok) {
        throw new Error('User with this phone number does not exist');
      }
      
      const receiverUser = await checkUserResponse.json();
      
      // Process transfer based on mode
      const endpoint = isInEmergencyMode ? '/api/banking/emergency-payment' : '/api/banking/transfer';
      const payload = {
        senderId: currentUser?.id,
        receiverId: receiverUser.id,
        amount: parsedAmount.toString(),
        method: 'DIRECT_TRANSFER'
      };
      
      // Make the API request
      const response = await apiRequest('POST', endpoint, payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process transfer');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Transfer Successful',
        description: `₹${parsedAmount} sent to ${phoneNumber}`,
      });
      
      // Refresh transactions
      refreshTransactions();
      
      // Navigate to success page
      if (result.transactionId) {
        navigate(`/payment-success/${result.transactionId}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An error occurred during transfer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Determine if we're in emergency mode
  const isInEmergencyMode = isEmergencyMode && connectionStatus === 'emergency';
  
  // Effect to show banner when in emergency mode
  useEffect(() => {
    if (isInEmergencyMode) {
      toast({
        title: 'Emergency Mode Active',
        description: 'Your payment will be processed offline and reconciled later',
        variant: 'default',
      });
    }
  }, [isInEmergencyMode]);
  
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
        <h2 className="text-lg font-medium">Send Money</h2>
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
              <i className="ri-user-3-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mt-2">Send Money to Phone Number</h3>
            <p className="text-gray-500 text-sm">Transfer funds directly to any registered user</p>
          </motion.div>
          
          <motion.div 
            className="my-8 space-y-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div>
              <p className="text-gray-500 mb-2 text-left">Phone Number</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">+91</span>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={handlePhoneNumberChange}
                  placeholder="9876543210"
                  className="w-full bg-gray-50 p-4 pl-16 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  disabled={isProcessing}
                  maxLength={10}
                />
              </div>
            </div>
            
            <div>
              <p className="text-gray-500 mb-2 text-left">Amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="text" 
                  value={amount} 
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="w-full bg-gray-50 p-4 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </motion.div>
          
          {currentUser && (
            <motion.div 
              className="bg-gray-50 rounded-lg p-4 mb-8 text-left"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Your Balance</span>
                <span className="text-gray-800 font-medium">₹{parseFloat(currentUser.balance).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transfer Method</span>
                <span className="text-gray-800 font-medium">UPI</span>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            className="space-y-2 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <button 
              onClick={handleTransfer}
              className="w-full bg-primary text-white font-medium py-3 rounded-lg disabled:opacity-70"
              disabled={isProcessing || !phoneNumber || !amount || phoneNumber.length < 10}
            >
              {isProcessing ? 'Processing...' : 'Send Money'}
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

export default DirectTransfer;