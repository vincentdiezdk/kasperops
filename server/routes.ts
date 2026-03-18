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

  // === Invoices ===
  app.get("/api/invoices", async (_req, res) => {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  });
  app.get("/api/invoices/:id", async (req, res) => {
    const invoice = await storage.getInvoice(Number(req.params.id));
    if (!invoice) return res.status(404).json({ message: "Faktura ikke fundet" });
    const lines = await storage.getInvoiceLines(invoice.id);
    const reminders = await storage.getPaymentReminders(invoice.id);
    res.json({ ...invoice, lines, reminders });
  });
  app.post("/api/invoices", async (req, res) => {
    const invoiceNumber = req.body.invoiceNumber || storage.getNextInvoiceNumber();
    const dueDate = req.body.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const invoice = await storage.createInvoice({ ...req.body, invoiceNumber, dueDate });
    // Create lines if provided
    if (req.body.lines && Array.isArray(req.body.lines)) {
      for (const line of req.body.lines) {
        await storage.createInvoiceLine({ ...line, invoiceId: invoice.id });
      }
    }
    res.status(201).json(invoice);
  });
  app.patch("/api/invoices/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Faktura ikke fundet" });
    const { status } = req.body;
    const updated = await storage.updateInvoice(id, { status });
    res.json(updated);
  });
  app.post("/api/invoices/:id/pay", async (req, res) => {
    const id = Number(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Faktura ikke fundet" });
    const { amount, date } = req.body;
    const updated = await storage.updateInvoice(id, {
      status: "paid",
      paidAt: date ? new Date(date) : new Date(),
      paidAmount: amount ?? invoice.totalAmount,
    });
    // Communication log
    const customer = await storage.getCustomer(invoice.customerId);
    await storage.createCommunication({
      customerId: invoice.customerId,
      jobId: invoice.jobId,
      quoteId: null,
      type: "system",
      direction: "internal",
      subject: `Betaling registreret — ${invoice.invoiceNumber}`,
      body: `Betaling på ${amount ?? invoice.totalAmount} kr. registreret.`,
    });
    res.json(updated);
  });
  app.post("/api/invoices/:id/reminder", async (req, res) => {
    const id = Number(req.params.id);
    const invoice = await storage.getInvoice(id);
    if (!invoice) return res.status(404).json({ message: "Faktura ikke fundet" });
    if (invoice.reminderCount >= 3) return res.status(400).json({ message: "Maksimalt 3 rykkere tilladt" });

    const newCount = invoice.reminderCount + 1;
    const now = new Date();
    await storage.updateInvoice(id, {
      reminderCount: newCount,
      lastReminderAt: now,
      status: "overdue",
    });
    const reminder = await storage.createPaymentReminder({
      invoiceId: id,
      reminderNumber: newCount,
      sentAt: now,
      type: "email",
      status: "sent",
    });
    // Communication log
    await storage.createCommunication({
      customerId: invoice.customerId,
      jobId: invoice.jobId,
      quoteId: null,
      type: "email",
      direction: "outbound",
      subject: `Rykker ${newCount} — ${invoice.invoiceNumber}`,
      body: `Rykker nr. ${newCount} sendt for faktura ${invoice.invoiceNumber}.`,
    });
    const updated = await storage.getInvoice(id);
    res.json({ invoice: updated, reminder });
  });

  // === Service Agreements ===
  app.get("/api/agreements", async (_req, res) => {
    const agreements = await storage.getServiceAgreements();
    res.json(agreements);
  });
  app.get("/api/agreements/:id", async (req, res) => {
    const agreement = await storage.getServiceAgreement(Number(req.params.id));
    if (!agreement) return res.status(404).json({ message: "Aftale ikke fundet" });
    res.json(agreement);
  });
  app.post("/api/agreements", async (req, res) => {
    const agreement = await storage.createServiceAgreement(req.body);
    res.status(201).json(agreement);
  });
  app.patch("/api/agreements/:id", async (req, res) => {
    const agreement = await storage.updateServiceAgreement(Number(req.params.id), req.body);
    if (!agreement) return res.status(404).json({ message: "Aftale ikke fundet" });
    res.json(agreement);
  });
  app.patch("/api/agreements/:id/status", async (req, res) => {
    const id = Number(req.params.id);
    const agreement = await storage.getServiceAgreement(id);
    if (!agreement) return res.status(404).json({ message: "Aftale ikke fundet" });
    const { status } = req.body;
    const updated = await storage.updateServiceAgreement(id, { status });
    res.json(updated);
  });

  // === Job Status (updated with auto-invoice) ===
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

    // Auto-invoice on job completion
    let createdInvoiceId: number | null = null;
    if (status === "completed" && job.quoteId) {
      const quote = await storage.getQuote(job.quoteId);
      if (quote) {
        const quoteLinesList = await storage.getQuoteLines(job.quoteId);
        const invoiceNumber = storage.getNextInvoiceNumber();
        const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        const invoice = await storage.createInvoice({
          jobId: id,
          customerId: job.customerId,
          invoiceNumber,
          status: "sent",
          issueDate: new Date(),
          dueDate,
          totalAmount: quote.totalAmount,
          paidAt: null,
          paidAmount: null,
          dineroGuid: null,
          reminderCount: 0,
          lastReminderAt: null,
          notes: `Auto-oprettet fra job #${id}`,
        });
        createdInvoiceId = invoice.id;

        if (quoteLinesList.length > 0) {
          for (const ql of quoteLinesList) {
            await storage.createInvoiceLine({
              invoiceId: invoice.id,
              description: ql.description,
              quantity: ql.quantity,
              unitLabel: ql.unitLabel,
              unitPrice: ql.unitPrice,
              lineTotal: ql.lineTotal,
              sortOrder: ql.sortOrder,
            });
          }
        } else {
          await storage.createInvoiceLine({
            invoiceId: invoice.id,
            description: job.title,
            quantity: 1,
            unitLabel: "stk",
            unitPrice: quote.totalAmount,
            lineTotal: quote.totalAmount,
            sortOrder: 0,
          });
        }

        // Communication log
        await storage.createCommunication({
          customerId: job.customerId,
          jobId: id,
          quoteId: job.quoteId,
          type: "system",
          direction: "internal",
          subject: `Faktura ${invoiceNumber} oprettet automatisk`,
          body: `Faktura ${invoiceNumber} på ${quote.totalAmount} kr. oprettet automatisk ved afslutning af job.`,
        });
      }
    }

    res.json({ ...updated, createdInvoiceId });
  });

  // === Dashboard stats (enhanced) ===
  app.get("/api/dashboard/stats", async (_req, res) => {
    const jobs = await storage.getJobs();
    const quotes = await storage.getQuotes();
    const invoices = await storage.getInvoices();
    const agreements = await storage.getServiceAgreements();
    const customers = await storage.getCustomers();
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

    // Pending invoices = sent + overdue
    const pendingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
    const overdueInvoices = invoices.filter(i => {
      if (i.status === "overdue") return true;
      if (i.status === "sent" && new Date(i.dueDate) < today) return true;
      return false;
    });

    // Month revenue = sum of paid invoices this month
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const paidThisMonth = invoices.filter(i => {
      if (i.status !== "paid" || !i.paidAt) return false;
      const d = new Date(i.paidAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const monthRevenue = paidThisMonth.reduce((sum, i) => sum + i.totalAmount, 0);

    // Quote acceptance rate
    const sentOrAccepted = quotes.filter(q => ["sent", "accepted", "rejected", "expired"].includes(q.status));
    const acceptedQuotes = quotes.filter(q => q.status === "accepted");
    const acceptRate = sentOrAccepted.length > 0 ? Math.round((acceptedQuotes.length / sentOrAccepted.length) * 100) : 0;

    // Active agreements
    const activeAgreements = agreements.filter(a => a.status === "active");

    // Outstanding amount
    const outstandingAmount = invoices
      .filter(i => i.status === "sent" || i.status === "overdue")
      .reduce((sum, i) => sum + i.totalAmount, 0);

    // Revenue chart: last 6 months
    const revenueChart = [];
    const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const sum = invoices
        .filter(inv => inv.status === "paid" && inv.paidAt && new Date(inv.paidAt).getMonth() === m && new Date(inv.paidAt).getFullYear() === y)
        .reduce((s, inv) => s + inv.totalAmount, 0);
      revenueChart.push({ month: monthNames[m], revenue: sum });
    }

    // Route widget: today's jobs with coordinates
    const HOME_BASE = { lat: 56.1246, lng: 10.1916 };
    const todaysJobsWithCoords = todaysJobs.map(j => {
      const customer = customers.find(c => c.id === j.customerId);
      return {
        ...j,
        latitude: customer?.latitude ?? null,
        longitude: customer?.longitude ?? null,
        customerName: customer?.name ?? "",
      };
    });

    // Simple nearest-neighbor ordering for route widget
    const orderedRouteJobs = [];
    const remaining = [...todaysJobsWithCoords];
    let currentLat = HOME_BASE.lat;
    let currentLng = HOME_BASE.lng;
    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const lat = remaining[i].latitude ?? currentLat;
        const lng = remaining[i].longitude ?? currentLng;
        const dist = Math.sqrt((lat - currentLat) ** 2 + (lng - currentLng) ** 2);
        if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
      }
      const next = remaining.splice(nearestIdx, 1)[0];
      orderedRouteJobs.push(next);
      currentLat = next.latitude ?? currentLat;
      currentLng = next.longitude ?? currentLng;
    }

    const totalKm = orderedRouteJobs.length > 0 ? Math.round(orderedRouteJobs.length * 28 + 15) : 0;
    const totalMinutes = orderedRouteJobs.length > 0 ? orderedRouteJobs.length * 45 + Math.round(totalKm * 0.8) : 0;

    res.json({
      todaysJobs: todaysJobs.length,
      openQuotes: openQuotes.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      monthRevenue,
      acceptRate,
      activeAgreements: activeAgreements.length,
      outstandingAmount,
      revenueChart,
      todaysJobsList: todaysJobs,
      routeWidget: {
        jobs: orderedRouteJobs,
        totalKm,
        totalMinutes,
      },
    });
  });

  // === Route Planning ===
  app.get("/api/route/daily", async (req, res) => {
    const dateStr = req.query.date as string;
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const jobs = await storage.getJobs();
    const customers = await storage.getCustomers();

    const dayJobs = jobs.filter(j => {
      if (!j.scheduledDate) return false;
      const d = new Date(j.scheduledDate);
      return d >= date && d < nextDay;
    });

    const HOME_BASE = { lat: 56.1246, lng: 10.1916, label: "Hjemmebase — Højbjerg" };

    const jobsWithCoords = dayJobs.map(j => {
      const customer = customers.find(c => c.id === j.customerId);
      return {
        ...j,
        latitude: customer?.latitude ?? null,
        longitude: customer?.longitude ?? null,
        customerName: customer?.name ?? "",
        address: j.addressLine1 ? `${j.addressLine1}, ${j.postalCode} ${j.city}` : "",
      };
    });

    // Nearest-neighbor route optimization
    const ordered = [];
    const remaining = [...jobsWithCoords];
    let currentLat = HOME_BASE.lat;
    let currentLng = HOME_BASE.lng;
    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const lat = remaining[i].latitude ?? currentLat;
        const lng = remaining[i].longitude ?? currentLng;
        const dist = Math.sqrt((lat - currentLat) ** 2 + (lng - currentLng) ** 2);
        if (dist < nearestDist) { nearestDist = dist; nearestIdx = i; }
      }
      const next = remaining.splice(nearestIdx, 1)[0];
      ordered.push(next);
      currentLat = next.latitude ?? currentLat;
      currentLng = next.longitude ?? currentLng;
    }

    // Simulate times and distances
    let cumulativeMinutes = 0;
    const startHour = 8;
    const startMinute = 0;
    const stops = ordered.map((job, idx) => {
      const driveMinutes = idx === 0 ? 20 : 15 + Math.round(Math.random() * 15);
      cumulativeMinutes += driveMinutes;
      const arrivalTotalMin = startHour * 60 + startMinute + cumulativeMinutes;
      const arrHour = Math.floor(arrivalTotalMin / 60);
      const arrMin = arrivalTotalMin % 60;
      const estimatedDuration = 45;
      cumulativeMinutes += estimatedDuration;
      return {
        ...job,
        stopNumber: idx + 1,
        estimatedArrival: `${String(arrHour).padStart(2, "0")}:${String(arrMin).padStart(2, "0")}`,
        estimatedDuration,
        driveMinutes,
      };
    });

    const totalKm = stops.length > 0 ? Math.round(stops.length * 28 + 15) : 0;
    const totalMinutes = cumulativeMinutes + 20; // Return home

    res.json({
      date: date.toISOString(),
      homeBase: HOME_BASE,
      stops,
      totalJobs: stops.length,
      totalKm,
      totalMinutes,
    });
  });

  // === Leads ===
  app.get("/api/leads", async (_req, res) => {
    const leads = await storage.getLeads();
    res.json(leads);
  });
  app.get("/api/leads/:id", async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead ikke fundet" });
    res.json(lead);
  });
  app.post("/api/leads", async (req, res) => {
    const lead = await storage.createLead(req.body);
    res.status(201).json(lead);
  });
  app.patch("/api/leads/:id", async (req, res) => {
    const lead = await storage.updateLead(Number(req.params.id), req.body);
    if (!lead) return res.status(404).json({ message: "Lead ikke fundet" });
    res.json(lead);
  });
  app.delete("/api/leads/:id", async (req, res) => {
    const deleted = await storage.deleteLead(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Lead ikke fundet" });
    res.json({ success: true });
  });
  app.post("/api/leads/:id/convert", async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead ikke fundet" });

    // Create customer from lead
    const customer = await storage.createCustomer({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      addressLine1: lead.address,
      postalCode: null,
      city: null,
      cvr: null,
      notes: lead.notes,
      tags: ["lead-konvertering"],
      latitude: null,
      longitude: null,
      gdprConsentAt: null,
    });

    // Update lead with customer link
    await storage.updateLead(lead.id, { customerId: customer.id, stage: "completed" });
    res.json({ customer, lead: await storage.getLead(lead.id) });
  });

  // === GDPR Anonymize ===
  app.post("/api/customers/:id/anonymize", async (req, res) => {
    const id = Number(req.params.id);
    const customer = await storage.getCustomer(id);
    if (!customer) return res.status(404).json({ message: "Kunde ikke fundet" });

    const updated = await storage.updateCustomer(id, {
      name: "[SLETTET]",
      email: null,
      phone: null,
      addressLine1: null,
      postalCode: null,
      city: null,
      cvr: null,
      notes: null,
      latitude: null,
      longitude: null,
    });
    res.json(updated);
  });

  // === Reports Stats ===
  app.get("/api/reports/stats", async (req, res) => {
    const period = (req.query.period as string) || "all";
    const invoices = await storage.getInvoices();
    const jobs = await storage.getJobs();
    const quotes = await storage.getQuotes();
    const customers = await storage.getCustomers();
    const agreements = await storage.getServiceAgreements();
    const leads = await storage.getLeads();

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Determine period range
    let periodStart: Date;
    switch (period) {
      case "this_month":
        periodStart = new Date(thisYear, thisMonth, 1);
        break;
      case "last_month":
        periodStart = new Date(thisYear, thisMonth - 1, 1);
        break;
      case "last_3_months":
        periodStart = new Date(thisYear, thisMonth - 2, 1);
        break;
      case "this_year":
        periodStart = new Date(thisYear, 0, 1);
        break;
      default:
        periodStart = new Date(2020, 0, 1);
    }
    const periodEnd = period === "last_month" ? new Date(thisYear, thisMonth, 1) : new Date();

    const inPeriod = (date: Date | string | null) => {
      if (!date) return false;
      const d = new Date(date);
      return d >= periodStart && d < periodEnd;
    };

    // Paid invoices in period
    const paidInPeriod = invoices.filter(i => i.status === "paid" && i.paidAt && inPeriod(i.paidAt));
    const totalRevenue = paidInPeriod.reduce((s, i) => s + i.totalAmount, 0);
    const avgJobValue = paidInPeriod.length > 0 ? totalRevenue / paidInPeriod.length : 0;

    // Completed jobs in period
    const completedJobs = jobs.filter(j => j.status === "completed" && j.completedAt && inPeriod(j.completedAt));

    // Quote acceptance rate in period
    const quotesInPeriod = quotes.filter(q => inPeriod(q.createdAt) && ["sent", "accepted", "rejected", "expired"].includes(q.status));
    const acceptedInPeriod = quotesInPeriod.filter(q => q.status === "accepted");
    const quoteAcceptRate = quotesInPeriod.length > 0 ? Math.round((acceptedInPeriod.length / quotesInPeriod.length) * 100) : 0;

    // New customers in period
    const newCustomers = customers.filter(c => inPeriod(c.createdAt));

    // Active agreements
    const activeAgreements = agreements.filter(a => a.status === "active");

    // Outstanding
    const outstandingAmount = invoices
      .filter(i => i.status === "sent" || i.status === "overdue")
      .reduce((s, i) => s + i.totalAmount, 0);

    // Avg payment time
    const paidWithDates = invoices.filter(i => i.status === "paid" && i.paidAt && i.issueDate);
    const avgPaymentDays = paidWithDates.length > 0
      ? Math.round(paidWithDates.reduce((s, i) => s + (new Date(i.paidAt!).getTime() - new Date(i.issueDate).getTime()) / (1000 * 60 * 60 * 24), 0) / paidWithDates.length)
      : 0;

    // Revenue by month (last 12 months)
    const monthNames = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const sum = invoices
        .filter(inv => inv.status === "paid" && inv.paidAt && new Date(inv.paidAt).getMonth() === m && new Date(inv.paidAt).getFullYear() === y)
        .reduce((s, inv) => s + inv.totalAmount, 0);
      revenueByMonth.push({ month: `${monthNames[m]} ${y}`, shortMonth: monthNames[m], revenue: sum });
    }

    // Top customers
    const customerRevenue: Record<number, { name: string; revenue: number; jobCount: number }> = {};
    for (const inv of paidInPeriod) {
      const c = customers.find(cu => cu.id === inv.customerId);
      if (!customerRevenue[inv.customerId]) {
        customerRevenue[inv.customerId] = { name: c?.name ?? "Ukendt", revenue: 0, jobCount: 0 };
      }
      customerRevenue[inv.customerId].revenue += inv.totalAmount;
      customerRevenue[inv.customerId].jobCount += 1;
    }
    const topCustomers = Object.values(customerRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Popular services (from invoice lines)
    const serviceUsage: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const inv of paidInPeriod) {
      const lines = await storage.getInvoiceLines(inv.id);
      for (const line of lines) {
        if (!serviceUsage[line.description]) {
          serviceUsage[line.description] = { name: line.description, count: 0, revenue: 0 };
        }
        serviceUsage[line.description].count += 1;
        serviceUsage[line.description].revenue += line.lineTotal;
      }
    }
    const popularServices = Object.values(serviceUsage).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Revenue by category (from invoice lines)
    const categoryRevenue: Record<string, number> = {};
    for (const inv of paidInPeriod) {
      const lines = await storage.getInvoiceLines(inv.id);
      for (const line of lines) {
        const cat = line.description.includes("Alge") ? "Algebehandling"
          : line.description.includes("fliser") || line.description.includes("indkørsel") || line.description.includes("Højtryksvask") ? "Rens af fliser"
          : line.description.includes("Vindues") || line.description.includes("vinduer") ? "Vinduespudsning"
          : line.description.includes("Hæk") || line.description.includes("Græs") || line.description.includes("haveservice") ? "Haveservice"
          : "Andet";
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + line.lineTotal;
      }
    }
    const revenueByCategory = Object.entries(categoryRevenue).map(([name, value]) => ({ name, value }));

    // Jobs per month
    const jobsPerMonth = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const count = jobs.filter(j => j.scheduledDate && new Date(j.scheduledDate).getMonth() === m && new Date(j.scheduledDate).getFullYear() === y).length;
      jobsPerMonth.push({ month: monthNames[m], count });
    }

    // Lead conversion funnel
    const totalLeads = leads.length;
    const leadsWithQuote = leads.filter(l => ["quote_sent", "accepted", "completed"].includes(l.stage)).length;
    const leadsAccepted = leads.filter(l => ["accepted", "completed"].includes(l.stage)).length;
    const leadsCompleted = leads.filter(l => l.stage === "completed").length;

    res.json({
      totalRevenue,
      avgJobValue,
      completedJobs: completedJobs.length,
      quoteAcceptRate,
      newCustomers: newCustomers.length,
      activeAgreements: activeAgreements.length,
      outstandingAmount,
      avgPaymentDays,
      revenueByMonth,
      topCustomers,
      popularServices,
      revenueByCategory,
      jobsPerMonth,
      leadFunnel: {
        leads: totalLeads,
        quoteSent: leadsWithQuote,
        accepted: leadsAccepted,
        completed: leadsCompleted,
      },
    });
  });

  // === Invoice Lines (standalone for reports) ===
  app.get("/api/invoices/:invoiceId/lines", async (req, res) => {
    const lines = await storage.getInvoiceLines(Number(req.params.invoiceId));
    res.json(lines);
  });

  return httpServer;
}
