import { useState } from "react";
import { useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { ArrowLeft, Send, CreditCard, Bell, XCircle } from "lucide-react";
import { formatDKK, formatDate, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Job, InvoiceLine, PaymentReminder } from "@shared/schema";

interface InvoiceWithDetails {
  id: number;
  jobId: number | null;
  customerId: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAt: string | null;
  paidAmount: number | null;
  reminderCount: number;
  lastReminderAt: string | null;
  notes: string | null;
  createdAt: string;
  lines: InvoiceLine[];
  reminders: PaymentReminder[];
}

export default function InvoiceDetailPage() {
  const [, params] = useRoute("/invoices/:id");
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const invoiceId = Number(params?.id);

  const [payDialogOpen, setPayDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery<InvoiceWithDetails>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  const customer = invoice ? customers.find(c => c.id === invoice.customerId) : null;
  const linkedJob = invoice?.jobId ? jobs.find(j => j.id === invoice.jobId) : null;

  const getDisplayStatus = () => {
    if (!invoice) return "";
    if (invoice.status === "sent" && new Date(invoice.dueDate) < new Date()) return "overdue";
    return invoice.status;
  };

  const statusMutation = useMutation({
    mutationFn: (data: { status: string }) =>
      apiRequest("PATCH", `/api/invoices/${invoiceId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const payMutation = useMutation({
    mutationFn: (data: { amount: number; date: string }) =>
      apiRequest("POST", `/api/invoices/${invoiceId}/pay`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setPayDialogOpen(false);
      toast({ title: "Betaling registreret" });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invoices/${invoiceId}/reminder`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Rykker sendt" });
    },
  });

  const handlePay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    payMutation.mutate({
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="invoice-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12" data-testid="invoice-not-found">
        <p className="text-muted-foreground">Faktura ikke fundet</p>
        <Button variant="link" onClick={() => navigate("/invoices")} data-testid="back-to-invoices-link">
          Tilbage til fakturaer
        </Button>
      </div>
    );
  }

  const displayStatus = getDisplayStatus();

  return (
    <div className="space-y-6" data-testid="invoice-detail-page">
      <Breadcrumb data-testid="invoice-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/invoices">Fakturaer</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{invoice.invoiceNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="text-primary hover:underline" data-testid="invoice-customer-link">
                {customer.name}
              </Link>
            ) : "Ukendt kunde"}
          </p>
        </div>
        <div className="text-right mr-4">
          <p className="text-2xl font-bold">{formatDKK(invoice.totalAmount)}</p>
        </div>
        <Badge className={getStatusColor(displayStatus)} variant="secondary">
          {getStatusLabel(displayStatus)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Lines table */}
          <Card data-testid="invoice-lines-card">
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
                  {(invoice.lines?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Ingen linjer.
                      </TableCell>
                    </TableRow>
                  ) : invoice.lines.map(l => (
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
                  <p className="text-2xl font-bold">{formatDKK(invoice.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders section */}
          {(invoice.reminders?.length ?? 0) > 0 && (
            <Card data-testid="invoice-reminders-card">
              <CardHeader><CardTitle>Rykkere</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.reminders.map(r => (
                    <div key={r.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>Rykker {r.reminderNumber} — sendt {formatDate(r.sentAt)}</span>
                      <Badge variant="secondary" className="text-xs">{r.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card data-testid="invoice-timeline-card">
            <CardHeader><CardTitle>Tidslinje</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">Oprettet:</span>
                  <span>{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Udstedt:</span>
                  <span>{formatDate(invoice.issueDate)}</span>
                </div>
                {invoice.status !== "draft" && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Sendt</span>
                  </div>
                )}
                {invoice.reminders?.map(r => (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Rykker {r.reminderNumber}:</span>
                    <span>{formatDate(r.sentAt)}</span>
                  </div>
                ))}
                {invoice.paidAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Betalt:</span>
                    <span>{formatDate(invoice.paidAt)}</span>
                  </div>
                )}
                {invoice.status === "cancelled" && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Annulleret</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card data-testid="invoice-info-card">
            <CardHeader><CardTitle>Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Kunde:</span>{" "}
                {customer ? (
                  <Link href={`/customers/${customer.id}`} className="text-primary hover:underline">
                    {customer.name}
                  </Link>
                ) : "Ukendt"}
              </div>
              <div><span className="text-muted-foreground">Udstedt:</span> {formatDate(invoice.issueDate)}</div>
              <div><span className="text-muted-foreground">Forfald:</span> {formatDate(invoice.dueDate)}</div>
              <div><span className="text-muted-foreground">Betalingsfrist:</span> 14 dage</div>
              {linkedJob && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Job:</span>{" "}
                  <Link href={`/jobs/${linkedJob.id}`} className="text-primary hover:underline" data-testid="invoice-job-link">
                    {linkedJob.title}
                  </Link>
                </div>
              )}
              {invoice.notes && <div className="p-3 bg-muted rounded-lg mt-2">{invoice.notes}</div>}
            </CardContent>
          </Card>

          <Card data-testid="invoice-actions-card">
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {invoice.status === "draft" && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate({ status: "sent" }, {
                    onSuccess: () => toast({ title: "Faktura markeret som sendt" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="mark-sent-btn"
                >
                  <Send className="h-4 w-4 mr-2" />Markér som sendt
                </Button>
              )}
              {(displayStatus === "sent" || displayStatus === "overdue") && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => setPayDialogOpen(true)}
                    data-testid="register-payment-btn"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />Registrér betaling
                  </Button>
                  {invoice.reminderCount < 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => reminderMutation.mutate()}
                      disabled={reminderMutation.isPending}
                      data-testid="send-reminder-btn"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      {reminderMutation.isPending ? "Sender..." : `Send rykker (${invoice.reminderCount}/3)`}
                    </Button>
                  )}
                </>
              )}
              {invoice.status !== "cancelled" && invoice.status !== "paid" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ status: "cancelled" }, {
                    onSuccess: () => toast({ title: "Faktura annulleret" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="cancel-invoice-btn"
                >
                  <XCircle className="h-4 w-4 mr-2" />Annullér faktura
                </Button>
              )}
              {invoice.status === "paid" && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Betalt {formatDate(invoice.paidAt)} — {formatDKK(invoice.paidAmount ?? invoice.totalAmount)}
                </p>
              )}
              {invoice.status === "cancelled" && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Fakturaen er annulleret.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent data-testid="payment-dialog">
          <DialogHeader>
            <DialogTitle>Registrér betaling</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Beløb (DKK)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                defaultValue={invoice.totalAmount}
                required
                data-testid="payment-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Betalingsdato</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                data-testid="payment-date-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayDialogOpen(false)} data-testid="payment-cancel-btn">
                Annuller
              </Button>
              <Button type="submit" disabled={payMutation.isPending} data-testid="payment-confirm-btn">
                {payMutation.isPending ? "Registrerer..." : "Bekræft betaling"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
