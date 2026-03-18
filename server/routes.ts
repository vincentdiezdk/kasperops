import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === Users ===
  app.get("/api/users", async (_req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "Bruger ikke fundet" });
    res.json(user);
  });

  // === Customers ===
  app.get("/api/customers", async (_req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });
  app.get("/api/customers/:id", async (req, res) => {
    const customer = await storage.getCustomer(Number(req.params.id));
    if (!customer) return res.status(404).json({ message: "Kunde ikke fundet" });
    res.json(customer);
  });
  app.post("/api/customers", async (req, res) => {
    const customer = await storage.createCustomer(req.body);
    res.status(201).json(customer);
  });
  app.patch("/api/customers/:id", async (req, res) => {
    const customer = await storage.updateCustomer(Number(req.params.id), req.body);
    if (!customer) return res.status(404).json({ message: "Kunde ikke fundet" });
    res.json(customer);
  });
  app.delete("/api/customers/:id", async (req, res) => {
    const deleted = await storage.deleteCustomer(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Kunde ikke fundet" });
    res.json({ success: true });
  });

  // === Price Items ===
  app.get("/api/price-items", async (_req, res) => {
    const items = await storage.getPriceItems();
    res.json(items);
  });
  app.get("/api/price-items/:id", async (req, res) => {
    const item = await storage.getPriceItem(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Prispost ikke fundet" });
    res.json(item);
  });
  app.post("/api/price-items", async (req, res) => {
    const item = await storage.createPriceItem(req.body);
    res.status(201).json(item);
  });
  app.patch("/api/price-items/:id", async (req, res) => {
    const item = await storage.updatePriceItem(Number(req.params.id), req.body);
    if (!item) return res.status(404).json({ message: "Prispost ikke fundet" });
    res.json(item);
  });
  app.delete("/api/price-items/:id", async (req, res) => {
    const deleted = await storage.deletePriceItem(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Prispost ikke fundet" });
    res.json({ success: true });
  });

  // === Quotes ===
  app.get("/api/quotes", async (_req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });
  app.get("/api/quotes/:id", async (req, res) => {
    const quote = await storage.getQuote(Number(req.params.id));
    if (!quote) return res.status(404).json({ message: "Tilbud ikke fundet" });
    res.json(quote);
  });
  app.post("/api/quotes", async (req, res) => {
    const quote = await storage.createQuote(req.body);
    res.status(201).json(quote);
  });
  app.patch("/api/quotes/:id", async (req, res) => {
    const quote = await storage.updateQuote(Number(req.params.id), req.body);
    if (!quote) return res.status(404).json({ message: "Tilbud ikke fundet" });
    res.json(quote);
  });
  app.delete("/api/quotes/:id", async (req, res) => {
    const deleted = await storage.deleteQuote(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Tilbud ikke fundet" });
    res.json({ success: true });
  });

  // === Quote Lines ===
  app.get("/api/quotes/:quoteId/lines", async (req, res) => {
    const lines = await storage.getQuoteLines(Number(req.params.quoteId));
    res.json(lines);
  });
  app.post("/api/quotes/:quoteId/lines", async (req, res) => {
    const line = await storage.createQuoteLine({ ...req.body, quoteId: Number(req.params.quoteId) });
    res.status(201).json(line);
  });
  app.patch("/api/quote-lines/:id", async (req, res) => {
    const line = await storage.updateQuoteLine(Number(req.params.id), req.body);
    if (!line) return res.status(404).json({ message: "Linje ikke fundet" });
    res.json(line);
  });
  app.delete("/api/quote-lines/:id", async (req, res) => {
    const deleted = await storage.deleteQuoteLine(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Linje ikke fundet" });
    res.json({ success: true });
  });

  // Full quote create (quote + lines in one request)
  app.post("/api/quotes/full", async (req, res) => {
    const { quote: quoteData, lines } = req.body;
    const quote = await storage.createQuote(quoteData);
    const createdLines = [];
    for (const line of lines) {
      const created = await storage.createQuoteLine({ ...line, quoteId: quote.id });
      createdLines.push(created);
    }
    res.status(201).json({ quote, lines: createdLines });
  });

  // === Jobs ===
  app.get("/api/jobs", async (_req, res) => {
    const jobs = await storage.getJobs();
    res.json(jobs);
  });
  app.get("/api/jobs/:id", async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).json({ message: "Job ikke fundet" });
    res.json(job);
  });
  app.post("/api/jobs", async (req, res) => {
    const job = await storage.createJob(req.body);
    res.status(201).json(job);
  });
  app.patch("/api/jobs/:id", async (req, res) => {
    const job = await storage.updateJob(Number(req.params.id), req.body);
    if (!job) return res.status(404).json({ message: "Job ikke fundet" });
    res.json(job);
  });
  app.delete("/api/jobs/:id", async (req, res) => {
    const deleted = await storage.deleteJob(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Job ikke fundet" });
    res.json({ success: true });
  });

  // === Job Photos ===
  app.get("/api/jobs/:id/photos", async (req, res) => {
    const photos = await storage.getJobPhotos(Number(req.params.id));
    res.json(photos);
  });
  app.post("/api/jobs/:id/photos", async (req, res) => {
    const jobId = Number(req.params.id);
    const job = await storage.getJob(jobId);
    if (!job) return res.status(404).json({ message: "Job ikke fundet" });
    const photo = await storage.createJobPhoto({ ...req.body, jobId });
    res.status(201).json(photo);
  });
  app.delete("/api/jobs/:id/photos/:photoId", async (req, res) => {
    const deleted = await storage.deleteJobPhoto(Number(req.params.photoId));
    if (!deleted) return res.status(404).json({ message: "Foto ikke fundet" });
    res.json({ success: true });
  });

  // === Job Status ===
  app.patch("/api/jobs/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job ikke fundet" });

    const { status, completionNotes } = req.body;
    const updates: any = { status };

    if (status === "in_progress") {
      updates.startedAt = new Date().toISOString();
    }
    if (status === "completed") {
      // Validate photo requirements
      const photos = await storage.getJobPhotos(id);
      const beforeCount = photos.filter(p => p.type === "before").length;
      const afterCount = photos.filter(p => p.type === "after").length;
      if (beforeCount < 2 || afterCount < 2) {
        return res.status(400).json({ message: "Upload mindst 2 før-billeder og 2 efter-billeder" });
      }
      updates.completedAt = new Date().toISOString();
      if (completionNotes) updates.completionNotes = completionNotes;
    }

    const updated = await storage.updateJob(id, updates);
    res.json(updated);
  });

  // === Quote Status ===
  app.patch("/api/quotes/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const quote = await storage.getQuote(id);
    if (!quote) return res.status(404).json({ message: "Tilbud ikke fundet" });

    const { status } = req.body;
    const updates: any = { status };
    if (status === "sent") updates.sentAt = new Date().toISOString();
    if (status === "accepted") updates.acceptedAt = new Date().toISOString();

    const updated = await storage.updateQuote(id, updates);
    res.json(updated);
  });

  // === Create Job from Quote ===
  app.post("/api/quotes/:id/create-job", async (req, res) => {
    const id = Number(req.params.id);
    const quote = await storage.getQuote(id);
    if (!quote) return res.status(404).json({ message: "Tilbud ikke fundet" });
    if (quote.status !== "accepted") return res.status(400).json({ message: "Tilbuddet skal være accepteret" });

    const customer = await storage.getCustomer(quote.customerId);
    const job = await storage.createJob({
      quoteId: quote.id,
      customerId: quote.customerId,
      title: quote.title,
      description: quote.notes || null,
      status: "planned",
      addressLine1: customer?.addressLine1 || null,
      postalCode: customer?.postalCode || null,
      city: customer?.city || null,
      assignedUserId: null,
      scheduledDate: null,
      startedAt: null,
      completedAt: null,
      completionNotes: null,
    });
    res.status(201).json(job);
  });

  // === Customer sub-routes ===
  app.get("/api/customers/:id/quotes", async (req, res) => {
    const customerId = Number(req.params.id);
    const allQuotes = await storage.getQuotes();
    res.json(allQuotes.filter(q => q.customerId === customerId));
  });
  app.get("/api/customers/:id/jobs", async (req, res) => {
    const customerId = Number(req.params.id);
    const allJobs = await storage.getJobs();
    res.json(allJobs.filter(j => j.customerId === customerId));
  });
  app.get("/api/customers/:id/communications", async (req, res) => {
    const comms = await storage.getCommunications(Number(req.params.id));
    res.json(comms);
  });

  // === Communications ===
  app.get("/api/communications", async (req, res) => {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const comms = await storage.getCommunications(customerId);
    res.json(comms);
  });
  app.post("/api/communications", async (req, res) => {
    const comm = await storage.createCommunication(req.body);
    res.status(201).json(comm);
  });

  // === Dashboard stats ===
  app.get("/api/dashboard/stats", async (_req, res) => {
    const jobs = await storage.getJobs();
    const quotes = await storage.getQuotes();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysJobs = jobs.filter(j => {
      if (!j.scheduledDate) return false;
      const d = new Date(j.scheduledDate);
      return d >= today && d < tomorrow;
    });

    const openQuotes = quotes.filter(q => q.status === "sent" || q.status === "draft");
    const acceptedThisMonth = quotes.filter(q => {
      if (q.status !== "accepted") return false;
      const d = q.acceptedAt ? new Date(q.acceptedAt) : new Date(q.createdAt);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const monthRevenue = acceptedThisMonth.reduce((sum, q) => sum + q.totalAmount, 0);

    res.json({
      todaysJobs: todaysJobs.length,
      openQuotes: openQuotes.length,
      pendingInvoices: jobs.filter(j => j.status === "completed").length,
      monthRevenue,
      todaysJobsList: todaysJobs,
    });
  });

  return httpServer;
}
