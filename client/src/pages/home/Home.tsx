import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import QuickActionButton from '@/components/layout/QuickActionButton';
import BalanceCard from '@/components/financial/BalanceCard';
import StatusBar from '@/components/layout/StatusBar';
import { useAppContext } from '@/context/AppContext';

// Home component now integrated with AppContext
const Home: React.FC = () => {
  const { 
    currentUser: user, 
    transactions, 
    essentialServices 
  } = useAppContext();
  const [, navigate] = useLocation();

  // Limit transactions to 4 most recent ones
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  // If no user data yet, show loading
  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">EmergencyPay</h2>
          <p className="text-sm text-white/80">Offline payments made simple</p>
        </div>
      </div>
      
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        {/* Welcome Header */}
        <motion.div 
          className="px-4 py-6"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-semibold">Hi, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-gray-600 mt-1">Welcome to EmergencyPay</p>
        </motion.div>
        
        {/* Balance Card */}
        <div className="mx-4 mb-6">
          <BalanceCard balance={user.balance} emergencyBalance={user.emergency_balance} />
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
          <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg shadow-md cursor-pointer" onClick={() => navigate('/financial-insights')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Financial Insights</h3>
                <p className="text-white/80 text-sm mt-1">Get personalized analysis of your spending</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <i className="ri-pie-chart-line text-white text-xl"></i>
              </div>
            </div>
            <div className="mt-3 bg-white/20 rounded-full h-1.5">
              <div className="bg-white rounded-full h-1.5 w-5/6"></div>
            </div>
          </div>
        </div>
        
        {/* Essential Services */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Essential Services</h3>
            <button 
              className="text-primary text-sm"
              onClick={() => navigate('/merchants')}
            >
              View All
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
            {essentialServices.map((service, index) => (
              <div
                key={service.id}
                className="flex-shrink-0 w-24 flex flex-col items-center"
              >
                <motion.div
                  className={`w-16 h-16 rounded-full ${service.colorClass} flex items-center justify-center mb-2`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <i className={`${service.icon} text-2xl`}></i>
                </motion.div>
                <p className="text-center text-sm">{service.name}</p>
              </div>
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
            <div className="space-y-3">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  className="bg-white p-3 rounded-lg shadow-sm flex items-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <div className={`h-10 w-10 rounded-full ${transaction.is_offline ? 'bg-amber-100' : 'bg-green-100'} flex items-center justify-center mr-3`}>
                    <i className={`${transaction.is_offline ? 'ri-smartphone-line text-amber-600' : 'ri-bank-card-line text-green-600'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {transaction.is_offline ? 'Offline Payment' : 'Payment'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.timestamp ? new Date(transaction.timestamp).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : 'No date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.sender_id === user.id ? 'text-red-600' : 'text-green-600'}`}>
                      {transaction.sender_id === user.id ? '-' : '+'}₹{Number(transaction.amount).toLocaleString('en-IN')}
                    </p>
                    <p className={`text-xs ${transaction.status === 'completed' ? 'text-green-600' : transaction.status === 'pending' ? 'text-amber-600' : 'text-red-600'}`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
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