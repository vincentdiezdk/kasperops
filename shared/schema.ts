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

// Job photos
export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  type: text("type").notNull(), // "before" | "during" | "after"
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  customerId: integer("customer_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").notNull().default("draft"),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  paidAt: timestamp("paid_at"),
  paidAmount: doublePrecision("paid_amount"),
  dineroGuid: text("dinero_guid"),
  reminderCount: integer("reminder_count").notNull().default(0),
  lastReminderAt: timestamp("last_reminder_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice lines
export const invoiceLines = pgTable("invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull().default(1),
  unitLabel: text("unit_label").notNull().default("stk"),
  unitPrice: doublePrecision("unit_price").notNull(),
  lineTotal: doublePrecision("line_total").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Payment reminders log
export const paymentReminders = pgTable("payment_reminders", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  reminderNumber: integer("reminder_number").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  type: text("type").notNull().default("email"),
  status: text("status").notNull().default("sent"),
});

// Service agreements
export const serviceAgreements = pgTable("service_agreements", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(),
  pricePerVisit: doublePrecision("price_per_visit").notNull(),
  nextServiceDate: timestamp("next_service_date"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
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
export const insertJobPhotoSchema = createInsertSchema(jobPhotos).omit({ id: true, uploadedAt: true });
export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({ id: true });
export const insertPaymentReminderSchema = createInsertSchema(paymentReminders).omit({ id: true });
export const insertServiceAgreementSchema = createInsertSchema(serviceAgreements).omit({ id: true, createdAt: true });

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
export type JobPhoto = typeof jobPhotos.$inferSelect;
export type InsertJobPhoto = z.infer<typeof insertJobPhotoSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type InsertPaymentReminder = z.infer<typeof insertPaymentReminderSchema>;
export type ServiceAgreement = typeof serviceAgreements.$inferSelect;
export type InsertServiceAgreement = z.infer<typeof insertServiceAgreementSchema>;
