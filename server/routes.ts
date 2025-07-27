import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import crypto from 'crypto';
import { insertUserSchema, insertTransactionSchema, insertMerchantSchema } from "@shared/schema";

import { processOnlineTransaction, processOfflineTransaction, verifyPendingTransaction, addFundsToAccount } from './banking-api';
import { setupSocketIO, emitToAll } from './socket';
import { setupAuthRoutes } from './auth';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define connection status types
type ConnectionStatus = 'online' | 'offline' | 'emergency';

// Declare global connection status
declare global {
  namespace NodeJS {
    interface Global {
      connectionStatus: ConnectionStatus;
    }
  }
}

// Get current file directory (ES Module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store connection status
const STATUS_FILE_PATH = path.join(__dirname, '../connection-status.json');

// Function to load connection status from file
function loadConnectionStatus(): ConnectionStatus {
  try {
    if (fs.existsSync(STATUS_FILE_PATH)) {
      const data = fs.readFileSync(STATUS_FILE_PATH, 'utf8');
      const statusData = JSON.parse(data);
      
      if (statusData && ['online', 'offline', 'emergency'].includes(statusData.status)) {
        console.log(`Loaded connection status from file: ${statusData.status}`);
        return statusData.status as ConnectionStatus;
      }
    }
  } catch (error) {
    console.error('Error loading connection status:', error);
  }
  
  // Default to online if file doesn't exist or is invalid
  return 'online';
}

// Function to save connection status to file
function saveConnectionStatus(status: ConnectionStatus): void {
  try {
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify({ status }));
    console.log(`Saved connection status to file: ${status}`);
  } catch (error) {
    console.error('Error saving connection status:', error);
  }
}

