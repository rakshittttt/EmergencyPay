export interface ConnectionStatus {
  isOnline: boolean;
  isEmergencyMode: boolean;
  networkType: 'wifi' | 'cellular' | 'offline';
  lastSync: Date | null;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  type: 'merchant' | 'user';
  distance: number;
  isEssential?: boolean;
  publicKey?: string;
}

export interface PaymentRequest {
  amount: number;
  recipientId: number;
  recipientName: string;
  description?: string;
  type: 'UPI' | 'BLUETOOTH' | 'BANK_TRANSFER';
}

export interface OfflineTransaction {
  id: string;
  senderId: number;
  receiverId: number;
  amount: number;
  timestamp: Date;
  signature: string;
  type: 'BLUETOOTH';
  status: 'pending';
}

export interface EmergencyModeConfig {
  enabled: boolean;
  essentialServicesOnly: boolean;
  maxTransactionAmount: number;
  allowedCategories: string[];
}

export interface InsightData {
  totalSpending: number;
  emergencySpending: number;
  transactionCount: number;
  mostUsedCategory: string;
  emergencyReadinessScore: number;
  monthlyTrend: number;
}

export interface NetworkToggleStatus {
  status: 'online' | 'offline';
  timestamp: Date;
  reason?: 'manual' | 'network_failure' | 'system';
}