import { Merchant } from '@shared/schema';

// This file simulates Bluetooth Low Energy operations for the demo
// In a real application, we would use proper BLE APIs

// Simulate Bluetooth device discovery
export async function simulateBluetoothDeviceDiscovery(
  merchants: Merchant[]
): Promise<Merchant[]> {
  return new Promise((resolve) => {
    // Simulate a delay for scanning
    setTimeout(() => {
      // Get a random subset of merchants
      const shuffled = [...merchants].sort(() => 0.5 - Math.random());
      const selectedMerchants = shuffled.slice(0, Math.min(3, merchants.length));
      
      resolve(selectedMerchants);
    }, 2000);
  });
}

// Simulate connecting to a merchant's device
export async function simulateBluetoothConnect(
  merchantId: number
): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate connection delay and success (90% success rate)
    setTimeout(() => {
      const success = Math.random() < 0.9;
      resolve(success);
    }, 1500);
  });
}

// Simulate sending a transaction via Bluetooth
export async function simulateBluetoothSendTransaction(
  transactionData: any
): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate sending delay and success (95% success rate)
    setTimeout(() => {
      const success = Math.random() < 0.95;
      resolve(success);
    }, 2000);
  });
}

// Simulate disconnecting from a Bluetooth device
export async function simulateBluetoothDisconnect(): Promise<void> {
  return new Promise((resolve) => {
    // Simulate disconnection delay
    setTimeout(() => {
      resolve();
    }, 500);
  });
}

// Get mock distances for devices in meters
export function getMockDistances(deviceCount: number): number[] {
  const distances: number[] = [];
  
  for (let i = 0; i < deviceCount; i++) {
    // Generate random distances between 1m and 15m
    distances.push(Math.floor(Math.random() * 15) + 1);
  }
  
  return distances;
}

// Check if a device is in range (max 10m for Bluetooth Low Energy)
export function isDeviceInRange(distance: number): boolean {
  return distance <= 10;
}
