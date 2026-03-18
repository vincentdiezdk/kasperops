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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, ArrowLeft, Phone, Mail, MapPin } from "lucide-react";
import { formatDate, formatDKK, getStatusLabel, getStatusColor } from "@/lib/formatters";
import type { Customer, Quote, Job } from "@shared/schema";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: quotes = [] } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/customers/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); setDialogOpen(false); setEditingCustomer(null); },
  });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email?.toLowerCase().includes(q)) || (c.city?.toLowerCase().includes(q));
  });

  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
  const customerQuotes = quotes.filter(q => q.customerId === selectedCustomerId);
  const customerJobs = jobs.filter(j => j.customerId === selectedCustomerId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      addressLine1: fd.get("addressLine1") as string || null,
      postalCode: fd.get("postalCode") as string || null,
      city: fd.get("city") as string || null,
      cvr: fd.get("cvr") as string || null,
      notes: fd.get("notes") as string || null,
    };
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-6" data-testid="customer-detail-page">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCustomerId(null)} data-testid="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedCustomer.name}</h1>
            <p className="text-muted-foreground">Kunde #{selectedCustomer.id}</p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={() => { setEditingCustomer(selectedCustomer); setDialogOpen(true); }} data-testid="edit-customer-btn">
              Redigér
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card data-testid="customer-info-card">
            <CardHeader><CardTitle>Kontaktoplysninger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedCustomer.email && (
                <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" />{selectedCustomer.email}</div>
              )}
              {selectedCustomer.phone && (
                <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" />{selectedCustomer.phone}</div>
              )}
              {selectedCustomer.addressLine1 && (
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedCustomer.addressLine1}, {selectedCustomer.postalCode} {selectedCustomer.city}</div>
              )}
              {selectedCustomer.cvr && (
                <div className="text-sm text-muted-foreground">CVR: {selectedCustomer.cvr}</div>
              )}
              {selectedCustomer.notes && (
                <div className="text-sm mt-2 p-3 bg-muted rounded-lg">{selectedCustomer.notes}</div>
              )}
              {selectedCustomer.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="mr-1">{tag}</Badge>
              ))}
            </CardContent>
          </Card>

          <Card data-testid="customer-quotes-card">
            <CardHeader><CardTitle>Tilbud ({customerQuotes.length})</CardTitle></CardHeader>
            <CardContent>
              {customerQuotes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Ingen tilbud endnu.</p>
              ) : (
                <div className="space-y-3">
                  {customerQuotes.map(q => (
                    <div key={q.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{q.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDKK(q.totalAmount)}</p>
                      </div>
                      <Badge className={getStatusColor(q.status)} variant="secondary">{getStatusLabel(q.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="customer-jobs-card">
            <CardHeader><CardTitle>Jobs ({customerJobs.length})</CardTitle></CardHeader>
            <CardContent>
              {customerJobs.length === 0 ? (
                <p className="text-muted-foreground text-sm">Ingen jobs endnu.</p>
              ) : (
                <div className="space-y-3">
                  {customerJobs.map(j => (
                    <div key={j.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{j.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(j.scheduledDate)}</p>
                      </div>
                      <Badge className={getStatusColor(j.status)} variant="secondary">{getStatusLabel(j.status)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reuse the dialog for editing */}
        <CustomerDialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCustomer(null); }}
          customer={editingCustomer}
          onSubmit={handleSubmit}
          isPending={updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunder</h1>
          <p className="text-muted-foreground">{customers.length} kunder i alt</p>
        </div>
        <Button onClick={() => { setEditingCustomer(null); setDialogOpen(true); }} data-testid="add-customer-btn">
          <Plus className="h-4 w-4 mr-2" />Opret kunde
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søg på navn, email eller by..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="customer-search"
        />
      </div>

      <Card>
        <Table data-testid="customers-table">
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Telefon</TableHead>
              <TableHead className="hidden lg:table-cell">By</TableHead>
              <TableHead className="hidden lg:table-cell">Oprettet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Ingen kunder fundet.</TableCell></TableRow>
            ) : filtered.map((c) => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomerId(c.id)} data-testid={`customer-row-${c.id}`}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="hidden md:table-cell">{c.email || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{c.phone || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{c.city || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(c.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingCustomer(null); }}
        customer={editingCustomer}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function CustomerDialog({ open, onOpenChange, customer, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="customer-dialog">
        <DialogHeader>
          <DialogTitle>{customer ? "Redigér kunde" : "Opret kunde"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input id="name" name="name" required defaultValue={customer?.name || ""} data-testid="customer-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={customer?.email || ""} data-testid="customer-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone || ""} data-testid="customer-phone-input" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Adresse</Label>
            <Input id="addressLine1" name="addressLine1" defaultValue={customer?.addressLine1 || ""} data-testid="customer-address-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postnr.</Label>
              <Input id="postalCode" name="postalCode" defaultValue={customer?.postalCode || ""} data-testid="customer-postal-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">By</Label>
              <Input id="city" name="city" defaultValue={customer?.city || ""} data-testid="customer-city-input" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cvr">CVR-nummer</Label>
            <Input id="cvr" name="cvr" defaultValue={customer?.cvr || ""} data-testid="customer-cvr-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Noter</Label>
            <Textarea id="notes" name="notes" defaultValue={customer?.notes || ""} data-testid="customer-notes-input" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="cancel-btn">Annuller</Button>
            <Button type="submit" disabled={isPending} data-testid="save-customer-btn">
              {isPending ? "Gemmer..." : "Gem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
