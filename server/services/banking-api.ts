/**
 * Banking API Integration Service
 * 
 * This service simulates a connection to a banking API for real-time transactions.
 * In a production environment, this would connect to real banking APIs like UPI, NEFT, etc.
 */

import { log } from '../vite';
import { emitToAll } from '../socket';
import { Transaction } from '../../shared/schema';

// Simulated banking API response times (ms)
const TRANSACTION_TIME = {
  ONLINE: { min: 500, max: 2000 },
  OFFLINE: { min: 1000, max: 5000 }
};

// Transaction success probability
const SUCCESS_RATE = {
  ONLINE: 0.95,
  OFFLINE: 0.8
};

export interface BankingAPIResponse {
  success: boolean;
  transactionId?: string;
  referenceNumber?: string;
  message: string;
  statusCode: number;
  timestamp: Date;
}

/**
 * Process an online transaction through banking APIs
 */
export async function processOnlineTransaction(
  senderAccount: string,
  receiverAccount: string,
  amount: string,
  transactionId: string
): Promise<BankingAPIResponse> {
  // Log the transaction attempt
  log(`Processing online transaction: ${amount} from ${senderAccount} to ${receiverAccount}`, 'banking-api');
  
  // Simulate API processing time
  const processingTime = Math.floor(
    Math.random() * (TRANSACTION_TIME.ONLINE.max - TRANSACTION_TIME.ONLINE.min) + 
    TRANSACTION_TIME.ONLINE.min
  );
  
  // Simulate API response
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccessful = Math.random() < SUCCESS_RATE.ONLINE;
      
      // Create a response
      const response: BankingAPIResponse = {
        success: isSuccessful,
        transactionId: isSuccessful ? transactionId : undefined,
        referenceNumber: isSuccessful ? `REF${Date.now().toString().slice(-8)}` : undefined,
        message: isSuccessful ? 'Transaction processed successfully' : 'Transaction failed: insufficient funds or network error',
        statusCode: isSuccessful ? 200 : 400,
        timestamp: new Date()
      };
      
      // Emit real-time update via socket
      emitToAll('transaction-update', {
        transactionId,
        status: isSuccessful ? 'completed' : 'failed',
        message: response.message
      });
      
      resolve(response);
    }, processingTime);
  });
}

/**
 * Process an offline (emergency mode) transaction through local verification
 */
export async function processOfflineTransaction(
  senderAccount: string,
  receiverAccount: string,
  amount: string,
  transactionId: string
): Promise<BankingAPIResponse> {
  // Log the transaction attempt
  log(`Processing offline transaction: ${amount} from ${senderAccount} to ${receiverAccount}`, 'banking-api');
  
  // Simulate offline processing time
  const processingTime = Math.floor(
    Math.random() * (TRANSACTION_TIME.OFFLINE.max - TRANSACTION_TIME.OFFLINE.min) + 
    TRANSACTION_TIME.OFFLINE.min
  );
  
  // Simulate offline transaction
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccessful = Math.random() < SUCCESS_RATE.OFFLINE;
      
      // Create a response
      const response: BankingAPIResponse = {
        success: isSuccessful,
        transactionId: isSuccessful ? transactionId : undefined,
        referenceNumber: isSuccessful ? `EMG${Date.now().toString().slice(-8)}` : undefined,
        message: isSuccessful ? 'Offline transaction processed successfully' : 'Offline transaction failed: verification error',
        statusCode: isSuccessful ? 200 : 400,
        timestamp: new Date()
      };
      
      // Emit real-time update via socket
      emitToAll('transaction-update', {
        transactionId,
        status: isSuccessful ? 'completed' : 'failed',
        message: response.message,
        isOffline: true
      });
      
      resolve(response);
    }, processingTime);
  });
}

/**
 * Verify a pending transaction during reconciliation
 */
export async function verifyPendingTransaction(transaction: Transaction): Promise<BankingAPIResponse> {
  // Log the verification attempt
  log(`Verifying pending transaction: ${transaction.id}`, 'banking-api');
  
  // Simulate verification time
  const verificationTime = Math.floor(Math.random() * 2000 + 1000);
  
  // Simulate verification process
  return new Promise((resolve) => {
    setTimeout(() => {
      const isVerified = Math.random() < 0.85; // 85% verification success rate
      
      // Create a response
      const response: BankingAPIResponse = {
        success: isVerified,
        transactionId: transaction.id.toString(),
        referenceNumber: isVerified ? `VRF${Date.now().toString().slice(-8)}` : undefined,
        message: isVerified ? 'Transaction verified successfully' : 'Transaction verification failed',
        statusCode: isVerified ? 200 : 400,
        timestamp: new Date()
      };
      
      // Emit real-time update
      emitToAll('verification-update', {
        transactionId: transaction.id,
        status: isVerified ? 'completed' : 'failed',
        message: response.message
      });
      
      resolve(response);
    }, verificationTime);
  });
}

/**
 * Add funds to account via UPI/bank transfer
 */
export async function addFundsToAccount(
  accountId: number,
  amount: string,
  source: 'UPI' | 'CARD' | 'NETBANKING'
): Promise<BankingAPIResponse> {
  // Log the fund addition attempt
  log(`Adding ${amount} to account ${accountId} via ${source}`, 'banking-api');
  
  // Simulate processing time
  const processingTime = Math.floor(Math.random() * 1500 + 500);
  
  // Simulate fund addition
  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccessful = Math.random() < 0.98; // 98% success rate for adding funds
      
      // Create a response
      const response: BankingAPIResponse = {
        success: isSuccessful,
        referenceNumber: isSuccessful ? `ADD${Date.now().toString().slice(-8)}` : undefined,
        message: isSuccessful ? `Successfully added ₹${amount} to your account` : 'Failed to add funds: payment gateway error',
        statusCode: isSuccessful ? 200 : 402,
        timestamp: new Date()
      };
      
      // Emit real-time update
      emitToAll('balance-update', {
        userId: accountId,
        status: isSuccessful ? 'completed' : 'failed',
        message: response.message,
        amount: isSuccessful ? amount : '0'
      });
      
      resolve(response);
    }, processingTime);
  });
}