import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { formatDKK, formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { downloadCSV } from "@/lib/csv-export";
import type { Invoice, Customer } from "@shared/schema";

const statusTabs = [
  { key: "all", label: "Alle" },
  { key: "draft", label: "Kladde" },
  { key: "sent", label: "Sendt" },
  { key: "paid", label: "Betalt" },
  { key: "overdue", label: "Forfalden" },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, navigate] = useHashLocation();

  const { data: invoices = [] } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const customerMap = new Map(customers.map(c => [c.id, c]));

  const getDisplayStatus = (inv: Invoice) => {
    if (inv.status === "sent" && new Date(inv.dueDate) < new Date()) return "overdue";
    return inv.status;
  };

  const filtered = invoices.filter((inv) => {
    const displayStatus = getDisplayStatus(inv);
    if (statusFilter !== "all" && displayStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const customerName = customerMap.get(inv.customerId)?.name || "";
      return inv.invoiceNumber.toLowerCase().includes(q) || customerName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleExportCSV = () => {
    const exportData = filtered.map(inv => ({
      invoiceNumber: inv.invoiceNumber,
      customer: customerMap.get(inv.customerId)?.name || "",
      amount: formatDKK(inv.totalAmount),
      issueDate: formatDate(inv.issueDate),
      dueDate: formatDate(inv.dueDate),
      status: getStatusLabel(getDisplayStatus(inv)),
    }));
    downloadCSV(exportData, [
      { key: "invoiceNumber", header: "Fakturanr." },
      { key: "customer", header: "Kunde" },
      { key: "amount", header: "Beløb" },
      { key: "issueDate", header: "Udstedt" },
      { key: "dueDate", header: "Forfald" },
      { key: "status", header: "Status" },
    ], "fakturaer.csv");
  };

  return (
    <div className="space-y-6" data-testid="invoices-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fakturaer</h1>
          <p className="text-muted-foreground">{invoices.length} fakturaer i alt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} data-testid="export-csv-btn">
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søg på fakturanr. eller kundenavn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="invoice-search"
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
        <Table data-testid="invoices-table">
          <TableHeader>
            <TableRow>
              <TableHead>Fakturanr.</TableHead>
              <TableHead>Kunde</TableHead>
              <TableHead className="text-right">Beløb</TableHead>
              <TableHead className="hidden md:table-cell">Udstedt</TableHead>
              <TableHead className="hidden md:table-cell">Forfald</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Ingen fakturaer fundet.</TableCell></TableRow>
            ) : filtered.map((inv) => {
              const displayStatus = getDisplayStatus(inv);
              return (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  data-testid={`invoice-row-${inv.id}`}
                >
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{customerMap.get(inv.customerId)?.name || "—"}</TableCell>
                  <TableCell className="text-right">{formatDKK(inv.totalAmount)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(inv.issueDate)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(inv.dueDate)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(displayStatus)} variant="secondary">
                      {getStatusLabel(displayStatus)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
