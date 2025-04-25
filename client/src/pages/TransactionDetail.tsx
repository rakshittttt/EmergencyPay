import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@shared/schema';

const TransactionDetail: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { transactions, merchants } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  
  useEffect(() => {
    // If we have an invalid ID, navigate back to transactions
    if (!id || id === 'undefined') {
      console.error('Invalid transaction ID:', id);
      navigate('/transactions');
      return;
    }
    
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
      // If we can't find the transaction, navigate back
      console.error('Could not find transaction with ID:', id);
      navigate('/transactions');
      return;
    }
    
    setLoading(false);
  }, [id, transactions, merchants, navigate]);
  
  const handleGoBack = () => {
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
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'failed':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'ri-checkbox-circle-fill';
      case 'pending':
        return 'ri-time-line';
      case 'failed':
        return 'ri-close-circle-fill';
      default:
        return 'ri-question-mark';
    }
  };
  
  if (loading || !transaction) {
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
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={handleGoBack}
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Transaction Details</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col max-w-lg mx-auto">
          {/* Transaction Status */}
          <motion.div 
            className="text-center mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`h-16 w-16 rounded-full ${getStatusClass(transaction.status).replace('text-', 'bg-').replace('50', '100')} flex items-center justify-center mx-auto mb-2`}>
              <i className={`${getStatusIcon(transaction.status)} text-3xl ${getStatusClass(transaction.status)}`}></i>
            </div>
            <h2 className="text-xl font-semibold mt-1">
              {formatCurrency(Number(transaction.amount))}
            </h2>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${getStatusClass(transaction.status)} mt-2`}>
              <i className={`${getStatusIcon(transaction.status)} mr-1`}></i>
              <span className="capitalize">{transaction.status}</span>
            </div>
          </motion.div>
          
          {/* Transaction Info Card */}
          <motion.div 
            className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 divide-y divide-gray-100"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">TRANSACTION DETAILS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium">{transaction.transaction_code || `TXN${transaction.id}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`capitalize font-medium ${
                    transaction.status === 'completed' 
                      ? 'text-green-600' 
                      : transaction.status === 'pending' 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-medium">{formatCurrency(Number(transaction.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">
                    {transaction.timestamp ? 
                      `${formatDate(transaction.timestamp.toString())} • ${formatTime(transaction.timestamp.toString())}` : 
                      'Just now'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium">
                    {transaction.is_offline ? 'Emergency Mode' : 'Regular'}
                  </span>
                </div>
              </div>
            </div>
            
            {merchant && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">MERCHANT DETAILS</h3>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <i className="ri-store-2-line text-primary"></i>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{merchant.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{merchant.category} Service</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Emergency Info */}
          {transaction.is_offline && (
            <motion.div 
              className="bg-amber-50 rounded-lg p-4 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="flex">
                <i className="ri-information-line text-amber-500 mt-0.5 mr-3 text-lg flex-shrink-0"></i>
                <div>
                  <h3 className="font-medium text-amber-700">Emergency Mode Transaction</h3>
                  <p className="text-sm text-amber-700/80">
                    {transaction.status === "pending" 
                      ? "This transaction was made in emergency mode and will be synced with your bank when network connectivity is restored."
                      : "This transaction was made in emergency mode and has been successfully processed."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Action Button */}
          <motion.div 
            className="mt-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <button 
              onClick={handleGoBack}
              className="bg-primary text-white font-medium py-3 rounded-lg w-full"
            >
              Back to Transactions
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionDetail;