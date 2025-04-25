import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import QuickActionButton from '@/components/QuickActionButton';
import BalanceCard from '@/components/BalanceCard';
import SimpleStatusBar from '@/components/SimpleStatusBar';

// Simplified Home component that doesn't use AppContext
const Home: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [, navigate] = useLocation();
  
  // Simplified data for essential services
  const essentialServices = [
    { id: '1', name: 'Pharmacy', icon: 'ri-medicine-bottle-line', category: 'medical', colorClass: 'bg-red-100 text-red-600' },
    { id: '2', name: 'Groceries', icon: 'ri-shopping-basket-2-line', category: 'groceries', colorClass: 'bg-green-100 text-green-600' },
    { id: '3', name: 'Fuel', icon: 'ri-gas-station-line', category: 'fuel', colorClass: 'bg-yellow-100 text-yellow-600' },
    { id: '4', name: 'Transport', icon: 'ri-taxi-line', category: 'transport', colorClass: 'bg-blue-100 text-blue-600' }
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          // After getting user, fetch their transactions
          if (userData.id) {
            const transRes = await fetch(`/api/transactions/${userData.id}`);
            if (transRes.ok) {
              const transData = await transRes.json();
              setTransactions(transData);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  // Limit transactions to 4 most recent ones
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs font-medium">Online</span>
        </div>
      </div>
      
      <SimpleStatusBar connectionStatus="online" />
      
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
        </div>
        
        {/* Essential Services */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Essential Services</h3>
            <button className="text-primary text-sm">View All</button>
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
                      {new Date(transaction.timestamp).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
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
