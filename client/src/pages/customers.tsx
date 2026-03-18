import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Download } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { downloadCSV } from "@/lib/csv-export";
import type { Customer } from "@shared/schema";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useHashLocation();

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/customers"] }); setDialogOpen(false); },
  });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email?.toLowerCase().includes(q)) || (c.city?.toLowerCase().includes(q));
  });

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
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunder</h1>
          <p className="text-muted-foreground">{customers.length} kunder i alt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const exportData = filtered.map(c => ({
              name: c.name,
              email: c.email || "",
              phone: c.phone || "",
              city: c.city || "",
              created: formatDate(c.createdAt),
            }));
            downloadCSV(exportData, [
              { key: "name", header: "Navn" },
              { key: "email", header: "Email" },
              { key: "phone", header: "Telefon" },
              { key: "city", header: "By" },
              { key: "created", header: "Oprettet" },
            ], "kunder.csv");
          }} data-testid="export-csv-btn">
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="add-customer-btn">
            <Plus className="h-4 w-4 mr-2" />Opret kunde
          </Button>
        </div>
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
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/customers/${c.id}`)} data-testid={`customer-row-${c.id}`}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="customer-dialog">
          <DialogHeader>
            <DialogTitle>Opret kunde</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" name="name" required data-testid="customer-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" data-testid="customer-email-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" data-testid="customer-phone-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input id="addressLine1" name="addressLine1" data-testid="customer-address-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnr.</Label>
                <Input id="postalCode" name="postalCode" data-testid="customer-postal-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">By</Label>
                <Input id="city" name="city" data-testid="customer-city-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvr">CVR-nummer</Label>
              <Input id="cvr" name="cvr" data-testid="customer-cvr-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Noter</Label>
              <Textarea id="notes" name="notes" data-testid="customer-notes-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-btn">Annuller</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="save-customer-btn">
                {createMutation.isPending ? "Opretter..." : "Opret"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
