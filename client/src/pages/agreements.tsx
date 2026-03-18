import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { formatDKK, formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import type { ServiceAgreement, Customer } from "@shared/schema";

const frequencyLabels: Record<string, string> = {
  monthly: "Månedlig",
  quarterly: "Kvartalsvis",
  biannual: "Halvårlig",
  annual: "Årlig",
};

const statusTabs = [
  { key: "all", label: "Alle" },
  { key: "active", label: "Aktive" },
  { key: "paused", label: "Pauseret" },
  { key: "cancelled", label: "Annulleret" },
];

export default function AgreementsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useHashLocation();

  const { data: agreements = [] } = useQuery<ServiceAgreement[]>({ queryKey: ["/api/agreements"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/agreements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setDialogOpen(false);
    },
  });

  const filtered = agreements.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const customerName = customerMap.get(a.customerId)?.name || "";
      return a.title.toLowerCase().includes(q) || customerName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      customerId: Number(fd.get("customerId")),
      title: fd.get("title") as string,
      description: fd.get("description") as string || null,
      frequency: fd.get("frequency") as string,
      pricePerVisit: Number(fd.get("pricePerVisit")),
      startDate: new Date(fd.get("startDate") as string).toISOString(),
      endDate: fd.get("endDate") ? new Date(fd.get("endDate") as string).toISOString() : null,
      nextServiceDate: fd.get("nextServiceDate") ? new Date(fd.get("nextServiceDate") as string).toISOString() : null,
      notes: fd.get("notes") as string || null,
    };
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6" data-testid="agreements-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviceaftaler</h1>
          <p className="text-muted-foreground">{agreements.length} aftaler i alt</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="add-agreement-btn">
          <Plus className="h-4 w-4 mr-2" />Opret aftale
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg på titel eller kundenavn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="agreement-search"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map(tab => (
            <Button
              key={tab.key}
              variant={statusFilter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab.key)}
              data-testid={`filter-${tab.key}`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <Table data-testid="agreements-table">
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead className="hidden md:table-cell">Frekvens</TableHead>
              <TableHead className="text-right hidden md:table-cell">Pris/besøg</TableHead>
              <TableHead className="hidden lg:table-cell">Næste service</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Ingen aftaler fundet.</TableCell></TableRow>
            ) : filtered.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/agreements/${a.id}`)}
                data-testid={`agreement-row-${a.id}`}
              >
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>{customerMap.get(a.customerId)?.name || "—"}</TableCell>
                <TableCell className="hidden md:table-cell">{frequencyLabels[a.frequency] || a.frequency}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{formatDKK(a.pricePerVisit)}</TableCell>
                <TableCell className="hidden lg:table-cell">{formatDate(a.nextServiceDate)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(a.status)} variant="secondary">
                    {getStatusLabel(a.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="agreement-dialog">
          <DialogHeader>
            <DialogTitle>Opret serviceaftale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Kunde *</Label>
              <Select name="customerId" required>
                <SelectTrigger data-testid="agreement-customer-select">
                  <SelectValue placeholder="Vælg kunde" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required data-testid="agreement-title-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea id="description" name="description" data-testid="agreement-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frekvens *</Label>
                <Select name="frequency" required>
                  <SelectTrigger data-testid="agreement-frequency-select">
                    <SelectValue placeholder="Vælg" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Månedlig</SelectItem>
                    <SelectItem value="quarterly">Kvartalsvis</SelectItem>
                    <SelectItem value="biannual">Halvårlig</SelectItem>
                    <SelectItem value="annual">Årlig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerVisit">Pris/besøg (DKK) *</Label>
                <Input id="pricePerVisit" name="pricePerVisit" type="number" step="0.01" required data-testid="agreement-price-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Startdato *</Label>
                <Input id="startDate" name="startDate" type="date" required data-testid="agreement-start-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Slutdato</Label>
                <Input id="endDate" name="endDate" type="date" data-testid="agreement-end-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextServiceDate">Næste service</Label>
              <Input id="nextServiceDate" name="nextServiceDate" type="date" data-testid="agreement-next-service-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Noter</Label>
              <Textarea id="notes" name="notes" data-testid="agreement-notes-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-btn">Annuller</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="save-agreement-btn">
                {createMutation.isPending ? "Opretter..." : "Opret"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
