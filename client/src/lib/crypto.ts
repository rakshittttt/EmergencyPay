// This file simulates cryptographic operations for the demo
// In a real application, we would use a proper crypto library

// Simulated key pair generation
export function generateKeyPair() {
  // In a real app, this would use a proper ED25519 implementation
  const publicKey = generateRandomString(32);
  const privateKey = generateRandomString(64);
  
  return { publicKey, privateKey };
}

// Generate a signature for a transaction
export function signTransaction(privateKey: string, transactionData: any): string {
  // In a real app, this would create a proper digital signature
  const dataString = JSON.stringify(transactionData);
  return `sig_${hashString(privateKey + dataString)}`;
}

// Verify a transaction signature
export function verifySignature(
  publicKey: string, 
  transactionData: any, 
  signature: string
): boolean {
  // In a real app, this would properly verify the digital signature
  const dataString = JSON.stringify(transactionData);
  const expectedSignature = `sig_${hashString(getSimulatedPrivateKey(publicKey) + dataString)}`;
  return signature === expectedSignature;
}

// Helpers for the simulation
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

function hashString(str: string): string {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// For demo purposes only - in a real app the private key would never be derivable from the public key
function getSimulatedPrivateKey(publicKey: string): string {
  return publicKey + '_private_part';
}

// Generate a transaction code (like a reference number)
export function generateTransactionCode(): string {
  return `EMG${Math.floor(1000000 + Math.random() * 9000000)}`;
}
