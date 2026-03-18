import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Receipt, TrendingUp, AlertTriangle, BarChart3, FileCheck, Wallet } from "lucide-react";
import { formatDKK, formatDate, getGreeting, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Job, Quote, Invoice } from "@shared/schema";

interface DashboardStats {
  todaysJobs: number;
  openQuotes: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthRevenue: number;
  acceptRate: number;
  activeAgreements: number;
  outstandingAmount: number;
  revenueChart: { month: string; revenue: number }[];
  todaysJobsList: Job[];
}

export default function Dashboard() {
  const { data: stats } = useQuery<DashboardStats>({ queryKey: ["/api/dashboard/stats"] });

  const { data: quotes } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });
  const { data: jobs } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: invoices } = useQuery<Invoice[]>({ queryKey: ["/api/invoices"] });

  const recentQuotes = quotes?.slice(-3).reverse() || [];
  const recentJobs = jobs?.slice(-3).reverse() || [];
  const recentInvoices = invoices?.slice(-3).reverse() || [];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold" data-testid="dashboard-greeting">
          {getGreeting()}, Kasper
        </h1>
        <p className="text-muted-foreground">Her er dit overblik for i dag.</p>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="kpi-todays-jobs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dagens jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todaysJobs ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-open-quotes">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Åbne tilbud</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openQuotes ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-pending-invoices">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventende fakturaer</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingInvoices ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-overdue-invoices">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forfalden</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${(stats?.overdueInvoices ?? 0) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.overdueInvoices ?? 0) > 0 ? "text-red-600" : ""}`}>
              {stats?.overdueInvoices ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="kpi-month-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Måneds-omsætning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDKK(stats?.monthRevenue ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-accept-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tilbuds-acceptrate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.acceptRate ?? 0}%</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-active-agreements">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive serviceaftaler</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAgreements ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-outstanding-amount">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Udestående beløb</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDKK(stats?.outstandingAmount ?? 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card data-testid="revenue-chart">
        <CardHeader>
          <CardTitle>Omsætning — sidste 6 måneder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueChart || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatDKK(value), "Omsætning"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="revenue" fill="#2d6a2d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Jobs */}
        <Card data-testid="todays-jobs-list">
          <CardHeader>
            <CardTitle>Dagens jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.todaysJobsList?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">Ingen jobs planlagt i dag.</p>
            ) : (
              <div className="space-y-3">
                {stats?.todaysJobsList?.map((job) => (
                  <div key={job.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.addressLine1}, {job.postalCode} {job.city}</p>
                    </div>
                    <Badge className={getStatusColor(job.status)} variant="secondary">
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card data-testid="recent-activity">
          <CardHeader>
            <CardTitle>Seneste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map((inv) => (
                <div key={`inv-${inv.id}`} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">Faktura: {inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDKK(inv.totalAmount)} — {formatDate(inv.issueDate)}</p>
                  </div>
                  <Badge className={getStatusColor(inv.status)} variant="secondary">
                    {getStatusLabel(inv.status)}
                  </Badge>
                </div>
              ))}
              {recentQuotes.map((q) => (
                <div key={`q-${q.id}`} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">Tilbud: {q.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDKK(q.totalAmount)} — {formatDate(q.createdAt)}</p>
                  </div>
                  <Badge className={getStatusColor(q.status)} variant="secondary">
                    {getStatusLabel(q.status)}
                  </Badge>
                </div>
              ))}
              {recentJobs.map((j) => (
                <div key={`j-${j.id}`} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm">Job: {j.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(j.scheduledDate)}</p>
                  </div>
                  <Badge className={getStatusColor(j.status)} variant="secondary">
                    {getStatusLabel(j.status)}
                  </Badge>
                </div>
              ))}
              {recentQuotes.length === 0 && recentJobs.length === 0 && recentInvoices.length === 0 && (
                <p className="text-muted-foreground text-sm">Ingen seneste aktivitet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
