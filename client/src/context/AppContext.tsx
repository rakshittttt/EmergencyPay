import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { ConnectionStatus, BluetoothDevice } from '@shared/types';
import io from 'socket.io-client';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  isEmergencyMode: boolean;
  setIsEmergencyMode: (mode: boolean) => void;
  nearbyDevices: BluetoothDevice[];
  setNearbyDevices: (devices: BluetoothDevice[]) => void;
  socket: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: true,
    isEmergencyMode: false,
    networkType: 'wifi',
    lastSync: new Date(),
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<BluetoothDevice[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketConnection = io();
    setSocket(socketConnection);

    socketConnection.on('connect', () => {
      console.log('Socket connected:', socketConnection.id);
    });

    socketConnection.on('networkStatus', (status: { status: string }) => {
      console.log('Network status update:', status);
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: status.status === 'online',
      }));
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Check network status on mount
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const response = await fetch('/api/system/network-status');
        const data = await response.json();
        console.log('Current connection status:', data.status);
        setConnectionStatus(prev => ({
          ...prev,
          isOnline: data.status === 'online',
        }));
      } catch (error) {
        console.error('Failed to check network status:', error);
        setConnectionStatus(prev => ({
          ...prev,
          isOnline: false,
        }));
      }
    };

    checkNetworkStatus();
  }, []);

  const value = {
    user,
    setUser,
    connectionStatus,
    setConnectionStatus,
    isEmergencyMode,
    setIsEmergencyMode,
    nearbyDevices,
    setNearbyDevices,
    socket,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}