import { 
  User,
  InsertUser,
  Transaction,
  InsertTransaction,
  Merchant,
  InsertMerchant,
  PendingSync,
  InsertPendingSync
} from "@shared/schema";
import crypto from 'crypto';

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

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.merchants = new Map();
    this.pendingSyncs = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentMerchantId = 1;
    this.currentPendingSyncId = 1;
    
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

export const storage = new MemStorage();
