import { pgTable, serial, text, integer, boolean, timestamp, decimal } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').unique().notNull(),
  pin: text('pin').notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).default('1000.00'),
  emergencyBalance: decimal('emergency_balance', { precision: 10, scale: 2 }).default('500.00'),
  publicKey: text('public_key'),
  privateKey: text('private_key'),
  isOnline: boolean('is_online').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Merchants table
export const merchants = pgTable('merchants', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  name: text('name').notNull(),
  category: text('category').notNull(),
  isEssential: boolean('is_essential').default(false),
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id),
  receiverId: integer('receiver_id').references(() => users.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  type: text('type').notNull(), // 'UPI', 'BLUETOOTH', 'BANK_TRANSFER'
  status: text('status').notNull(), // 'completed', 'pending', 'failed'
  description: text('description'),
  isOffline: boolean('is_offline').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Pending sync table for offline transactions
export const pendingSync = pgTable('pending_sync', {
  id: serial('id').primaryKey(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  userId: integer('user_id').references(() => users.id),
  data: text('data').notNull(), // JSON stringified transaction data
  syncAttempts: integer('sync_attempts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sentTransactions: many(transactions, { relationName: 'sender' }),
  receivedTransactions: many(transactions, { relationName: 'receiver' }),
  merchants: many(merchants),
  pendingSync: many(pendingSync),
}));

export const merchantsRelations = relations(merchants, ({ one }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  sender: one(users, {
    fields: [transactions.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [transactions.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const pendingSyncRelations = relations(pendingSync, ({ one }) => ({
  transaction: one(transactions, {
    fields: [pendingSync.transactionId],
    references: [transactions.id],
  }),
  user: one(users, {
    fields: [pendingSync.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const selectUserSchema = createSelectSchema(users);
export const insertMerchantSchema = createInsertSchema(merchants).omit({ id: true, createdAt: true });
export const selectMerchantSchema = createSelectSchema(merchants);
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const selectTransactionSchema = createSelectSchema(transactions);

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type PendingSync = typeof pendingSync.$inferSelect;