// Initialize connection status
(global as any).connectionStatus = loadConnectionStatus();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Add funds to user account (real bank connection simulation)
  apiRouter.post('/banking/add-funds', async (req, res) => {
    try {
      const { userId, amount, source } = req.body;
      
      if (!userId || !amount || !source) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate user exists
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Process through banking API
      const result = await addFundsToAccount(
        parseInt(userId), 
        amount.toString(), 
        source
      );
      
      if (result.success) {
        // Update user's balance in database
        const newBalance = (parseFloat(user.balance) + parseFloat(amount)).toString();
        await storage.updateUser(parseInt(userId), { balance: newBalance });
        
        // Emit real-time update
        emitToAll('user-updated', { userId: parseInt(userId) });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Add funds error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process fund addition', 
        statusCode: 500
      });
    }
  });
  
  // Process a bank transfer (online transaction)
  apiRouter.post('/banking/transfer', async (req, res) => {
    try {
      const { senderId, receiverId, amount, forceOnline } = req.body;
      
      if (!senderId || !receiverId || !amount) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check connection status from request or simulate outage for testing
      // For UPI, we consider it "down" in OFFLINE mode
      // In EMERGENCY mode, only essential services (medical) can use UPI
      const isEmergencyMode = (global as any).connectionStatus === 'emergency';
      const isOfflineMode = (global as any).connectionStatus === 'offline';
      const isUpiDown = !!req.query.simulate_outage || isOfflineMode;
      
      // Check if we should allow this transaction in emergency mode
      // In emergency mode, only medical services can use UPI
      // For all other merchant categories, force them to use Bluetooth in emergency mode
      let forceEmergencyPayment = false;
      if (isEmergencyMode) {
        // Get merchant details
        const receiver = await storage.getUser(parseInt(receiverId));
        if (receiver) {
          const merchantDetails = await storage.getMerchantByUserId(parseInt(receiverId));
          if (merchantDetails && merchantDetails.category !== 'medical') {
            // Non-medical merchants must use emergency payment in emergency mode
            forceEmergencyPayment = true;
          }
        }
      }
      
      // Return error if UPI is down or if we need to force emergency payment and not forcing online
      if ((isUpiDown || forceEmergencyPayment) && !forceOnline) {
        return res.status(503).json({ 
          success: false,
          message: isUpiDown 
            ? 'UPI services are currently down. Please use Emergency Pay instead.'
            : 'Non-medical payments must use Bluetooth in emergency mode.',
          statusCode: 503
        });
      }
      
      // Validate users exist
      const sender = await storage.getUser(parseInt(senderId));
      const receiver = await storage.getUser(parseInt(receiverId));
      
      if (!sender || !receiver) {
        return res.status(404).json({ 
          message: !sender ? 'Sender not found' : 'Receiver not found' 
        });
      }
      
      // Check sufficient balance with precise decimal handling
      // Convert balance and amount to numbers with 2 decimal precision
      const senderBalance = Math.round(parseFloat(sender.balance) * 100) / 100;
      const transferAmount = Math.round(parseFloat(amount) * 100) / 100;
      
      console.log(`Transfer attempt: ${transferAmount} from balance ${senderBalance}`);
      
      // Use epsilon comparison instead of exact equality for floating point numbers
      const epsilon = 0.001; // A very small value to account for floating point precision
      if (senderBalance + epsilon < transferAmount) {
        console.log(`Insufficient balance: ${senderBalance} < ${transferAmount}`);
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Check connection status to determine how to record the transaction
      // Use the values we already have from earlier in the function
      
      // Create transaction record
    const transaction = await storage.createTransaction({
      sender_id: parseInt(senderId),
      receiver_id: parseInt(receiverId),
      amount: amount.toString(),
      status: 'pending',
      is_offline: global.connectionStatus !== 'online',
      transaction_code: `TXN${Math.floor(1000000 + Math.random() * 9000000)}`,
      method: global.connectionStatus === 'emergency' ? 'BLUETOOTH' : 'UPI'  // Use appropriate method based on connection status
    });
      
      // Process through banking API
      const result = await processOnlineTransaction(
        sender.phone,
        receiver.phone,
        amount.toString(),
        transaction.id.toString()
      );
      
      if (result.success) {
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed');
        
        // Update balances with proper decimal precision
        const senderBalance = Math.round(parseFloat(sender.balance) * 100) / 100;
        const receiverBalance = Math.round(parseFloat(receiver.balance) * 100) / 100;
        const transferAmount = Math.round(parseFloat(amount) * 100) / 100;
        
        // Calculate new balances with 2 decimal places
        const newSenderBalance = (senderBalance - transferAmount).toFixed(2);
        const newReceiverBalance = (receiverBalance + transferAmount).toFixed(2);
        
        console.log(`Updated balances: Sender ${senderBalance} → ${newSenderBalance}, Receiver ${receiverBalance} → ${newReceiverBalance}`);
        
        await storage.updateUser(parseInt(senderId), { balance: newSenderBalance });
        await storage.updateUser(parseInt(receiverId), { balance: newReceiverBalance });
        
        // Emit real-time updates
        emitToAll('transaction-completed', { 
          transactionId: transaction.id,
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId)
        });
      } else {
        // Mark transaction as failed
        await storage.updateTransactionStatus(transaction.id, 'failed');
      }
      
      res.json({
        ...result,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process transfer', 
        statusCode: 500
      });
    }
  });
  
  // Process an offline payment (Bluetooth or QR)
  apiRouter.post('/banking/emergency-payment', async (req, res) => {
    try {
      const { senderId, receiverId, amount, method } = req.body;
      
      if (!senderId || !receiverId || !amount || !method) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Validate users exist
      const sender = await storage.getUser(parseInt(senderId));
      const receiver = await storage.getUser(parseInt(receiverId));
      
      if (!sender || !receiver) {
        return res.status(404).json({ 
          message: !sender ? 'Sender not found' : 'Receiver not found' 
        });
      }
      
      // Check sufficient emergency balance with precise decimal handling
      // Convert balance and amount to numbers with 2 decimal precision
      const emergencyBalance = Math.round(parseFloat(sender.emergency_balance) * 100) / 100;
      const transferAmount = Math.round(parseFloat(amount) * 100) / 100;
      
      console.log(`Emergency transfer attempt: ${transferAmount} from emergency balance ${emergencyBalance}`);
      
      // Use epsilon comparison instead of exact equality for floating point numbers
      const epsilon = 0.001; // A very small value to account for floating point precision
      if (emergencyBalance + epsilon < transferAmount) {
        console.log(`Insufficient emergency balance: ${emergencyBalance} < ${transferAmount}`);
        return res.status(400).json({ message: 'Insufficient emergency balance' });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        sender_id: parseInt(senderId),
        receiver_id: parseInt(receiverId),
        amount: amount.toString(),
        status: 'pending',
        is_offline: true,
        transaction_code: `EMG${Math.floor(1000000 + Math.random() * 9000000)}`,
        method: method // Use the specified method (BLUETOOTH or other emergency methods)
      });
      
      // Add to pending sync
      await storage.createPendingSync({
        transaction_id: transaction.id,
        retry_count: 0
      });
      
      // Process through offline banking API
      const result = await processOfflineTransaction(
        sender.phone,
        receiver.phone,
        amount.toString(),
        transaction.id.toString()
      );
      
      if (result.success) {
        // For emergency transactions, we keep the status as 'pending'
        // They will be reconciled when connectivity is restored
        // This is more realistic for an offline emergency payment system
        
        // Update emergency balance only (regular balance remains the same in offline mode)
        // Use precise decimal handling
        const emergencyBalance = Math.round(parseFloat(sender.emergency_balance) * 100) / 100;
        const transferAmount = Math.round(parseFloat(amount) * 100) / 100;
        
        // Calculate new emergency balance with 2 decimal places
        const newSenderEmergencyBalance = (emergencyBalance - transferAmount).toFixed(2);
        
        console.log(`Updated emergency balance: ${emergencyBalance} → ${newSenderEmergencyBalance}`);
        
        await storage.updateUser(parseInt(senderId), { 
          emergency_balance: newSenderEmergencyBalance 
        });
        
        // Emit real-time updates - note we're still calling it completed for notification purposes
        // but the actual status in the database remains 'pending'
        emitToAll('emergency-transaction-completed', { 
          transactionId: transaction.id,
          senderId: parseInt(senderId),
          receiverId: parseInt(receiverId),
          method
        });
      }
      
      res.json({
        ...result,
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Emergency payment error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process emergency payment', 
        statusCode: 500
      });
    }
  });
  
  // Enhanced reconciliation with real banking API
  apiRouter.post('/banking/reconcile', async (req, res) => {
    try {
      const pendingSyncs = await storage.getPendingSyncs();
      const results = [];
      
      for (const pendingSync of pendingSyncs) {
        const transaction = await storage.getTransaction(pendingSync.transaction_id);
        if (!transaction) continue;
        
        // Verify transaction through banking API
        const verificationResult = await verifyPendingTransaction(transaction);
        
        if (verificationResult.success) {
          // Update transaction status to completed
          await storage.updateTransactionStatus(transaction.id, 'completed');
          
          // Remove from pending sync
          await storage.deletePendingSync(pendingSync.id);
          
          // Get the receiver to update their balance
          const receiver = await storage.getUser(transaction.receiver_id);
          if (receiver) {
            const receiverBalance = Math.round(parseFloat(receiver.balance) * 100) / 100;
            const transactionAmount = Math.round(parseFloat(transaction.amount) * 100) / 100;
            
            // Calculate new balance with 2 decimal places
            const newReceiverBalance = (receiverBalance + transactionAmount).toFixed(2);
            
            console.log(`Reconciliation: Updated receiver balance from ${receiverBalance} to ${newReceiverBalance}`);
            
            await storage.updateUser(receiver.id, { balance: newReceiverBalance });
          }
          
          // The critical fix: DON'T adjust the sender's emergency balance again,
          // as it was already deducted during the emergency payment process
          
          results.push({
            transaction_id: transaction.id,
            status: 'completed',
            message: 'Transaction successfully reconciled'
          });
        } else {
          // Increment retry count
          await storage.updatePendingSync(pendingSync.id, pendingSync.retry_count + 1);
          
          results.push({
            transaction_id: transaction.id,
            status: 'pending',
            message: 'Reconciliation failed, will retry'
          });
        }
      }
      
      // Emit real-time update for reconciliation complete
      emitToAll('reconciliation-complete', { results });
      
      res.json({
        message: 'Reconciliation process completed',
        results
      });
    } catch (error) {
      console.error('Reconciliation error:', error);
      res.status(500).json({ message: 'Failed to reconcile transactions' });
    }
  });

  // Create an HTTP server
  const httpServer = createServer(app);
  
  // Set up Socket.IO
  setupSocketIO(httpServer);

  // Get current user (for demo purposes, just return the first user)
  apiRouter.get("/user", async (_req, res) => {
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove private key before sending to client
    const { private_key, ...safeUser } = user;
    res.json(safeUser);
  });
  
  // Get single transaction by ID
  apiRouter.get("/transactions/single/:id", async (req, res) => {
    const txnId = parseInt(req.params.id);
    if (isNaN(txnId)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    
    try {
      const transaction = await storage.getTransaction(txnId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user by ID - used for transaction details
  apiRouter.get("/users/:id([0-9]+)", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose the private key
      const { private_key, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user by phone number - used for direct transfers
  apiRouter.get("/users/phone/:phone", async (req, res) => {
    const phone = req.params.phone;
    
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }
    
    try {
      let user = await storage.getUserByPhone(phone);
      
      // Special case: If the requested phone is our test number and user doesn't exist, create it
      if (!user && phone === "7986797151") {
        // Generate key pair
        const publicKey = crypto.randomBytes(32).toString('hex');
        const privateKey = crypto.randomBytes(64).toString('hex');
        
        // Create a test user
        user = await storage.createUser({
          name: "Sandeep Singh",
          phone: "7986797151",
          public_key: publicKey,
          private_key: privateKey,
          balance: "5000",
          emergency_balance: "1000"
        });
        
        console.log('Created test user with phone:', phone);
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found with this phone number" });
      }
      
      // Don't expose the private key
      const { private_key, ...safeUser } = user;
      
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user by phone:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user transactions
  apiRouter.get("/transactions/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const transactions = await storage.getTransactionsByUser(userId);
    res.json(transactions);
  });

  // Get all merchants
  apiRouter.get("/merchants", async (_req, res) => {
    const merchants = await storage.getMerchants();
    res.json(merchants);
  });

  // Get essential service merchants
  apiRouter.get("/merchants/essential", async (_req, res) => {
    const merchants = await storage.getEssentialMerchants();
    res.json(merchants);
  });
  
  // API to toggle UPI network status for testing
  apiRouter.post("/system/toggle-network", async (req, res) => {
    const { status } = req.body;
    
    if (!status || !['online', 'offline', 'emergency'].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: online, offline, emergency" 
      });
    }
    
    const previousStatus = (global as any).connectionStatus;
    const newStatus = status as ConnectionStatus;
    
    // Set global status
    (global as any).connectionStatus = newStatus;
    
    // Save status to file for persistence across server restarts
    saveConnectionStatus(newStatus);
    
    console.log(`Network status changed: ${previousStatus} → ${newStatus}`);
    
    // Log more details to help debug
    console.log(`Network status request received: ${status}`);
    console.log(`Previous status: ${previousStatus}, New status: ${newStatus}`);
    
    // Emit event to all clients
    emitToAll('network-status-changed', { status: newStatus });
    
    res.json({ 
      success: true, 
      previous: previousStatus, 
      current: newStatus 
    });
  });
  
  // Get current network status
  apiRouter.get("/system/network-status", async (_req, res) => {
    const currentStatus = (global as any).connectionStatus;
    console.log(`Current network status from server: ${currentStatus}`);
    res.json({ 
      status: currentStatus
    });
  });

  // Get a specific merchant
  apiRouter.get("/merchants/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid merchant ID" });
    }
    
    const merchant = await storage.getMerchant(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }
    
    res.json(merchant);
  });

  // Create an offline transaction
  apiRouter.post("/transactions/offline", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // Ensure the transaction is marked as offline
      const offlineTransaction = {
        ...transactionData,
        is_offline: true,
        status: "pending",
        transaction_code: `EMG${Math.floor(1000000 + Math.random() * 9000000)}`
      };
      
      // Create the transaction
      const transaction = await storage.createTransaction(offlineTransaction);
      
      // Add to pending sync
      await storage.createPendingSync({
        transaction_id: transaction.id,
        retry_count: 0
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Simulate reconciliation of pending transactions
  apiRouter.post("/reconcile", async (_req, res) => {
    try {
      const pendingSyncs = await storage.getPendingSyncs();
      const results = [];
      
      for (const pendingSync of pendingSyncs) {
        const transaction = await storage.getTransaction(pendingSync.transaction_id);
        if (!transaction) continue;
        
        // Simulate 80% success rate for reconciliation
        const isSuccess = Math.random() < 0.8;
        
        if (isSuccess) {
          // Update transaction status to completed
          await storage.updateTransactionStatus(transaction.id, "completed");
          
          // Remove from pending sync
          await storage.deletePendingSync(pendingSync.id);
          
          results.push({
            transaction_id: transaction.id,
            status: "completed",
            message: "Transaction successfully reconciled"
          });
        } else {
          // Increment retry count
          await storage.updatePendingSync(pendingSync.id, pendingSync.retry_count + 1);
          
          results.push({
            transaction_id: transaction.id,
            status: "pending",
            message: "Reconciliation failed, will retry"
          });
        }
      }
      
      res.json({
        message: "Reconciliation process completed",
        results
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reconcile transactions" });
    }
  });

  // Create a new merchant
  apiRouter.post("/merchants", async (req, res) => {
    try {
      const merchantData = insertMerchantSchema.parse(req.body);
      const merchant = await storage.createMerchant(merchantData);
      res.status(201).json(merchant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid merchant data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create merchant" });
    }
  });

  // Register a new user
  apiRouter.post("/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with phone already exists
      const existingUser = await storage.getUserByPhone(userData.phone);
      if (existingUser) {
        return res.status(409).json({ message: "User with this phone number already exists" });
      }
      
      // Generate key pair (this would be done properly in production)
      const publicKey = crypto.randomBytes(32).toString('hex');
      const privateKey = crypto.randomBytes(64).toString('hex');
      
      const user = await storage.createUser({
        ...userData,
        public_key: publicKey,
        private_key: privateKey
      });
      
      // Don't return the private key
      const { private_key, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Update user profile
  apiRouter.patch("/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Validate input
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        phone: z.string().min(10).max(15).optional(),
        balance: z.string().optional(),
        emergency_balance: z.string().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // If updating phone, check if it's already taken
      if (updateData.phone) {
        const existingUser = await storage.getUserByPhone(updateData.phone);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: "Phone number is already in use" });
        }
      }
      
      // Update user
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the private key
      const { private_key, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  return httpServer;
}
