import { useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { ArrowLeft, Pause, Play, XCircle, Calendar, RefreshCw } from "lucide-react";
import { formatDKK, formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import type { ServiceAgreement, Customer, Job } from "@shared/schema";

const frequencyLabels: Record<string, string> = {
  monthly: "Månedlig",
  quarterly: "Kvartalsvis",
  biannual: "Halvårlig",
  annual: "Årlig",
};

function getUpcomingDates(agreement: ServiceAgreement): Date[] {
  if (!agreement.nextServiceDate || agreement.status !== "active") return [];
  const dates: Date[] = [];
  const start = new Date(agreement.nextServiceDate);
  const freqMonths: Record<string, number> = { monthly: 1, quarterly: 3, biannual: 6, annual: 12 };
  const months = freqMonths[agreement.frequency] || 3;
  for (let i = 0; i < 4; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + months * i);
    if (agreement.endDate && d > new Date(agreement.endDate)) break;
    dates.push(d);
  }
  return dates;
}

export default function AgreementDetailPage() {
  const [, params] = useRoute("/agreements/:id");
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const agreementId = Number(params?.id);

  const { data: agreement, isLoading } = useQuery<ServiceAgreement>({
    queryKey: [`/api/agreements/${agreementId}`],
    enabled: !!agreementId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  const customer = agreement ? customers.find(c => c.id === agreement.customerId) : null;
  const relatedJobs = agreement ? jobs.filter(j => j.customerId === agreement.customerId) : [];

  const statusMutation = useMutation({
    mutationFn: (data: { status: string }) =>
      apiRequest("PATCH", `/api/agreements/${agreementId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/agreements/${agreementId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/agreements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="agreement-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12" data-testid="agreement-not-found">
        <p className="text-muted-foreground">Aftale ikke fundet</p>
        <Button variant="link" onClick={() => navigate("/agreements")} data-testid="back-to-agreements-link">
          Tilbage til aftaler
        </Button>
      </div>
    );
  }

  const upcomingDates = getUpcomingDates(agreement);

  return (
    <div className="space-y-6" data-testid="agreement-detail-page">
      <Breadcrumb data-testid="agreement-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/agreements">Aftaler</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{agreement.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agreements")} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agreement.title}</h1>
          <p className="text-muted-foreground">
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="text-primary hover:underline" data-testid="agreement-customer-link">
                {customer.name}
              </Link>
            ) : "Ukendt kunde"}
          </p>
        </div>
        <Badge className={getStatusColor(agreement.status)} variant="secondary">
          {getStatusLabel(agreement.status)}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Agreement info */}
          <Card data-testid="agreement-info-card">
            <CardHeader><CardTitle>Detaljer</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              {agreement.description && <p>{agreement.description}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Frekvens:</span>{" "}
                  {frequencyLabels[agreement.frequency] || agreement.frequency}
                </div>
                <div>
                  <span className="text-muted-foreground">Pris/besøg:</span>{" "}
                  {formatDKK(agreement.pricePerVisit)}
                </div>
                <div>
                  <span className="text-muted-foreground">Startdato:</span>{" "}
                  {formatDate(agreement.startDate)}
                </div>
                <div>
                  <span className="text-muted-foreground">Slutdato:</span>{" "}
                  {agreement.endDate ? formatDate(agreement.endDate) : "Ingen"}
                </div>
              </div>
              {agreement.notes && (
                <div className="p-3 bg-muted rounded-lg">{agreement.notes}</div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming service dates */}
          <Card data-testid="agreement-upcoming-card">
            <CardHeader><CardTitle>Kommende servicedatoer</CardTitle></CardHeader>
            <CardContent>
              {upcomingDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen kommende servicedatoer.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDates.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(d)}</span>
                      {i === 0 && <Badge variant="secondary" className="text-xs">Næste</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related jobs */}
          <Card data-testid="agreement-jobs-card">
            <CardHeader><CardTitle>Relaterede jobs</CardTitle></CardHeader>
            <CardContent>
              {relatedJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen relaterede jobs.</p>
              ) : (
                <div className="space-y-3">
                  {relatedJobs.slice(-5).reverse().map(j => (
                    <div key={j.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <Link href={`/jobs/${j.id}`} className="text-sm font-medium text-primary hover:underline">
                          {j.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(j.scheduledDate)}</p>
                      </div>
                      <Badge className={getStatusColor(j.status)} variant="secondary">
                        {getStatusLabel(j.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <Card data-testid="agreement-actions-card">
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {agreement.status === "active" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ status: "paused" }, {
                    onSuccess: () => toast({ title: "Aftale pauseret" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="pause-agreement-btn"
                >
                  <Pause className="h-4 w-4 mr-2" />Pausér
                </Button>
              )}
              {agreement.status === "paused" && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => statusMutation.mutate({ status: "active" }, {
                    onSuccess: () => toast({ title: "Aftale genoptaget" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="resume-agreement-btn"
                >
                  <Play className="h-4 w-4 mr-2" />Genoptag
                </Button>
              )}
              {agreement.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => statusMutation.mutate({ status: "cancelled" }, {
                    onSuccess: () => toast({ title: "Aftale annulleret" }),
                  })}
                  disabled={statusMutation.isPending}
                  data-testid="cancel-agreement-btn"
                >
                  <XCircle className="h-4 w-4 mr-2" />Annullér
                </Button>
              )}
              {agreement.status === "cancelled" && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aftalen er annulleret.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
