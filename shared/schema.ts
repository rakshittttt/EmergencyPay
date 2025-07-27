import { pgTable, text, serial, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  public_key: text("public_key").notNull(),
  private_key: text("private_key").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  balance: numeric("balance").notNull().default("10000"),
  emergency_balance: numeric("emergency_balance").notNull().default("2000"),
  firebase_uid: text("firebase_uid"),
  email: text("email")
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  sender_id: serial("sender_id").references(() => users.id),
  receiver_id: serial("receiver_id").references(() => users.id),
  amount: numeric("amount").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  signature: text("signature"),
  status: text("status").notNull().default("pending"),
  is_offline: boolean("is_offline").notNull().default(false),
  transaction_code: text("transaction_code").notNull(),
  method: text("method").default("UPI")
});

// Merchants table
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  user_id: serial("user_id").references(() => users.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  is_essential_service: boolean("is_essential_service").notNull().default(false),
  location: text("location")
});

// Pending sync table
export const pendingSync = pgTable("pending_sync", {
  id: serial("id").primaryKey(),
  transaction_id: serial("transaction_id").references(() => transactions.id),
  retry_count: serial("retry_count").notNull(),
  last_attempt: timestamp("last_attempt").defaultNow()
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true
});

// Schema for inserting transactions
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true
});

// Schema for inserting merchants
export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true
});

// Schema for inserting pending syncs
export const insertPendingSyncSchema = createInsertSchema(pendingSync).omit({
  id: true,
  last_attempt: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export type InsertPendingSync = z.infer<typeof insertPendingSyncSchema>;
export type PendingSync = typeof pendingSync.$inferSelect;
