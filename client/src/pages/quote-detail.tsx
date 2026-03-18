import { useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { ArrowLeft, Send, Check, XCircle, Briefcase } from "lucide-react";
import { formatDKK, formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import type { Quote, QuoteLine, Customer, Job } from "@shared/schema";

export default function QuoteDetailPage() {
  const [, params] = useRoute("/quotes/:id");
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const quoteId = Number(params?.id);

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/quotes/${quoteId}`],
    enabled: !!quoteId,
  });
  const { data: lines = [] } = useQuery<QuoteLine[]>({
    queryKey: [`/api/quotes/${quoteId}/lines`],
    enabled: !!quoteId,
  });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  const customer = quote ? customers.find(c => c.id === quote.customerId) : null;
  const linkedJob = quote ? jobs.find(j => j.quoteId === quote.id) : null;

  const statusMutation = useMutation({
    mutationFn: (data: { status: string }) =>
      apiRequest("PATCH", `/api/quotes/${quoteId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${quoteId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/quotes/${quoteId}/create-job`),
    onSuccess: async (res) => {
      const job = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Job oprettet fra tilbud" });
      navigate(`/jobs/${job.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="quote-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12" data-testid="quote-not-found">
        <p className="text-muted-foreground">Tilbud ikke fundet</p>
        <Button variant="link" onClick={() => navigate("/quotes")} data-testid="back-to-quotes-link">
          Tilbage til tilbud
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quote-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb data-testid="quote-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/quotes">Tilbud</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{quote.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/quotes")} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{quote.title}</h1>
          <p className="text-muted-foreground">
            Tilbud #{quote.id} —{" "}
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="text-primary hover:underline" data-testid="quote-customer-link">
                {customer.name}
              </Link>
            ) : "Ukendt"}
          </p>
        </div>
        <div className="text-right mr-4">
          <p className="text-2xl font-bold">{formatDKK(quote.totalAmount)}</p>
        </div>
        <Badge className={getStatusColor(quote.status)} variant="secondary">{getStatusLabel(quote.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lines table */}
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
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Ingen linjer på dette tilbud.
                      </TableCell>
                    </TableRow>
                  ) : lines.map(l => (
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

          {/* Timeline */}
          <Card data-testid="quote-timeline-card">
            <CardHeader><CardTitle>Tidslinje</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">Oprettet:</span>
                  <span>{formatDate(quote.createdAt)}</span>
                </div>
                {quote.sentAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Sendt:</span>
                    <span>{formatDate(quote.sentAt)}</span>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Accepteret:</span>
                    <span>{formatDate(quote.acceptedAt)}</span>
                  </div>
                )}
                {quote.status === "rejected" && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Afvist</span>
                  </div>
                )}
                {quote.status === "expired" && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Udløbet</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Info + Actions */}
        <div className="space-y-6">
          <Card data-testid="quote-info-card">
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
              <div><span className="text-muted-foreground">Oprettet:</span> {formatDate(quote.createdAt)}</div>
              {quote.validUntil && <div><span className="text-muted-foreground">Gyldig til:</span> {formatDate(quote.validUntil)}</div>}
              {quote.sentAt && <div><span className="text-muted-foreground">Sendt:</span> {formatDate(quote.sentAt)}</div>}
              {quote.acceptedAt && <div><span className="text-muted-foreground">Accepteret:</span> {formatDate(quote.acceptedAt)}</div>}
              {quote.notes && <div className="p-3 bg-muted rounded-lg mt-2">{quote.notes}</div>}
              {linkedJob && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground">Job:</span>{" "}
                  <Link href={`/jobs/${linkedJob.id}`} className="text-primary hover:underline" data-testid="quote-job-link">
                    {linkedJob.title}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="quote-actions-card">
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {quote.status === "draft" && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate({ status: "sent" }, {
                    onSuccess: () => toast({ title: "Tilbud markeret som sendt" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="mark-sent-btn"
                >
                  <Send className="h-4 w-4 mr-2" />Markér som sendt
                </Button>
              )}
              {quote.status === "sent" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => statusMutation.mutate({ status: "accepted" }, {
                      onSuccess: () => toast({ title: "Tilbud accepteret" }),
                    })}
                    disabled={statusMutation.isPending}
                    data-testid="mark-accepted-btn"
                  >
                    <Check className="h-4 w-4 mr-2" />Markér som accepteret
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => statusMutation.mutate({ status: "rejected" }, {
                      onSuccess: () => toast({ title: "Tilbud afvist" }),
                    })}
                    disabled={statusMutation.isPending}
                    data-testid="mark-rejected-btn"
                  >
                    <XCircle className="h-4 w-4 mr-2" />Markér som afvist
                  </Button>
                </>
              )}
              {quote.status === "accepted" && !linkedJob && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => createJobMutation.mutate()}
                  disabled={createJobMutation.isPending}
                  data-testid="create-job-from-quote-btn"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  {createJobMutation.isPending ? "Opretter..." : "Opret job fra tilbud"}
                </Button>
              )}
              {quote.status === "accepted" && linkedJob && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Job oprettet:{" "}
                  <Link href={`/jobs/${linkedJob.id}`} className="text-primary hover:underline">
                    {linkedJob.title}
                  </Link>
                </p>
              )}
              {(quote.status === "rejected" || quote.status === "expired") && (
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
