import {
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type PriceItem, type InsertPriceItem,
  type Quote, type InsertQuote,
  type QuoteLine, type InsertQuoteLine,
  type Job, type InsertJob,
  type JobPhoto, type InsertJobPhoto,
  type Communication, type InsertCommunication,
  type Invoice, type InsertInvoice,
  type InvoiceLine, type InsertInvoiceLine,
  type PaymentReminder, type InsertPaymentReminder,
  type ServiceAgreement, type InsertServiceAgreement,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Price Items
  getPriceItems(): Promise<PriceItem[]>;
  getPriceItem(id: number): Promise<PriceItem | undefined>;
  createPriceItem(item: InsertPriceItem): Promise<PriceItem>;
  updatePriceItem(id: number, item: Partial<InsertPriceItem>): Promise<PriceItem | undefined>;
  deletePriceItem(id: number): Promise<boolean>;

  // Quotes
  getQuotes(): Promise<Quote[]>;
  getQuote(id: number): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;

  // Quote Lines
  getQuoteLines(quoteId: number): Promise<QuoteLine[]>;
  createQuoteLine(line: InsertQuoteLine): Promise<QuoteLine>;
  updateQuoteLine(id: number, line: Partial<InsertQuoteLine>): Promise<QuoteLine | undefined>;
  deleteQuoteLine(id: number): Promise<boolean>;
  deleteQuoteLinesByQuoteId(quoteId: number): Promise<void>;

  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;

  // Job Photos
  getJobPhotos(jobId: number): Promise<JobPhoto[]>;
  createJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto>;
  deleteJobPhoto(id: number): Promise<boolean>;

  // Communications
  getCommunications(customerId?: number): Promise<Communication[]>;
  createCommunication(comm: InsertCommunication): Promise<Communication>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;

  // Invoice Lines
  getInvoiceLines(invoiceId: number): Promise<InvoiceLine[]>;
  createInvoiceLine(line: InsertInvoiceLine): Promise<InvoiceLine>;

  // Payment Reminders
  getPaymentReminders(invoiceId: number): Promise<PaymentReminder[]>;
  createPaymentReminder(reminder: InsertPaymentReminder): Promise<PaymentReminder>;

  // Service Agreements
  getServiceAgreements(): Promise<ServiceAgreement[]>;
  getServiceAgreement(id: number): Promise<ServiceAgreement | undefined>;
  createServiceAgreement(agreement: InsertServiceAgreement): Promise<ServiceAgreement>;
  updateServiceAgreement(id: number, agreement: Partial<InsertServiceAgreement>): Promise<ServiceAgreement | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private customers: Map<number, Customer> = new Map();
  private priceItems: Map<number, PriceItem> = new Map();
  private quotes: Map<number, Quote> = new Map();
  private quoteLines: Map<number, QuoteLine> = new Map();
  private jobs: Map<number, Job> = new Map();
  private jobPhotosMap: Map<number, JobPhoto> = new Map();
  private communications: Map<number, Communication> = new Map();
  private invoicesMap: Map<number, Invoice> = new Map();
  private invoiceLinesMap: Map<number, InvoiceLine> = new Map();
  private paymentRemindersMap: Map<number, PaymentReminder> = new Map();
  private serviceAgreementsMap: Map<number, ServiceAgreement> = new Map();

  private nextId = { users: 1, customers: 1, priceItems: 1, quotes: 1, quoteLines: 1, jobs: 1, jobPhotos: 1, communications: 1, invoices: 1, invoiceLines: 1, paymentReminders: 1, serviceAgreements: 1 };
  private invoiceCounter = 0;

  constructor() {
    this.seed();
  }

  private seed() {
    // Seed admin user
    this.createUser({ email: "kasper@kaspermh.dk", name: "Kasper MH", role: "admin", phone: "+45 12345678", avatarUrl: null, isActive: true });

    // Seed some customers
    this.createCustomer({ name: "Anders Jensen", email: "anders@example.dk", phone: "+45 22334455", addressLine1: "Nørregade 12", postalCode: "2100", city: "København Ø", cvr: null, notes: "Fast kunde", tags: ["privat"], gdprConsentAt: null });
    this.createCustomer({ name: "Birthe Sørensen", email: "birthe@firma.dk", phone: "+45 33445566", addressLine1: "Vestergade 8", postalCode: "5000", city: "Odense C", cvr: "12345678", notes: null, tags: ["erhverv"], gdprConsentAt: null });
    this.createCustomer({ name: "Carl Petersen", email: "carl@bolig.dk", phone: "+45 44556677", addressLine1: "Søndergade 22", postalCode: "8000", city: "Aarhus C", cvr: null, notes: "Stor have", tags: ["privat"], gdprConsentAt: null });

    // Seed price items
    this.createPriceItem({ category: "Algebehandling", name: "Algebehandling af tag", description: "Professionel algebehandling af hele taget", unitLabel: "m²", unitPrice: 45, isActive: true });
    this.createPriceItem({ category: "Algebehandling", name: "Algebehandling af facade", description: "Behandling af facadevæg", unitLabel: "m²", unitPrice: 40, isActive: true });
    this.createPriceItem({ category: "Rens af fliser", name: "Højtryksvask af fliser", description: "Grundig rensning med højtryksrenser", unitLabel: "m²", unitPrice: 55, isActive: true });
    this.createPriceItem({ category: "Rens af fliser", name: "Rens af indkørsel", description: "Komplet rensning af indkørsel", unitLabel: "m²", unitPrice: 50, isActive: true });
    this.createPriceItem({ category: "Vinduespudsning", name: "Vinduespudsning ude/inde", description: "Pudsning af vinduer ind- og udvendig", unitLabel: "stk", unitPrice: 75, isActive: true });
    this.createPriceItem({ category: "Haveservice", name: "Hækklipning", description: "Klipning af hæk op til 2m", unitLabel: "meter", unitPrice: 35, isActive: true });
    this.createPriceItem({ category: "Haveservice", name: "Græsslåning", description: "Slåning af græsplæne", unitLabel: "m²", unitPrice: 8, isActive: true });

    // Seed some quotes
    this.createQuote({ customerId: 1, title: "Algebehandling af tag — Nørregade 12", status: "sent", validUntil: new Date("2026-04-15"), notes: "Tilbud sendt per email", totalAmount: 4500, acceptToken: null, acceptedAt: null, sentAt: new Date("2026-03-10") });
    this.createQuote({ customerId: 2, title: "Rens af fliser — Vestergade 8", status: "draft", validUntil: new Date("2026-04-20"), notes: null, totalAmount: 2750, acceptToken: null, acceptedAt: null, sentAt: null });
    this.createQuote({ customerId: 3, title: "Komplet haveservice — Søndergade 22", status: "accepted", validUntil: new Date("2026-05-01"), notes: "Accepteret per telefon", totalAmount: 6200, acceptToken: null, acceptedAt: new Date("2026-03-15"), sentAt: new Date("2026-03-12") });

    // Seed quote lines
    this.createQuoteLine({ quoteId: 1, priceItemId: 1, description: "Algebehandling af tag", quantity: 100, unitLabel: "m²", unitPrice: 45, lineTotal: 4500, sortOrder: 0 });
    this.createQuoteLine({ quoteId: 2, priceItemId: 3, description: "Højtryksvask af fliser", quantity: 50, unitLabel: "m²", unitPrice: 55, lineTotal: 2750, sortOrder: 0 });
    this.createQuoteLine({ quoteId: 3, priceItemId: 6, description: "Hækklipning", quantity: 40, unitLabel: "meter", unitPrice: 35, lineTotal: 1400, sortOrder: 0 });
    this.createQuoteLine({ quoteId: 3, priceItemId: 7, description: "Græsslåning", quantity: 600, unitLabel: "m²", unitPrice: 8, lineTotal: 4800, sortOrder: 1 });

    // Seed some jobs
    this.createJob({ quoteId: 3, customerId: 3, assignedUserId: 1, title: "Haveservice — Søndergade 22", description: "Komplet haveservice inkl. hæk og græs", status: "planned", scheduledDate: new Date("2026-03-20"), startedAt: null, completedAt: null, addressLine1: "Søndergade 22", postalCode: "8000", city: "Aarhus C", completionNotes: null });
    this.createJob({ quoteId: 1, customerId: 1, assignedUserId: 1, title: "Algebehandling — Nørregade 12", description: "Algebehandling af tag", status: "in_progress", scheduledDate: new Date("2026-03-18"), startedAt: new Date("2026-03-18T08:00:00"), completedAt: null, addressLine1: "Nørregade 12", postalCode: "2100", city: "København Ø", completionNotes: null });
    this.createJob({ quoteId: null, customerId: 2, assignedUserId: 1, title: "Vinduespudsning — Vestergade 8", description: "Pudsning af alle vinduer", status: "completed", scheduledDate: new Date("2026-03-15"), startedAt: new Date("2026-03-15T09:00:00"), completedAt: new Date("2026-03-15T13:00:00"), addressLine1: "Vestergade 8", postalCode: "5000", city: "Odense C", completionNotes: "Alle vinduer pudset, kunden tilfreds" });

    // Seed job photos for job 2 (in_progress) and job 3 (completed)
    this.createJobPhoto({ jobId: 2, type: "before", fileName: "foer1.jpg", url: "https://placehold.co/400x300/2d6a2d/white?text=F%C3%B8r+1" });
    this.createJobPhoto({ jobId: 2, type: "before", fileName: "foer2.jpg", url: "https://placehold.co/400x300/2d6a2d/white?text=F%C3%B8r+2" });
    this.createJobPhoto({ jobId: 2, type: "during", fileName: "under1.jpg", url: "https://placehold.co/400x300/1a5c1a/white?text=Under+1" });
    this.createJobPhoto({ jobId: 3, type: "before", fileName: "foer1.jpg", url: "https://placehold.co/400x300/2d6a2d/white?text=F%C3%B8r+1" });
    this.createJobPhoto({ jobId: 3, type: "before", fileName: "foer2.jpg", url: "https://placehold.co/400x300/2d6a2d/white?text=F%C3%B8r+2" });
    this.createJobPhoto({ jobId: 3, type: "after", fileName: "efter1.jpg", url: "https://placehold.co/400x300/4a9e4a/white?text=Efter+1" });
    this.createJobPhoto({ jobId: 3, type: "after", fileName: "efter2.jpg", url: "https://placehold.co/400x300/4a9e4a/white?text=Efter+2" });

    // Seed communications
    this.createCommunication({ customerId: 1, jobId: null, quoteId: 1, type: "email", direction: "outbound", subject: "Tilbud: Algebehandling af tag", body: "Kære Anders, hermed fremsendes tilbud på algebehandling af taget." });
    this.createCommunication({ customerId: 1, jobId: null, quoteId: 1, type: "phone", direction: "inbound", subject: "Opfølgning på tilbud", body: "Anders ringede for at spørge om tidspunkt for opstart." });
    this.createCommunication({ customerId: 2, jobId: null, quoteId: null, type: "email", direction: "outbound", subject: "Bekræftelse af vinduespudsning", body: "Kære Birthe, hermed bekræftes vinduespudsning d. 15. marts." });
    this.createCommunication({ customerId: 3, jobId: null, quoteId: 3, type: "email", direction: "outbound", subject: "Tilbud: Komplet haveservice", body: "Kære Carl, hermed fremsendes tilbud på komplet haveservice." });
    this.createCommunication({ customerId: 3, jobId: null, quoteId: 3, type: "phone", direction: "inbound", subject: "Tilbud accepteret", body: "Carl accepterede tilbuddet per telefon." });

    // Seed invoices
    this.createInvoice({ jobId: 3, customerId: 2, invoiceNumber: "KMH-2026-0001", status: "paid", issueDate: new Date("2026-01-15"), dueDate: new Date("2026-01-29"), totalAmount: 3750, paidAt: new Date("2026-01-25"), paidAmount: 3750, dineroGuid: null, reminderCount: 0, lastReminderAt: null, notes: "Vinduespudsning — betalt til tiden" });
    this.createInvoice({ jobId: null, customerId: 1, invoiceNumber: "KMH-2026-0002", status: "paid", issueDate: new Date("2026-02-01"), dueDate: new Date("2026-02-15"), totalAmount: 8500, paidAt: new Date("2026-02-14"), paidAmount: 8500, dineroGuid: null, reminderCount: 0, lastReminderAt: null, notes: null });
    this.createInvoice({ jobId: null, customerId: 3, invoiceNumber: "KMH-2026-0003", status: "sent", issueDate: new Date("2026-03-01"), dueDate: new Date("2026-03-15"), totalAmount: 6200, paidAt: null, paidAmount: null, dineroGuid: null, reminderCount: 0, lastReminderAt: null, notes: null });
    this.createInvoice({ jobId: null, customerId: 1, invoiceNumber: "KMH-2026-0004", status: "overdue", issueDate: new Date("2026-02-15"), dueDate: new Date("2026-03-01"), totalAmount: 4500, paidAt: null, paidAmount: null, dineroGuid: null, reminderCount: 2, lastReminderAt: new Date("2026-03-12"), notes: "Algebehandling" });
    this.createInvoice({ jobId: null, customerId: 2, invoiceNumber: "KMH-2026-0005", status: "draft", issueDate: new Date("2026-03-18"), dueDate: new Date("2026-04-01"), totalAmount: 2750, paidAt: null, paidAmount: null, dineroGuid: null, reminderCount: 0, lastReminderAt: null, notes: "Kladde — venter på godkendelse" });

    // Seed invoice lines
    this.createInvoiceLine({ invoiceId: 1, description: "Vinduespudsning ude/inde", quantity: 50, unitLabel: "stk", unitPrice: 75, lineTotal: 3750, sortOrder: 0 });
    this.createInvoiceLine({ invoiceId: 2, description: "Algebehandling af tag", quantity: 100, unitLabel: "m²", unitPrice: 45, lineTotal: 4500, sortOrder: 0 });
    this.createInvoiceLine({ invoiceId: 2, description: "Algebehandling af facade", quantity: 100, unitLabel: "m²", unitPrice: 40, lineTotal: 4000, sortOrder: 1 });
    this.createInvoiceLine({ invoiceId: 3, description: "Hækklipning", quantity: 40, unitLabel: "meter", unitPrice: 35, lineTotal: 1400, sortOrder: 0 });
    this.createInvoiceLine({ invoiceId: 3, description: "Græsslåning", quantity: 600, unitLabel: "m²", unitPrice: 8, lineTotal: 4800, sortOrder: 1 });
    this.createInvoiceLine({ invoiceId: 4, description: "Algebehandling af tag", quantity: 100, unitLabel: "m²", unitPrice: 45, lineTotal: 4500, sortOrder: 0 });
    this.createInvoiceLine({ invoiceId: 5, description: "Højtryksvask af fliser", quantity: 50, unitLabel: "m²", unitPrice: 55, lineTotal: 2750, sortOrder: 0 });

    // Seed payment reminders
    this.createPaymentReminder({ invoiceId: 4, reminderNumber: 1, sentAt: new Date("2026-03-05"), type: "email", status: "sent" });
    this.createPaymentReminder({ invoiceId: 4, reminderNumber: 2, sentAt: new Date("2026-03-12"), type: "email", status: "sent" });

    // Seed service agreements
    this.createServiceAgreement({ customerId: 1, title: "Månedlig vinduespudsning — Nørregade 12", description: "Pudsning af alle vinduer ind- og udvendig, 1 gang per måned", frequency: "monthly", pricePerVisit: 1500, nextServiceDate: new Date("2026-04-01"), status: "active", startDate: new Date("2026-01-01"), endDate: null, notes: null });
    this.createServiceAgreement({ customerId: 3, title: "Kvartalsvis haveservice — Søndergade 22", description: "Hækklipning og græsslåning hver kvartal", frequency: "quarterly", pricePerVisit: 3200, nextServiceDate: new Date("2026-04-15"), status: "active", startDate: new Date("2025-10-01"), endDate: null, notes: "Inkluderer ukrudtsbehandling" });
    this.createServiceAgreement({ customerId: 2, title: "Årlig algebehandling — Vestergade 8", description: "Komplet algebehandling af tag og facade", frequency: "annual", pricePerVisit: 8500, nextServiceDate: new Date("2026-09-01"), status: "paused", startDate: new Date("2025-09-01"), endDate: null, notes: "Pauseret indtil videre pga. tagudskiftning" });

    // Additional communications for invoice events
    this.createCommunication({ customerId: 2, jobId: 3, quoteId: null, type: "email", direction: "outbound", subject: "Faktura KMH-2026-0001 — 3.750,00 kr.", body: "Faktura sendt for vinduespudsning." });
    this.createCommunication({ customerId: 1, jobId: null, quoteId: null, type: "email", direction: "outbound", subject: "Rykker 1 — Faktura KMH-2026-0004", body: "Første rykker sendt for forfalden faktura." });
    this.createCommunication({ customerId: 1, jobId: null, quoteId: null, type: "email", direction: "outbound", subject: "Rykker 2 — Faktura KMH-2026-0004", body: "Anden rykker sendt for forfalden faktura." });
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  async createUser(data: InsertUser): Promise<User> {
    const id = this.nextId.users++;
    const user: User = { id, email: data.email, name: data.name, role: data.role ?? "employee", phone: data.phone ?? null, avatarUrl: data.avatarUrl ?? null, isActive: data.isActive ?? true };
    this.users.set(id, user);
    return user;
  }
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.users.set(id, updated);
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const id = this.nextId.customers++;
    const customer: Customer = { id, name: data.name, email: data.email ?? null, phone: data.phone ?? null, addressLine1: data.addressLine1 ?? null, postalCode: data.postalCode ?? null, city: data.city ?? null, cvr: data.cvr ?? null, notes: data.notes ?? null, tags: data.tags ?? null, gdprConsentAt: data.gdprConsentAt ?? null, createdAt: new Date() };
    this.customers.set(id, customer);
    return customer;
  }
  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.customers.set(id, updated);
    return updated;
  }
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Price Items
  async getPriceItems(): Promise<PriceItem[]> {
    return Array.from(this.priceItems.values());
  }
  async getPriceItem(id: number): Promise<PriceItem | undefined> {
    return this.priceItems.get(id);
  }
  async createPriceItem(data: InsertPriceItem): Promise<PriceItem> {
    const id = this.nextId.priceItems++;
    const item: PriceItem = { id, category: data.category, name: data.name, description: data.description ?? null, unitLabel: data.unitLabel ?? "stk", unitPrice: data.unitPrice, isActive: data.isActive ?? true };
    this.priceItems.set(id, item);
    return item;
  }
  async updatePriceItem(id: number, data: Partial<InsertPriceItem>): Promise<PriceItem | undefined> {
    const existing = this.priceItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.priceItems.set(id, updated);
    return updated;
  }
  async deletePriceItem(id: number): Promise<boolean> {
    return this.priceItems.delete(id);
  }

  // Quotes
  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values());
  }
  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }
  async createQuote(data: InsertQuote): Promise<Quote> {
    const id = this.nextId.quotes++;
    const quote: Quote = { id, customerId: data.customerId, title: data.title, status: data.status ?? "draft", validUntil: data.validUntil ?? null, notes: data.notes ?? null, totalAmount: data.totalAmount ?? 0, acceptToken: data.acceptToken ?? null, acceptedAt: data.acceptedAt ?? null, sentAt: data.sentAt ?? null, createdAt: new Date() };
    this.quotes.set(id, quote);
    return quote;
  }
  async updateQuote(id: number, data: Partial<InsertQuote>): Promise<Quote | undefined> {
    const existing = this.quotes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.quotes.set(id, updated);
    return updated;
  }
  async deleteQuote(id: number): Promise<boolean> {
    return this.quotes.delete(id);
  }

  // Quote Lines
  async getQuoteLines(quoteId: number): Promise<QuoteLine[]> {
    return Array.from(this.quoteLines.values()).filter(l => l.quoteId === quoteId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async createQuoteLine(data: InsertQuoteLine): Promise<QuoteLine> {
    const id = this.nextId.quoteLines++;
    const line: QuoteLine = { id, quoteId: data.quoteId, priceItemId: data.priceItemId ?? null, description: data.description, quantity: data.quantity ?? 1, unitLabel: data.unitLabel ?? "stk", unitPrice: data.unitPrice, lineTotal: data.lineTotal, sortOrder: data.sortOrder ?? 0 };
    this.quoteLines.set(id, line);
    return line;
  }
  async updateQuoteLine(id: number, data: Partial<InsertQuoteLine>): Promise<QuoteLine | undefined> {
    const existing = this.quoteLines.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.quoteLines.set(id, updated);
    return updated;
  }
  async deleteQuoteLine(id: number): Promise<boolean> {
    return this.quoteLines.delete(id);
  }
  async deleteQuoteLinesByQuoteId(quoteId: number): Promise<void> {
    const entries = Array.from(this.quoteLines.entries());
    for (const [id, line] of entries) {
      if (line.quoteId === quoteId) this.quoteLines.delete(id);
    }
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  async createJob(data: InsertJob): Promise<Job> {
    const id = this.nextId.jobs++;
    const job: Job = { id, quoteId: data.quoteId ?? null, customerId: data.customerId, assignedUserId: data.assignedUserId ?? null, title: data.title, description: data.description ?? null, status: data.status ?? "planned", scheduledDate: data.scheduledDate ?? null, startedAt: data.startedAt ?? null, completedAt: data.completedAt ?? null, addressLine1: data.addressLine1 ?? null, postalCode: data.postalCode ?? null, city: data.city ?? null, completionNotes: data.completionNotes ?? null, createdAt: new Date() };
    this.jobs.set(id, job);
    return job;
  }
  async updateJob(id: number, data: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.jobs.set(id, updated);
    return updated;
  }
  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  // Job Photos
  async getJobPhotos(jobId: number): Promise<JobPhoto[]> {
    return Array.from(this.jobPhotosMap.values()).filter(p => p.jobId === jobId);
  }
  async createJobPhoto(data: InsertJobPhoto): Promise<JobPhoto> {
    const id = this.nextId.jobPhotos++;
    const photo: JobPhoto = { id, jobId: data.jobId, type: data.type, fileName: data.fileName, url: data.url, uploadedAt: new Date() };
    this.jobPhotosMap.set(id, photo);
    return photo;
  }
  async deleteJobPhoto(id: number): Promise<boolean> {
    return this.jobPhotosMap.delete(id);
  }

  // Communications
  async getCommunications(customerId?: number): Promise<Communication[]> {
    const all = Array.from(this.communications.values());
    if (customerId !== undefined) return all.filter(c => c.customerId === customerId);
    return all;
  }
  async createCommunication(data: InsertCommunication): Promise<Communication> {
    const id = this.nextId.communications++;
    const comm: Communication = { id, customerId: data.customerId, jobId: data.jobId ?? null, quoteId: data.quoteId ?? null, type: data.type, direction: data.direction, subject: data.subject ?? null, body: data.body ?? null, sentAt: new Date() };
    this.communications.set(id, comm);
    return comm;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoicesMap.values());
  }
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoicesMap.get(id);
  }
  async createInvoice(data: InsertInvoice): Promise<Invoice> {
    const id = this.nextId.invoices++;
    this.invoiceCounter++;
    const invoice: Invoice = {
      id,
      jobId: data.jobId ?? null,
      customerId: data.customerId,
      invoiceNumber: data.invoiceNumber,
      status: data.status ?? "draft",
      issueDate: data.issueDate ?? new Date(),
      dueDate: data.dueDate,
      totalAmount: data.totalAmount,
      paidAt: data.paidAt ?? null,
      paidAmount: data.paidAmount ?? null,
      dineroGuid: data.dineroGuid ?? null,
      reminderCount: data.reminderCount ?? 0,
      lastReminderAt: data.lastReminderAt ?? null,
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    this.invoicesMap.set(id, invoice);
    return invoice;
  }
  async updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existing = this.invoicesMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.invoicesMap.set(id, updated);
    return updated;
  }

  // Invoice Lines
  async getInvoiceLines(invoiceId: number): Promise<InvoiceLine[]> {
    return Array.from(this.invoiceLinesMap.values()).filter(l => l.invoiceId === invoiceId).sort((a, b) => a.sortOrder - b.sortOrder);
  }
  async createInvoiceLine(data: InsertInvoiceLine): Promise<InvoiceLine> {
    const id = this.nextId.invoiceLines++;
    const line: InvoiceLine = {
      id,
      invoiceId: data.invoiceId,
      description: data.description,
      quantity: data.quantity ?? 1,
      unitLabel: data.unitLabel ?? "stk",
      unitPrice: data.unitPrice,
      lineTotal: data.lineTotal,
      sortOrder: data.sortOrder ?? 0,
    };
    this.invoiceLinesMap.set(id, line);
    return line;
  }

  // Payment Reminders
  async getPaymentReminders(invoiceId: number): Promise<PaymentReminder[]> {
    return Array.from(this.paymentRemindersMap.values()).filter(r => r.invoiceId === invoiceId).sort((a, b) => a.reminderNumber - b.reminderNumber);
  }
  async createPaymentReminder(data: InsertPaymentReminder): Promise<PaymentReminder> {
    const id = this.nextId.paymentReminders++;
    const reminder: PaymentReminder = {
      id,
      invoiceId: data.invoiceId,
      reminderNumber: data.reminderNumber,
      sentAt: data.sentAt ?? new Date(),
      type: data.type ?? "email",
      status: data.status ?? "sent",
    };
    this.paymentRemindersMap.set(id, reminder);
    return reminder;
  }

  // Service Agreements
  async getServiceAgreements(): Promise<ServiceAgreement[]> {
    return Array.from(this.serviceAgreementsMap.values());
  }
  async getServiceAgreement(id: number): Promise<ServiceAgreement | undefined> {
    return this.serviceAgreementsMap.get(id);
  }
  async createServiceAgreement(data: InsertServiceAgreement): Promise<ServiceAgreement> {
    const id = this.nextId.serviceAgreements++;
    const agreement: ServiceAgreement = {
      id,
      customerId: data.customerId,
      title: data.title,
      description: data.description ?? null,
      frequency: data.frequency,
      pricePerVisit: data.pricePerVisit,
      nextServiceDate: data.nextServiceDate ?? null,
      status: data.status ?? "active",
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    this.serviceAgreementsMap.set(id, agreement);
    return agreement;
  }
  async updateServiceAgreement(id: number, data: Partial<InsertServiceAgreement>): Promise<ServiceAgreement | undefined> {
    const existing = this.serviceAgreementsMap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.serviceAgreementsMap.set(id, updated);
    return updated;
  }

  getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const num = this.invoiceCounter + 1;
    return `KMH-${year}-${String(num).padStart(4, "0")}`;
  }
}

export const storage = new MemStorage();
