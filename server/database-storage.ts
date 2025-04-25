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
import { eq, or, desc } from 'drizzle-orm';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import crypto from 'crypto';
import { supabase } from './supabase';
import { IStorage } from './storage';

// Create a PostgreSQL pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Initialize Drizzle ORM
const db = drizzle(pool, { schema: { users, transactions, merchants, pendingSync } });

// Create session store
const PgSessionStore = connectPgSimple(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    // Initialize the session store
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize the database tables
    this.initDatabase().catch(console.error);
  }

  // Database initialization
  private async initDatabase() {
    try {
      // Check if we already have users
      const existingUsers = await db.select({ count: db.fn.count() }).from(users);
      
      // If no users exist, create sample data
      if (existingUsers[0].count === '0') {
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