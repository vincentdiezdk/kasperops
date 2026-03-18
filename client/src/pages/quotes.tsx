import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, ArrowLeft, Trash2, ArrowRight, ArrowLeftIcon, Check, Send } from "lucide-react";
import { formatDKK, formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import type { Quote, QuoteLine, Customer, PriceItem } from "@shared/schema";

interface WizardLine {
  tempId: string;
  priceItemId: number | null;
  description: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
  sortOrder: number;
}

export default function QuotesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  const { data: quotes = [] } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || "Ukendt";

  const filtered = quotes.filter(q => {
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    const s = search.toLowerCase();
    if (s && !q.title.toLowerCase().includes(s) && !getCustomerName(q.customerId).toLowerCase().includes(s)) return false;
    return true;
  });

  const selectedQuote = selectedQuoteId ? quotes.find(q => q.id === selectedQuoteId) : null;

  if (selectedQuote) {
    return <QuoteDetail quote={selectedQuote} customers={customers} onBack={() => setSelectedQuoteId(null)} />;
  }

  return (
    <div className="space-y-6" data-testid="quotes-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tilbud</h1>
          <p className="text-muted-foreground">{quotes.length} tilbud i alt</p>
        </div>
        <Button onClick={() => setWizardOpen(true)} data-testid="new-quote-btn">
          <Plus className="h-4 w-4 mr-2" />Nyt tilbud
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg i tilbud..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="quote-search"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="draft">Kladde</TabsTrigger>
            <TabsTrigger value="sent">Sendt</TabsTrigger>
            <TabsTrigger value="accepted">Accepteret</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <Table data-testid="quotes-table">
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead className="hidden md:table-cell">Kunde</TableHead>
              <TableHead className="hidden md:table-cell">Beløb</TableHead>
              <TableHead className="hidden lg:table-cell">Oprettet</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Ingen tilbud fundet.</TableCell></TableRow>
            ) : filtered.map(q => (
              <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedQuoteId(q.id)} data-testid={`quote-row-${q.id}`}>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell className="hidden md:table-cell">{getCustomerName(q.customerId)}</TableCell>
                <TableCell className="hidden md:table-cell">{formatDKK(q.totalAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(q.createdAt)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(q.status)} variant="secondary">{getStatusLabel(q.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {wizardOpen && (
        <QuoteWizard
          customers={customers}
          onClose={() => setWizardOpen(false)}
          onCreated={(quoteId) => { setWizardOpen(false); setSelectedQuoteId(quoteId); }}
        />
      )}
    </div>
  );
}

function QuoteDetail({ quote, customers, onBack }: { quote: Quote; customers: Customer[]; onBack: () => void }) {
  const { data: lines = [] } = useQuery<QuoteLine[]>({ queryKey: [`/api/quotes/${quote.id}/lines`] });
  const customer = customers.find(c => c.id === quote.customerId);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/quotes/${quote.id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/quotes"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); },
  });

  return (
    <div className="space-y-6" data-testid="quote-detail-page">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{quote.title}</h1>
          <p className="text-muted-foreground">Tilbud #{quote.id} — {customer?.name}</p>
        </div>
        <Badge className={getStatusColor(quote.status)} variant="secondary">{getStatusLabel(quote.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card data-testid="quote-lines-card">
            <CardHeader><CardTitle>Linjer</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beskrivelse</TableHead>
                    <TableHead className="text-right">Antal</TableHead>
                    <TableHead>Enhed</TableHead>
                    <TableHead className="text-right">Enhedspris</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{l.description}</TableCell>
                      <TableCell className="text-right">{l.quantity}</TableCell>
                      <TableCell>{l.unitLabel}</TableCell>
                      <TableCell className="text-right">{formatDKK(l.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatDKK(l.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{formatDKK(quote.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="quote-info-card">
            <CardHeader><CardTitle>Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Kunde:</span> {customer?.name}</div>
              <div><span className="text-muted-foreground">Oprettet:</span> {formatDate(quote.createdAt)}</div>
              {quote.validUntil && <div><span className="text-muted-foreground">Gyldig til:</span> {formatDate(quote.validUntil)}</div>}
              {quote.sentAt && <div><span className="text-muted-foreground">Sendt:</span> {formatDate(quote.sentAt)}</div>}
              {quote.acceptedAt && <div><span className="text-muted-foreground">Accepteret:</span> {formatDate(quote.acceptedAt)}</div>}
              {quote.notes && <div className="p-3 bg-muted rounded-lg mt-2">{quote.notes}</div>}
            </CardContent>
          </Card>

          <Card data-testid="quote-actions-card">
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {quote.status === "draft" && (
                <Button
                  className="w-full"
                  onClick={() => updateMutation.mutate({ status: "sent", sentAt: new Date().toISOString() })}
                  data-testid="mark-sent-btn"
                >
                  <Send className="h-4 w-4 mr-2" />Markér som sendt
                </Button>
              )}
              {quote.status === "sent" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => updateMutation.mutate({ status: "accepted", acceptedAt: new Date().toISOString() })}
                    data-testid="mark-accepted-btn"
                  >
                    <Check className="h-4 w-4 mr-2" />Markér som accepteret
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => updateMutation.mutate({ status: "rejected" })}
                    data-testid="mark-rejected-btn"
                  >
                    Markér som afvist
                  </Button>
                </>
              )}
              {(quote.status === "accepted" || quote.status === "rejected" || quote.status === "expired") && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tilbuddet er {getStatusLabel(quote.status).toLowerCase()}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuoteWizard({ customers, onClose, onCreated }: {
  customers: Customer[];
  onClose: () => void;
  onCreated: (quoteId: number) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [lines, setLines] = useState<WizardLine[]>([]);
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [pricePickerOpen, setPricePickerOpen] = useState(false);

  const { data: priceItems = [] } = useQuery<PriceItem[]>({ queryKey: ["/api/price-items"] });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return res.json();
    },
    onSuccess: (customer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setSelectedCustomerId(customer.id);
      setNewCustomerMode(false);
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/quotes/full", data);
      return res.json();
    },
    onSuccess: (result: { quote: Quote }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onCreated(result.quote.id);
    },
  });

  const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const addLineFromCatalog = (item: PriceItem) => {
    const newLine: WizardLine = {
      tempId: Math.random().toString(36).substring(7),
      priceItemId: item.id,
      description: item.name,
      quantity: 1,
      unitLabel: item.unitLabel,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice,
      sortOrder: lines.length,
    };
    setLines([...lines, newLine]);
    setPricePickerOpen(false);
  };

  const addCustomLine = () => {
    const newLine: WizardLine = {
      tempId: Math.random().toString(36).substring(7),
      priceItemId: null,
      description: "",
      quantity: 1,
      unitLabel: "stk",
      unitPrice: 0,
      lineTotal: 0,
      sortOrder: lines.length,
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (tempId: string, field: string, value: any) => {
    setLines(prev => prev.map(l => {
      if (l.tempId !== tempId) return l;
      const updated = { ...l, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        updated.lineTotal = updated.quantity * updated.unitPrice;
      }
      return updated;
    }));
  };

  const removeLine = (tempId: string) => {
    setLines(prev => prev.filter(l => l.tempId !== tempId));
  };

  const handleSave = (status: "draft" | "sent") => {
    const quoteData = {
      customerId: selectedCustomerId!,
      title,
      status,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      notes: notes || null,
      totalAmount: total,
      sentAt: status === "sent" ? new Date().toISOString() : null,
    };
    const lineData = lines.map((l, i) => ({
      priceItemId: l.priceItemId,
      description: l.description,
      quantity: l.quantity,
      unitLabel: l.unitLabel,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      sortOrder: i,
    }));
    createQuoteMutation.mutate({ quote: quoteData, lines: lineData });
  };

  const handleNewCustomerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createCustomerMutation.mutate({
      name: fd.get("name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      addressLine1: fd.get("addressLine1") as string || null,
      postalCode: fd.get("postalCode") as string || null,
      city: fd.get("city") as string || null,
    });
  };

  const canProceedStep1 = selectedCustomerId !== null;
  const canProceedStep2 = lines.length > 0 && lines.every(l => l.description && l.unitPrice > 0);
  const canProceedStep3 = title.length > 0;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email?.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="quote-wizard">
        <DialogHeader>
          <DialogTitle>Tilbudsgiver</DialogTitle>
          <div className="flex items-center gap-2 pt-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step ? "bg-primary text-primary-foreground" :
                  s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>{s}</div>
                <span className={`text-sm hidden sm:inline ${s === step ? "font-medium" : "text-muted-foreground"}`}>
                  {s === 1 ? "Kunde" : s === 2 ? "Linjer" : s === 3 ? "Detaljer" : "Oversigt"}
                </span>
                {s < 4 && <div className="w-8 h-px bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step 1: Kunde */}
        {step === 1 && (
          <div className="space-y-4" data-testid="wizard-step-1">
            {!newCustomerMode ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg kunde..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                    data-testid="wizard-customer-search"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 border-b last:border-0 ${selectedCustomerId === c.id ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedCustomerId(c.id)}
                      data-testid={`wizard-customer-${c.id}`}
                    >
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email || ""} {c.phone || ""}</p>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">Ingen kunder fundet.</p>
                  )}
                </div>
                {selectedCustomer && (
                  <Card className="bg-primary/5">
                    <CardContent className="pt-4">
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email} — {selectedCustomer.phone}</p>
                      {selectedCustomer.addressLine1 && (
                        <p className="text-sm text-muted-foreground">{selectedCustomer.addressLine1}, {selectedCustomer.postalCode} {selectedCustomer.city}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
                <Button variant="outline" onClick={() => setNewCustomerMode(true)} data-testid="wizard-new-customer-btn">
                  <Plus className="h-4 w-4 mr-2" />Opret ny kunde
                </Button>
              </>
            ) : (
              <form onSubmit={handleNewCustomerSubmit} className="space-y-4" data-testid="wizard-new-customer-form">
                <div className="space-y-2">
                  <Label>Navn *</Label>
                  <Input name="name" required data-testid="wizard-new-name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Email</Label><Input name="email" data-testid="wizard-new-email" /></div>
                  <div className="space-y-2"><Label>Telefon</Label><Input name="phone" data-testid="wizard-new-phone" /></div>
                </div>
                <div className="space-y-2"><Label>Adresse</Label><Input name="addressLine1" data-testid="wizard-new-address" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Postnr.</Label><Input name="postalCode" data-testid="wizard-new-postal" /></div>
                  <div className="space-y-2"><Label>By</Label><Input name="city" data-testid="wizard-new-city" /></div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setNewCustomerMode(false)}>Annuller</Button>
                  <Button type="submit" disabled={createCustomerMutation.isPending} data-testid="wizard-save-customer-btn">
                    {createCustomerMutation.isPending ? "Opretter..." : "Opret kunde"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Linjer */}
        {step === 2 && (
          <div className="space-y-4" data-testid="wizard-step-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPricePickerOpen(true)} data-testid="add-from-catalog-btn">
                <Plus className="h-4 w-4 mr-2" />Tilføj fra priskatalog
              </Button>
              <Button variant="outline" onClick={addCustomLine} data-testid="add-custom-line-btn">
                <Plus className="h-4 w-4 mr-2" />Tilføj brugerdefineret linje
              </Button>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Ingen linjer endnu. Tilføj ydelser fra priskataloget eller opret egne linjer.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beskrivelse</TableHead>
                      <TableHead className="w-24">Antal</TableHead>
                      <TableHead className="w-20">Enhed</TableHead>
                      <TableHead className="w-28">Enhedspris</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map(l => (
                      <TableRow key={l.tempId}>
                        <TableCell>
                          <Input
                            value={l.description}
                            onChange={(e) => updateLine(l.tempId, "description", e.target.value)}
                            className="h-8"
                            data-testid={`line-desc-${l.tempId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.quantity}
                            onChange={(e) => updateLine(l.tempId, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-8"
                            data-testid={`line-qty-${l.tempId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={l.unitLabel}
                            onChange={(e) => updateLine(l.tempId, "unitLabel", e.target.value)}
                            className="h-8"
                            data-testid={`line-unit-${l.tempId}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.unitPrice}
                            onChange={(e) => updateLine(l.tempId, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="h-8"
                            data-testid={`line-price-${l.tempId}`}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDKK(l.lineTotal)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLine(l.tempId)} data-testid={`remove-line-${l.tempId}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold" data-testid="wizard-total">{formatDKK(total)}</p>
              </div>
            </div>

            {/* Price picker dialog */}
            <Dialog open={pricePickerOpen} onOpenChange={setPricePickerOpen}>
              <DialogContent className="max-w-lg" data-testid="price-picker-dialog">
                <DialogHeader><DialogTitle>Vælg fra priskatalog</DialogTitle></DialogHeader>
                <div className="max-h-80 overflow-y-auto space-y-1">
                  {priceItems.filter(p => p.isActive).map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => addLineFromCatalog(item)}
                      data-testid={`catalog-item-${item.id}`}
                    >
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category} — {item.unitLabel}</p>
                      </div>
                      <span className="font-medium text-sm">{formatDKK(item.unitPrice)}</span>
                    </div>
                  ))}
                  {priceItems.filter(p => p.isActive).length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">Ingen ydelser i kataloget.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Step 3: Detaljer */}
        {step === 3 && (
          <div className="space-y-4" data-testid="wizard-step-3">
            <div className="space-y-2">
              <Label htmlFor="quote-title">Titel *</Label>
              <Input
                id="quote-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Algebehandling af tag — Nørregade 12"
                data-testid="wizard-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid-until">Gyldig til</Label>
              <Input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                data-testid="wizard-valid-until-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote-notes">Noter</Label>
              <Textarea
                id="quote-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Yderligere bemærkninger til tilbuddet..."
                data-testid="wizard-notes-input"
              />
            </div>
            <Card className="bg-muted/50">
              <CardContent className="pt-4 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Beregnet total ({lines.length} linjer)</span>
                <span className="text-xl font-bold">{formatDKK(total)}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Oversigt / Preview */}
        {step === 4 && (
          <div className="space-y-6" data-testid="wizard-step-4">
            <Card>
              <CardHeader>
                <CardTitle>{title || "Uden titel"}</CardTitle>
                <p className="text-sm text-muted-foreground">Til: {selectedCustomer?.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beskrivelse</TableHead>
                      <TableHead className="text-right">Antal</TableHead>
                      <TableHead>Enhed</TableHead>
                      <TableHead className="text-right">Enhedspris</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map(l => (
                      <TableRow key={l.tempId}>
                        <TableCell>{l.description}</TableCell>
                        <TableCell className="text-right">{l.quantity}</TableCell>
                        <TableCell>{l.unitLabel}</TableCell>
                        <TableCell className="text-right">{formatDKK(l.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatDKK(l.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator />
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{formatDKK(total)}</p>
                  </div>
                </div>
                {validUntil && <p className="text-sm text-muted-foreground">Gyldig til: {formatDate(validUntil)}</p>}
                {notes && <div className="p-3 bg-muted rounded-lg text-sm">{notes}</div>}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} data-testid="wizard-prev-btn">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />Tilbage
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="wizard-cancel-btn">Annuller</Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }
                data-testid="wizard-next-btn"
              >
                Næste<ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave("draft")}
                  disabled={createQuoteMutation.isPending}
                  data-testid="wizard-save-draft-btn"
                >
                  Gem som kladde
                </Button>
                <Button
                  onClick={() => handleSave("sent")}
                  disabled={createQuoteMutation.isPending}
                  data-testid="wizard-mark-sent-btn"
                >
                  <Send className="h-4 w-4 mr-2" />Markér som sendt
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
