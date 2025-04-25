import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConnectionStatus, TransactionStatus, EssentialService, MockUser } from '@shared/types';
import { Transaction, Merchant, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { simulateBluetoothDeviceDiscovery } from '@/lib/bluetooth';
import { toast as showToast } from '@/hooks/use-toast';

// Define the context state type
interface AppContextType {
  connectionStatus: ConnectionStatus;
  isEmergencyMode: boolean;
  toggleEmergencyMode: () => void;
  currentUser: User | null;
  currentRoute: string;
  setCurrentRoute: (route: string) => void;
  transactions: Transaction[];
  merchants: Merchant[];
  essentialServices: EssentialService[];
  discoveredDevices: Merchant[];
  startDeviceDiscovery: () => void;
  stopDeviceDiscovery: () => void;
  isScanning: boolean;
  selectedMerchant: Merchant | null;
  selectMerchant: (merchant: Merchant | null) => void;
  initiatePayment: (amount: number) => Promise<Transaction | null>;
  reconcileTransactions: () => Promise<void>;
  refreshTransactions: () => void;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Using the imported toast function directly
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('/');
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  // Fetch current user
  const { data: currentUser, refetch: refetchUser } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user');
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    // Ensure we always return User | null (not undefined)
    select: (data) => data || null
  });

  // Fetch transactions
  const { data: transactions = [], refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const res = await fetch(`/api/transactions/${currentUser.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentUser?.id
  });

  // Refresh transactions function
  const refreshTransactions = useCallback(() => {
    refetchTransactions();
  }, [refetchTransactions]);

  // Fetch merchants
  const { data: merchants = [] } = useQuery<Merchant[]>({
    queryKey: ['/api/merchants'],
    queryFn: async () => {
      const res = await fetch('/api/merchants');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Define essential services
  const essentialServices: EssentialService[] = [
    {
      id: 'medical',
      name: 'Medical',
      icon: 'ri-medicine-bottle-line',
      category: 'medical',
      colorClass: 'bg-amber-50 text-amber-500'
    },
    {
      id: 'food',
      name: 'Food',
      icon: 'ri-restaurant-line',
      category: 'food',
      colorClass: 'bg-emerald-50 text-emerald-500'
    },
    {
      id: 'fuel',
      name: 'Fuel',
      icon: 'ri-gas-station-line',
      category: 'fuel',
      colorClass: 'bg-blue-50 text-blue-500'
    },
    {
      id: 'transport',
      name: 'Transport',
      icon: 'ri-bus-2-line',
      category: 'transport',
      colorClass: 'bg-purple-50 text-purple-500'
    },
    {
      id: 'groceries',
      name: 'Groceries',
      icon: 'ri-shopping-basket-line',
      category: 'groceries',
      colorClass: 'bg-pink-50 text-pink-500'
    }
  ];

  // Toggle emergency mode
  const toggleEmergencyMode = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const newValue = !isEmergencyMode;
      
      if (newValue) {
        // Move some money from regular balance to emergency balance
        if (parseFloat(currentUser.balance) < 1000) {
          showToast({
            title: "Insufficient Balance",
            description: "You need at least ₹1,000 to activate Emergency Mode",
            variant: "destructive",
          });
          return;
        }
        
        setConnectionStatus('emergency');
        
        // Update balances in the database
        const emergencyAmount = 1000;
        const newBalance = (parseFloat(currentUser.balance) - emergencyAmount).toString();
        const newEmergencyBalance = (parseFloat(currentUser.emergency_balance) + emergencyAmount).toString();
        
        await fetch(`/api/users/${currentUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balance: newBalance,
            emergency_balance: newEmergencyBalance
          })
        });
        
        showToast({
          title: "Emergency Mode Activated",
          description: `₹${emergencyAmount.toLocaleString('en-IN')} transferred to emergency balance`,
          variant: "destructive",
          duration: 5000,
        });
      } else {
        // Return to online mode
        setConnectionStatus('online');
        
        // We don't auto-transfer back from emergency to regular
        // In a real app, emergency funds would remain reserved until reconciled
        showToast({
          title: "Emergency Mode Deactivated",
          description: "Returned to normal payment mode",
        });
      }
      
      setIsEmergencyMode(newValue);
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to toggle emergency mode",
        variant: "destructive",
      });
    }
  }, [currentUser, isEmergencyMode]);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Only change connection if not in emergency mode
      if (!isEmergencyMode) {
        // 95% chance to stay online, 5% chance to go offline
        const goOffline = Math.random() < 0.05;
        
        if (goOffline && connectionStatus === 'online') {
          setConnectionStatus('offline');
          showToast({
            title: "Connection Lost",
            description: "UPI services are temporarily unavailable. Consider switching to Emergency Mode.",
            variant: "destructive",
          });
        } else if (!goOffline && connectionStatus === 'offline') {
          setConnectionStatus('online');
          showToast({
            title: "Connection Restored",
            description: "UPI services are now available.",
          });
        }
      }
    }, 45000); // Check every 45 seconds
    
    return () => clearInterval(interval);
  }, [connectionStatus, isEmergencyMode]);

  // Start Bluetooth device discovery
  const startDeviceDiscovery = useCallback(() => {
    setIsScanning(true);
    
    // Use the imported function to simulate device discovery
    simulateBluetoothDeviceDiscovery(merchants)
      .then(devices => {
        setDiscoveredDevices(devices);
      })
      .finally(() => {
        setIsScanning(false);
      });
  }, [merchants]);

  // Stop Bluetooth scanning
  const stopDeviceDiscovery = useCallback(() => {
    setIsScanning(false);
  }, []);

  // Select a merchant for payment
  const selectMerchant = useCallback((merchant: Merchant | null) => {
    setSelectedMerchant(merchant);
  }, []);

  // Initiate a payment
  const initiatePayment = useCallback(async (amount: number): Promise<Transaction | null> => {
    if (!selectedMerchant || !currentUser) {
      showToast({
        title: "Payment Failed",
        description: "Missing merchant or user information",
        variant: "destructive",
      });
      return null;
    }
    
    // Check if emergency mode is enabled
    if (isEmergencyMode && connectionStatus === 'emergency') {
      // Check if user has sufficient emergency balance
      if (parseFloat(currentUser.emergency_balance) < amount) {
        showToast({
          title: "Insufficient Emergency Balance",
          description: "Please add funds to your emergency balance",
          variant: "destructive",
        });
        return null;
      }
      
      try {
        // Process payment through banking API in emergency mode
        const response = await apiRequest('POST', '/api/banking/emergency-payment', {
          senderId: currentUser.id,
          receiverId: selectedMerchant.user_id,
          amount: amount.toString(),
          method: 'BLUETOOTH'
        });
        
        if (!response.ok) {
          throw new Error('Failed to process emergency payment');
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Show success message immediately
          showToast({
            title: "Payment Successful",
            description: `Paid ₹${amount} via Bluetooth in emergency mode`,
          });
          
          // Refresh the transactions list
          refreshTransactions();
          
          // In emergency mode, create a minimal transaction object to return
          // This way the UI can still navigate to success page even if GET fails
          const pendingTransaction: Transaction = {
            id: result.transactionId,
            sender_id: currentUser.id,
            receiver_id: selectedMerchant.user_id,
            amount: amount.toString(),
            status: "pending",
            transaction_code: result.transactionCode || "EMERGENCY",
            timestamp: new Date(),
            signature: null,
            is_offline: true
          };
          
          try {
            // Try to get transaction details, but don't fail if not found
            const txnResponse = await apiRequest('GET', `/api/transactions/${result.transactionId}`);
            const fetchedTransaction = await txnResponse.json();
            
            // If we got a valid transaction as an array, use the first one, otherwise use our pending one
            if (Array.isArray(fetchedTransaction)) {
              if (fetchedTransaction.length > 0) {
                // We have a valid transaction in the array
                return fetchedTransaction[0] as Transaction;
              } else {
                // Empty array means no transaction found yet
                return pendingTransaction;
              }
            } else if (fetchedTransaction && typeof fetchedTransaction === 'object') {
              // We got a single transaction object
              return fetchedTransaction as Transaction;
            } else {
              // Fallback to pending transaction
              return pendingTransaction;
            }
          } catch (error) {
            console.log("Could not fetch transaction details, using pending transaction", error);
            return pendingTransaction;
          }
        } else {
          throw new Error(result.message || 'Payment processing failed');
        }
      } catch (error) {
        console.error('Emergency payment error:', error);
        showToast({
          title: "Payment Failed",
          description: error instanceof Error ? error.message : "Could not complete the transaction",
          variant: "destructive",
        });
        return null;
      }
    } else {
      // Regular online transaction flow
      try {
        // Process normal online transaction
        const response = await apiRequest('POST', '/api/banking/transfer', {
          senderId: currentUser.id,
          receiverId: selectedMerchant.user_id,
          amount: amount.toString()
        });

        if (!response.ok) {
          throw new Error('Failed to process online payment');
        }

        const result = await response.json();
        
        if (result.success) {
          // Get the transaction details
          const txnResponse = await apiRequest('GET', `/api/transactions/${result.transactionId}`);
          const transaction = await txnResponse.json();
          
          showToast({
            title: "Payment Successful",
            description: `Paid ₹${amount} to ${selectedMerchant.name}`,
          });
          
          // Refresh the transactions list
          refreshTransactions();
          
          return transaction;
        } else {
          throw new Error(result.message || 'Payment processing failed');
        }
      } catch (error) {
        console.error('Payment error:', error);
        showToast({
          title: "Payment Failed",
          description: error instanceof Error ? error.message : "Could not complete the transaction",
          variant: "destructive",
        });
        return null;
      }
    }
  }, [currentUser, selectedMerchant, refreshTransactions, isEmergencyMode, connectionStatus]);

  // Reconcile transactions using banking API
  const reconcileTransactions = useCallback(async () => {
    if (connectionStatus !== 'online') {
      showToast({
        title: "Reconciliation Failed",
        description: "You need to be online to reconcile transactions",
        variant: "destructive",
      });
      return;
    }

    try {
      showToast({
        title: "Reconciliation Started",
        description: "Processing offline transactions...",
      });
      
      // Use the enhanced banking API endpoint
      const response = await apiRequest('POST', '/api/banking/reconcile', {});
      
      if (!response.ok) {
        throw new Error('Failed to reconcile transactions');
      }
      
      const result = await response.json();
      
      // Calculate completed vs pending transactions
      const completedCount = result.results.filter((r: any) => r.status === 'completed').length;
      const pendingCount = result.results.filter((r: any) => r.status === 'pending').length;
      
      showToast({
        title: "Reconciliation Complete",
        description: 
          `${completedCount} transaction${completedCount !== 1 ? 's' : ''} processed successfully. ` +
          `${pendingCount} still pending.`,
        duration: 5000, // Show this message a bit longer
      });
      
      // Refresh user data to show updated balances
      if (currentUser) {
        refetchUser();
      }
      
      // Refresh transactions after reconciliation
      refreshTransactions();
    } catch (error) {
      console.error('Reconciliation error:', error);
      showToast({
        title: "Reconciliation Failed",
        description: "Could not process pending transactions. Please try again later.",
        variant: "destructive",
      });
    }
  }, [connectionStatus, refreshTransactions, currentUser, refetchUser]);

  // Context value
  const contextValue: AppContextType = {
    connectionStatus,
    isEmergencyMode,
    toggleEmergencyMode,
    currentUser,
    currentRoute,
    setCurrentRoute,
    transactions,
    merchants,
    essentialServices,
    discoveredDevices,
    startDeviceDiscovery,
    stopDeviceDiscovery,
    isScanning,
    selectedMerchant,
    selectMerchant,
    initiatePayment,
    reconcileTransactions,
    refreshTransactions
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
