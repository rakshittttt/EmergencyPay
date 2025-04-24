import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import crypto from 'crypto';
import { insertUserSchema, insertTransactionSchema, insertMerchantSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Create an HTTP server
  const httpServer = createServer(app);

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
