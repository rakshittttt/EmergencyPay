import { 
  User,
  InsertUser,
  Transaction,
  InsertTransaction,
  Merchant,
  InsertMerchant,
  PendingSync,
  InsertPendingSync,
  users,
  transactions,
  merchants,
  pendingSync
} from "@shared/schema";
import crypto from 'crypto';
import session from 'express-session';
import { Store } from 'express-session';
import { eq, or, desc } from 'drizzle-orm';
import { db, pool } from './db';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUser(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined>;
  
  // Merchant operations
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchants(): Promise<Merchant[]>;
  getEssentialMerchants(): Promise<Merchant[]>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  
  // Pending sync operations
  getPendingSyncs(): Promise<PendingSync[]>;
  createPendingSync(pendingSync: InsertPendingSync): Promise<PendingSync>;
  updatePendingSync(id: number, retryCount: number): Promise<PendingSync | undefined>;
  deletePendingSync(id: number): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    // Initialize an in-memory session store for now
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize the database tables
    this.initDatabase().catch(console.error);
  }

  // Database initialization
  private async initDatabase() {
    try {
      // Check if we already have users
      const existingUsers = await db.select().from(users);
      
      // If no users exist, create sample data
      if (existingUsers.length === 0) {
        await this.initializeSampleData();
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.phone, phone));
      return user;
    } catch (error) {
      console.error('Error getting user by phone:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const keys = this.generateKeyPair();
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          public_key: keys.publicKey,
          private_key: keys.privateKey,
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    try {
      const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
      return transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return undefined;
    }
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    try {
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(
          or(
            eq(transactions.sender_id, userId),
            eq(transactions.receiver_id, userId)
          )
        )
        .orderBy(desc(transactions.timestamp));
      return userTransactions;
    } catch (error) {
      console.error('Error getting transactions by user:', error);
      return [];
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    try {
      const [transaction] = await db
        .insert(transactions)
        .values(insertTransaction)
        .returning();
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    try {
      const [updatedTransaction] = await db
        .update(transactions)
        .set({ status })
        .where(eq(transactions.id, id))
        .returning();
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      return undefined;
    }
  }

  // Merchant operations
  async getMerchant(id: number): Promise<Merchant | undefined> {
    try {
      const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
      return merchant;
    } catch (error) {
      console.error('Error getting merchant:', error);
      return undefined;
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    try {
      const allMerchants = await db.select().from(merchants);
      return allMerchants;
    } catch (error) {
      console.error('Error getting merchants:', error);
      return [];
    }
  }

  async getEssentialMerchants(): Promise<Merchant[]> {
    try {
      const essentialMerchants = await db
        .select()
        .from(merchants)
        .where(eq(merchants.is_essential_service, true));
      return essentialMerchants;
    } catch (error) {
      console.error('Error getting essential merchants:', error);
      return [];
    }
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    try {
      const [merchant] = await db
        .insert(merchants)
        .values(insertMerchant)
        .returning();
      return merchant;
    } catch (error) {
      console.error('Error creating merchant:', error);
      throw error;
    }
  }

  // Pending sync operations
  async getPendingSyncs(): Promise<PendingSync[]> {
    try {
      const allPendingSyncs = await db.select().from(pendingSync);
      return allPendingSyncs;
    } catch (error) {
      console.error('Error getting pending syncs:', error);
      return [];
    }
  }

  async createPendingSync(insertPendingSync: InsertPendingSync): Promise<PendingSync> {
    try {
      const [pendingSyncEntity] = await db
        .insert(pendingSync)
        .values(insertPendingSync)
        .returning();
      return pendingSyncEntity;
    } catch (error) {
      console.error('Error creating pending sync:', error);
      throw error;
    }
  }

  async updatePendingSync(id: number, retryCount: number): Promise<PendingSync | undefined> {
    try {
      const [updatedPendingSync] = await db
        .update(pendingSync)
        .set({ 
          retry_count: retryCount,
          last_attempt: new Date()
        })
        .where(eq(pendingSync.id, id))
        .returning();
      return updatedPendingSync;
    } catch (error) {
      console.error('Error updating pending sync:', error);
      return undefined;
    }
  }

  async deletePendingSync(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(pendingSync)
        .where(eq(pendingSync.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting pending sync:', error);
      return false;
    }
  }

  // Helper method to generate key pair
  private generateKeyPair() {
    // For demo purposes, we're generating simple keys
    // In production, you'd use proper ED25519 keys
    return {
      publicKey: crypto.randomBytes(32).toString('hex'),
      privateKey: crypto.randomBytes(64).toString('hex')
    };
  }

  // Initialize sample data for demo
  private async initializeSampleData() {
    console.log('Initializing sample data...');
    try {
      // Create customer user
      const customerKeys = this.generateKeyPair();
      const [customerUser] = await db
        .insert(users)
        .values({
          name: "Rahul Kumar",
          phone: "9876543210",
          public_key: customerKeys.publicKey,
          private_key: customerKeys.privateKey,
          balance: "12500",
          emergency_balance: "2000"
        })
        .returning();
      
      // Create merchants
      const categories = ["medical", "food", "fuel", "transport", "groceries"];
      const merchantNames = [
        "MedPlus Pharmacy", 
        "Food Corner", 
        "HP Petrol Pump",
        "Metro Transport",
        "Fresh Groceries"
      ];
      
      for (let i = 0; i < 5; i++) {
        const merchantKeys = this.generateKeyPair();
        // Create merchant user
        const [merchantUser] = await db
          .insert(users)
          .values({
            name: merchantNames[i],
            phone: `98765${i}${i}${i}${i}${i}`,
            public_key: merchantKeys.publicKey,
            private_key: merchantKeys.privateKey,
            balance: "5000",
            emergency_balance: "1000"
          })
          .returning();
        
        // Create merchant profile
        const [merchant] = await db
          .insert(merchants)
          .values({
            user_id: merchantUser.id,
            name: merchantNames[i],
            category: categories[i],
            is_essential_service: true,
            location: "Nearby Area"
          })
          .returning();
        
        // Create sample transactions for the first merchant
        if (i === 0) {
          const now = new Date();
          const timestamp = new Date(now);
          timestamp.setDate(now.getDate() - 2);
          
          const [transaction] = await db
            .insert(transactions)
            .values({
              sender_id: customerUser.id,
              receiver_id: merchantUser.id,
              amount: "450",
              timestamp: timestamp,
              signature: crypto.randomBytes(64).toString('hex'),
              status: "completed",
              is_offline: false,
              transaction_code: `EMG${Math.floor(1000000 + Math.random() * 9000000)}`
            })
            .returning();
          
          // Create a pending sync record for demo
          await db
            .insert(pendingSync)
            .values({
              transaction_id: transaction.id,
              retry_count: 2,
              last_attempt: new Date(now.getTime() - 3600000) // 1 hour ago
            });
        }
      }
      
      console.log('Sample data initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return false;
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private merchants: Map<number, Merchant>;
  private pendingSyncs: Map<number, PendingSync>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentMerchantId: number;
  private currentPendingSyncId: number;
  sessionStore: Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.merchants = new Map();
    this.pendingSyncs = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentMerchantId = 1;
    this.currentPendingSyncId = 1;
    
    // Initialize an in-memory session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phone === phone,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      created_at: new Date(),
      balance: "10000",
      emergency_balance: "2000"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.sender_id === userId || transaction.receiver_id === userId
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      timestamp: new Date(),
      status: insertTransaction.status || "pending",
      sender_id: insertTransaction.sender_id || 0,
      receiver_id: insertTransaction.receiver_id || 0,
      signature: insertTransaction.signature || null,
      is_offline: insertTransaction.is_offline || false
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  // Merchant operations
  async getMerchant(id: number): Promise<Merchant | undefined> {
    return this.merchants.get(id);
  }

  async getMerchants(): Promise<Merchant[]> {
    return Array.from(this.merchants.values());
  }

  async getEssentialMerchants(): Promise<Merchant[]> {
    return Array.from(this.merchants.values()).filter(
      (merchant) => merchant.is_essential_service
    );
  }

  async createMerchant(insertMerchant: InsertMerchant): Promise<Merchant> {
    const id = this.currentMerchantId++;
    const merchant: Merchant = { 
      ...insertMerchant, 
      id,
      user_id: insertMerchant.user_id || 0,
      is_essential_service: insertMerchant.is_essential_service || false,
      location: insertMerchant.location || null
    };
    this.merchants.set(id, merchant);
    return merchant;
  }

  // Pending sync operations
  async getPendingSyncs(): Promise<PendingSync[]> {
    return Array.from(this.pendingSyncs.values());
  }

  async createPendingSync(insertPendingSync: InsertPendingSync): Promise<PendingSync> {
    const id = this.currentPendingSyncId++;
    const pendingSync: PendingSync = { 
      ...insertPendingSync, 
      id, 
      transaction_id: insertPendingSync.transaction_id || 0,
      retry_count: insertPendingSync.retry_count || 0,
      last_attempt: new Date() 
    };
    this.pendingSyncs.set(id, pendingSync);
    return pendingSync;
  }

  async updatePendingSync(id: number, retryCount: number): Promise<PendingSync | undefined> {
    const pendingSync = this.pendingSyncs.get(id);
    if (!pendingSync) return undefined;
    
    const updatedPendingSync = { 
      ...pendingSync, 
      retry_count: retryCount,
      last_attempt: new Date()
    };
    this.pendingSyncs.set(id, updatedPendingSync);
    return updatedPendingSync;
  }

  async deletePendingSync(id: number): Promise<boolean> {
    return this.pendingSyncs.delete(id);
  }

  // Helper method to generate key pair
  private generateKeyPair() {
    // For demo purposes, we're generating simple keys
    // In production, you'd use proper ED25519 keys
    return {
      publicKey: crypto.randomBytes(32).toString('hex'),
      privateKey: crypto.randomBytes(64).toString('hex')
    };
  }

  // Initialize sample data for demo
  private initializeSampleData() {
    // Create users
    const customerKeys = this.generateKeyPair();
    const customerUser: User = {
      id: this.currentUserId++,
      name: "Rahul Kumar",
      phone: "9876543210",
      public_key: customerKeys.publicKey,
      private_key: customerKeys.privateKey,
      created_at: new Date(),
      balance: "12500",
      emergency_balance: "2000"
    };
    this.users.set(customerUser.id, customerUser);

    // Create merchants
    const categories = ["medical", "food", "fuel", "transport", "groceries"];
    const merchantNames = [
      "MedPlus Pharmacy", 
      "Food Corner", 
      "HP Petrol Pump",
      "Metro Transport",
      "Fresh Groceries"
    ];
    
    for (let i = 0; i < 5; i++) {
      const merchantKeys = this.generateKeyPair();
      const merchantUser: User = {
        id: this.currentUserId++,
        name: merchantNames[i],
        phone: `98765${i}${i}${i}${i}${i}`,
        public_key: merchantKeys.publicKey,
        private_key: merchantKeys.privateKey,
        created_at: new Date(),
        balance: "5000",
        emergency_balance: "1000"
      };
      this.users.set(merchantUser.id, merchantUser);
      
      const merchant: Merchant = {
        id: this.currentMerchantId++,
        user_id: merchantUser.id,
        name: merchantNames[i],
        category: categories[i],
        is_essential_service: true,
        location: "Nearby Area"
      };
      this.merchants.set(merchant.id, merchant);
    }

    // Create some transactions for demo
    const transactionAmounts = ["450", "1200", "500", "750"];
    const merchants = Array.from(this.merchants.values());
    
    // Current timestamp
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const merchant = merchants[i % merchants.length];
      const timestamp = new Date(now);
      timestamp.setDate(now.getDate() - i * 2);
      
      const isReceiving = i === 1; // Make one transaction a receiving one
      
      const transaction: Transaction = {
        id: this.currentTransactionId++,
        sender_id: isReceiving ? merchant.user_id : customerUser.id,
        receiver_id: isReceiving ? customerUser.id : merchant.user_id,
        amount: transactionAmounts[i],
        timestamp: timestamp,
        signature: crypto.randomBytes(64).toString('hex'),
        status: i === 2 ? "pending" : "completed", // Make one transaction pending
        is_offline: i === 2, // Make one transaction offline
        transaction_code: `EMG${Math.floor(1000000 + Math.random() * 9000000)}`
      };
      this.transactions.set(transaction.id, transaction);
      
      // Create pending sync for the offline transaction
      if (transaction.is_offline) {
        const pendingSync: PendingSync = {
          id: this.currentPendingSyncId++,
          transaction_id: transaction.id,
          retry_count: 2,
          last_attempt: new Date(now.getTime() - 3600000) // 1 hour ago
        };
        this.pendingSyncs.set(pendingSync.id, pendingSync);
      }
    }
  }
}

// Choose which storage implementation to use
// For now, we'll use MemStorage until the database implementation is fully tested
export const storage = new MemStorage();
// export const storage = new DatabaseStorage();
