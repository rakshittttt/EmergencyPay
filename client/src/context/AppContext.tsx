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
  const { data: currentUser } = useQuery<User | null>({
    queryKey: ['/api/user'],
    onError: () => {
      return null;
    }
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
  const toggleEmergencyMode = useCallback(() => {
    setIsEmergencyMode(prev => {
      const newValue = !prev;
      if (newValue) {
        setConnectionStatus('emergency');
        showToast({
          title: "Emergency Mode Activated",
          description: "You can now make offline payments via Bluetooth",
          variant: "destructive",
          duration: 5000,
        });
      } else {
        setConnectionStatus('online');
        showToast({
          title: "Emergency Mode Deactivated",
          description: "Returned to normal payment mode",
        });
      }
      return newValue;
    });
  }, []);

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

    try {
      // Create an offline transaction
      const response = await apiRequest('POST', '/api/transactions/offline', {
        sender_id: currentUser.id,
        receiver_id: selectedMerchant.user_id,
        amount,
        is_offline: true,
        status: 'pending',
        signature: 'simulated_signature_' + Date.now()
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const transaction = await response.json();
      
      showToast({
        title: "Payment Initiated",
        description: "Your offline payment is being processed",
      });

      // Refresh the transactions list
      refreshTransactions();
      
      return transaction;
    } catch (error) {
      console.error('Payment error:', error);
      showToast({
        title: "Payment Failed",
        description: "Could not complete the transaction",
        variant: "destructive",
      });
      return null;
    }
  }, [currentUser, selectedMerchant, refreshTransactions]);

  // Reconcile transactions
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
      const response = await apiRequest('POST', '/api/reconcile', {});
      
      if (!response.ok) {
        throw new Error('Failed to reconcile transactions');
      }
      
      const result = await response.json();
      
      showToast({
        title: "Reconciliation Complete",
        description: `${result.results.filter((r: any) => r.status === 'completed').length} transactions processed`,
      });
      
      // Refresh transactions after reconciliation
      refreshTransactions();
    } catch (error) {
      console.error('Reconciliation error:', error);
      showToast({
        title: "Reconciliation Failed",
        description: "Could not process pending transactions",
        variant: "destructive",
      });
    }
  }, [connectionStatus, refreshTransactions]);

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
