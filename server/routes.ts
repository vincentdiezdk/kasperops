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
