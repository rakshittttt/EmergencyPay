import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

type PaymentMethod = 'UPI' | 'CARD' | 'NETBANKING';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  color: string;
}

const AddFunds: React.FC = () => {
  const [, navigate] = useLocation();
  const { currentUser } = useAppContext();
  
  // Payment state
  const [amount, setAmount] = useState<string>('1000');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<'amount' | 'method' | 'processing' | 'success'>('amount');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Animation state
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Predefined amounts
  const quickAmounts = [500, 1000, 2000, 5000, 10000];
  
  // Payment methods
  const paymentMethods: PaymentOption[] = [
    { id: 'UPI', name: 'UPI Payment', icon: 'ri-bank-card-line', color: 'bg-green-100 text-green-600' },
    { id: 'CARD', name: 'Credit/Debit Card', icon: 'ri-bank-card-2-line', color: 'bg-blue-100 text-blue-600' },
    { id: 'NETBANKING', name: 'Net Banking', icon: 'ri-bank-line', color: 'bg-purple-100 text-purple-600' }
  ];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };
  
  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('processing');
    processPayment(method);
  };
  
  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    
    setStep('method');
  };
  
  const processPayment = async (method: PaymentMethod) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add funds',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Simulate processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the banking API
      const response = await fetch('/api/banking/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          amount: parseFloat(amount),
          source: method
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTransactionId(result.referenceNumber || 'TX' + Math.random().toString(36).substring(2, 10).toUpperCase());
        setStep('success');
        setShowConfetti(true);
        
        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      } else {
        toast({
          title: 'Transaction Failed',
          description: result.message || 'Failed to process payment',
          variant: 'destructive',
        });
        setStep('amount');
      }
    } catch (error) {
      console.error('Add funds error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setStep('amount');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleGoBack = () => {
    if (step === 'method') {
      setStep('amount');
    } else if (step === 'amount') {
      navigate('/profile');
    }
  };
  
  const handleDone = () => {
    navigate('/profile');
  };
  
  // Confetti component (simple animation)
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            backgroundColor: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)]
          }}
          animate={{
            y: window.innerHeight + 20,
            x: `calc(${Math.random() * window.innerWidth}px + ${Math.random() * 200 - 100}px)`,
            rotate: Math.random() * 360
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );

  return (
    <motion.div 
      className="fixed inset-0 bg-white z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={handleGoBack}
          className="h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-50"
          disabled={step === 'processing' || step === 'success'}
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">
          {step === 'amount' && 'Add Money'}
          {step === 'method' && 'Select Payment Method'}
          {step === 'processing' && 'Processing Payment'}
          {step === 'success' && 'Payment Successful'}
        </h2>
        <div className="h-10 w-10"></div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {/* Amount Selection */}
          {step === 'amount' && (
            <motion.div 
              className="p-4"
              key="amount-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-primary-50 rounded-lg p-6 mb-6">
                <p className="text-center text-primary-600 mb-2">Enter Amount</p>
                <div className="relative w-full max-w-xs mx-auto">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl font-medium text-gray-700">₹</span>
                  <input 
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full text-center text-3xl font-bold py-3 px-8 bg-white border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-3">QUICK AMOUNT</p>
                <div className="grid grid-cols-3 gap-3">
                  {quickAmounts.map(value => (
                    <button
                      key={value}
                      onClick={() => handleQuickAmount(value)}
                      className={`py-2 rounded-lg font-medium text-sm ${
                        amount === value.toString() 
                          ? 'bg-primary-100 text-primary-600 border-2 border-primary-300' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      ₹{value.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
              
              <motion.button
                onClick={handleContinue}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg"
                whileTap={{ scale: 0.95 }}
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Continue
              </motion.button>
            </motion.div>
          )}
          
          {/* Payment Method Selection */}
          {step === 'method' && (
            <motion.div 
              className="p-4"
              key="method-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">Amount to Add</span>
                  <span className="text-xl font-semibold text-blue-700">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mb-3">SELECT PAYMENT METHOD</p>
              
              <div className="space-y-3">
                {paymentMethods.map(method => (
                  <motion.button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="w-full flex items-center p-4 bg-white border border-gray-200 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`h-12 w-12 rounded-full ${method.color} flex items-center justify-center mr-4`}>
                      <i className={`${method.icon} text-2xl`}></i>
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-gray-500 text-sm">Pay securely using {method.name}</p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-400 ml-auto"></i>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Processing Animation */}
          {step === 'processing' && (
            <motion.div 
              className="flex flex-col items-center justify-center h-full p-4"
              key="processing-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="h-20 w-20 rounded-full border-4 border-primary border-t-transparent mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <h3 className="text-xl font-medium mb-2">Processing Payment</h3>
              <p className="text-gray-500 text-center">
                Please wait while we process your payment of ₹{parseFloat(amount).toLocaleString('en-IN')}
              </p>
              
              <div className="mt-8 w-full max-w-md">
                <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">Connecting</span>
                  <span className="text-xs text-gray-500">Verifying</span>
                  <span className="text-xs text-gray-500">Completing</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mt-8">
                This may take a few moments
              </p>
            </motion.div>
          )}
          
          {/* Success Screen */}
          {step === 'success' && (
            <motion.div 
              className="flex flex-col items-center p-6"
              key="success-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <motion.i 
                  className="ri-check-line text-5xl text-green-500"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                />
              </motion.div>
              
              <motion.h3 
                className="text-2xl font-semibold mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Payment Successful!
              </motion.h3>
              
              <motion.p 
                className="text-gray-500 text-center mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Your wallet has been credited with ₹{parseFloat(amount).toLocaleString('en-IN')}
              </motion.p>
              
              <motion.div 
                className="bg-gray-50 rounded-lg p-4 w-full mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">{selectedMethod}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-medium">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </motion.div>
              
              <motion.button
                onClick={handleDone}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg"
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Done
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}
    </motion.div>
  );
};

export default AddFunds;