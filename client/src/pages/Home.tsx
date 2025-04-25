import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import StatusBar from '@/components/StatusBar';
import BalanceCard from '@/components/BalanceCard';
import QuickActionButton from '@/components/QuickActionButton';
import EssentialServiceCard from '@/components/EssentialServiceCard';
import TransactionItem from '@/components/TransactionItem';
import { useAppContext } from '@/context/AppContext';

const Home: React.FC = () => {
  const { 
    currentUser, 
    transactions,
    essentialServices,
    refreshTransactions
  } = useAppContext();

  useEffect(() => {
    // Refresh transactions when the component mounts
    refreshTransactions();
  }, [refreshTransactions]);

  const [, navigate] = useLocation();
  
  // Limit transactions to 4 most recent ones
  const recentTransactions = transactions
    .sort((a, b) => {
      // Handle null timestamps safely
      const dateA = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      const dateB = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 4);

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        {/* Welcome Header */}
        <motion.div 
          className="px-4 py-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-semibold">Hi, {currentUser?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-gray-600 mt-1">Welcome to EmergencyPay</p>
        </motion.div>
        
        {/* Balance Card */}
        <div className="mx-4 mb-6">
          <BalanceCard />
        </div>
        
        {/* Quick Actions */}
        <div className="px-4 mb-8">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-4 gap-4">
            <QuickActionButton 
              icon="ri-qr-scan-line" 
              label="Scan QR" 
              path="/qr-scan"
              delay={0}
            />
            <QuickActionButton 
              icon="ri-smartphone-line" 
              label="Pay Contact" 
              path="/bluetooth-payment"
              delay={1}
            />
            <QuickActionButton 
              icon="ri-store-2-line" 
              label="Merchants" 
              path="/merchants"
              delay={2}
            />
            <QuickActionButton 
              icon="ri-history-line" 
              label="History" 
              path="/transactions"
              delay={3}
            />
          </div>
        </div>
        
        {/* Essential Services */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Essential Services</h3>
            <button className="text-primary text-sm">View All</button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {essentialServices.map((service, index) => (
              <EssentialServiceCard 
                key={service.id} 
                service={service} 
                index={index}
              />
            ))}
          </div>
        </div>
        
        {/* Recent Transactions */}
        <div className="px-4 pb-24">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Recent Transactions</h3>
            <button 
              className="text-primary text-sm"
              onClick={() => navigate('/transactions')}
            >
              See All
            </button>
          </div>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                index={index}
              />
            ))
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
