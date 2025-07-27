// Transaction status types
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// Merchant categories
export type MerchantCategory = 'medical' | 'food' | 'fuel' | 'transport' | 'groceries' | 'other';

// App connection status
export type ConnectionStatus = 'online' | 'offline' | 'emergency';

// Essential service flags
export interface EssentialService {
  id: string;
  name: string;
  icon: string;
  category: MerchantCategory;
  colorClass: string;
}

// Mock user data interface
export interface MockUser {
  id: number;
  name: string;
  phone: string;
  balance: number;
  emergencyBalance: number;
}

// Bluetooth device interface
export interface BluetoothDevice {
  id: string;
  name: string;
  category: MerchantCategory;
  distance: number;
  isInRange: boolean;
}
