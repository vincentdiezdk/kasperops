import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (Kasper + future employees)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("employee"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  addressLine1: text("address_line1"),
  postalCode: text("postal_code"),
  city: text("city"),
  cvr: text("cvr"),
  notes: text("notes"),
  tags: text("tags").array(),
  gdprConsentAt: timestamp("gdpr_consent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Service catalog / price items
export const priceItems = pgTable("price_items", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unitLabel: text("unit_label").notNull().default("stk"),
  unitPrice: doublePrecision("unit_price").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  acceptToken: text("accept_token"),
  acceptedAt: timestamp("accepted_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quote line items
export const quoteLines = pgTable("quote_lines", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  priceItemId: integer("price_item_id"),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull().default(1),
  unitLabel: text("unit_label").notNull().default("stk"),
  unitPrice: doublePrecision("unit_price").notNull(),
  lineTotal: doublePrecision("line_total").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Jobs
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id"),
  customerId: integer("customer_id").notNull(),
  assignedUserId: integer("assigned_user_id"),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  addressLine1: text("address_line1"),
  postalCode: text("postal_code"),
  city: text("city"),
  completionNotes: text("completion_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Communication log
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  jobId: integer("job_id"),
  quoteId: integer("quote_id"),
  type: text("type").notNull(),
  direction: text("direction").notNull(),
  subject: text("subject"),
  body: text("body"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertPriceItemSchema = createInsertSchema(priceItems).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });
export const insertQuoteLineSchema = createInsertSchema(quoteLines).omit({ id: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type PriceItem = typeof priceItems.$inferSelect;
export type InsertPriceItem = z.infer<typeof insertPriceItemSchema>;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type InsertQuoteLine = z.infer<typeof insertQuoteLineSchema>;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
