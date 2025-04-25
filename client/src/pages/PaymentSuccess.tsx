import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@shared/schema';

const PaymentSuccess: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { transactions, merchants, currentUser, refreshTransactions, isEmergencyMode } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  
  useEffect(() => {
    // Refresh transactions to make sure we have the latest data
    refreshTransactions();
    
    // If we have an invalid ID, navigate back to home
    if (!id || id === 'undefined') {
      console.error('Invalid transaction ID:', id);
      navigate('/');
      return;
    }
    
    // Set a timeout to ensure we have the latest transactions
    const timeoutId = setTimeout(() => {
      // Find the transaction
      const foundTransaction = transactions.find(t => t.id === parseInt(id));
      
      if (foundTransaction) {
        setTransaction(foundTransaction);
        
        // Get merchant info
        const foundMerchant = merchants.find(m => m.user_id === foundTransaction.receiver_id);
        if (foundMerchant) {
          setMerchant(foundMerchant);
        }
      } else {
        // If we can't find the transaction after the timeout, 
        // navigate back to home
        console.error('Could not find transaction with ID:', id);
        navigate('/');
      }
      
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [id, transactions, merchants, refreshTransactions, navigate]);
  
  const handleBackToHome = () => {
    navigate('/');
  };
  
  const handleViewTransaction = () => {
    navigate('/transactions');
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  if (loading || !transaction || !merchant) {
    return (
      <div className="fixed inset-0 bg-white z-40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-white z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          className="mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-fill text-4xl text-green-600"></i>
          </div>
          <h3 className="text-2xl font-bold">Payment Successful!</h3>
          <p className="text-gray-600 mt-2">
            {(isEmergencyMode || transaction.is_offline) 
              ? "Your transaction has been stored locally" 
              : "Your payment has been processed successfully"}
          </p>
        </motion.div>
        
        <motion.div 
          className="w-full max-w-sm bg-gray-50 rounded-lg p-4 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Amount</span>
            <span className="text-gray-800 font-medium">{formatCurrency(Number(transaction.amount))}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Paid to</span>
            <span className="text-gray-800 font-medium">{merchant.name}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Date & Time</span>
            <span className="text-gray-800 font-medium">
              {transaction.timestamp ? 
                `${formatDate(transaction.timestamp.toString())} • ${formatTime(transaction.timestamp.toString())}` : 
                'Just now'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID</span>
            <span className="text-gray-800 font-medium">
              {transaction.transaction_code || `TXN${transaction.id}`}
            </span>
          </div>
        </motion.div>
        
        {(isEmergencyMode || transaction.is_offline) && (
          <motion.div 
            className="bg-amber-50 rounded-lg p-4 mb-8 text-left w-full max-w-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex">
              <i className="ri-information-line text-amber-500 mt-0.5 mr-3 text-lg flex-shrink-0"></i>
              <div>
                <h3 className="font-medium text-amber-700">Offline Transaction</h3>
                <p className="text-sm text-amber-700/80">
                  {transaction.status === "pending" 
                    ? "This transaction will be synced with your bank when network connectivity is restored."
                    : "This transaction was made in emergency mode and has been processed."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.div 
          className="space-y-3 w-full max-w-sm"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <button 
            onClick={handleViewTransaction}
            className="w-full bg-white border border-primary text-primary font-medium py-3 rounded-lg"
          >
            View Transaction
          </button>
          <button 
            onClick={handleBackToHome}
            className="w-full bg-primary text-white font-medium py-3 rounded-lg"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentSuccess;
