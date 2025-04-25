import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import crypto from 'crypto';
import { insertUserSchema, insertTransactionSchema, insertMerchantSchema } from "@shared/schema";

import { processOnlineTransaction, processOfflineTransaction, verifyPendingTransaction, addFundsToAccount } from './banking-api';
import { setupSocketIO, emitToAll } from './socket';

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
      const { senderId, receiverId, amount } = req.body;
      
      if (!senderId || !receiverId || !amount) {
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
      
      // Check sufficient balance
      if (parseFloat(sender.balance) < parseFloat(amount)) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        sender_id: parseInt(senderId),
        receiver_id: parseInt(receiverId),
        amount: amount.toString(),
        status: 'pending',
        is_offline: false,
        transaction_code: `TXN${Math.floor(1000000 + Math.random() * 9000000)}`
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
        
        // Update balances
        const newSenderBalance = (parseFloat(sender.balance) - parseFloat(amount)).toString();
        const newReceiverBalance = (parseFloat(receiver.balance) + parseFloat(amount)).toString();
        
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
      
      // Check sufficient emergency balance
      if (parseFloat(sender.emergency_balance) < parseFloat(amount)) {
        return res.status(400).json({ message: 'Insufficient emergency balance' });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        sender_id: parseInt(senderId),
        receiver_id: parseInt(receiverId),
        amount: amount.toString(),
        status: 'pending',
        is_offline: true,
        transaction_code: `EMG${Math.floor(1000000 + Math.random() * 9000000)}`
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
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed');
        
        // Update emergency balance only (regular balance remains the same in offline mode)
        const newSenderEmergencyBalance = (
          parseFloat(sender.emergency_balance) - parseFloat(amount)
        ).toString();
        
        await storage.updateUser(parseInt(senderId), { 
          emergency_balance: newSenderEmergencyBalance 
        });
        
        // Emit real-time updates
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
          
          // Add transaction amount to receiver's regular balance
          const receiver = await storage.getUser(transaction.receiver_id);
          if (receiver) {
            const newReceiverBalance = (
              parseFloat(receiver.balance) + parseFloat(transaction.amount)
            ).toString();
            
            await storage.updateUser(receiver.id, { balance: newReceiverBalance });
          }
          
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

  // User login endpoint
  apiRouter.post("/login", async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ success: false, message: "Phone number is required" });
      }
      
      // For demo purposes, find user with this phone
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid phone number" });
      }
      
      // Set an auth cookie
      res.cookie('auth_state', 'logged_in', { 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours 
      });
      
      // Remove private key before sending to client
      const { private_key, ...safeUser } = user;
      
      // Send success response with user info
      res.status(200).json({ success: true, user: safeUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: "Failed to login" });
    }
  });

  // User logout endpoint
  apiRouter.post("/logout", async (req, res) => {
    try {
      // Set an auth cookie to handle log out state
      res.cookie('auth_state', 'logged_out', { 
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours 
      });
      
      // Send success response
      res.status(200).json({ success: true, message: "Successfully logged out" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ success: false, message: "Failed to logout" });
    }
  });

  // Create an HTTP server
  const httpServer = createServer(app);
  
  // Set up Socket.IO
  setupSocketIO(httpServer);

  // Get current user (for demo purposes, just return the first user)
  apiRouter.get("/user", async (req, res) => {
    // Check for logout state in cookies
    if (req.cookies && req.cookies.auth_state === 'logged_out') {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const user = await storage.getUser(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove private key before sending to client
    const { private_key, ...safeUser } = user;
    res.json(safeUser);
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
  
  // Get a specific transaction
  apiRouter.get("/transaction/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    
    const transaction = await storage.getTransaction(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    res.json(transaction);
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
  
  // Get merchant by user ID
  apiRouter.get("/merchant/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get all merchants
    const merchants = await storage.getMerchants();
    
    // Find merchant with user_id = userId
    const merchant = merchants.find(m => m.user_id === userId);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found for this user" });
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
