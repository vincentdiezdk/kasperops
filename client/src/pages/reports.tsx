import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  BarChart3,
  Briefcase,
  Target,
  Users,
  FileCheck,
  Wallet,
  Clock,
} from "lucide-react";
import { formatDKK } from "@/lib/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface ReportsStats {
  totalRevenue: number;
  avgJobValue: number;
  completedJobs: number;
  quoteAcceptRate: number;
  newCustomers: number;
  activeAgreements: number;
  outstandingAmount: number;
  avgPaymentDays: number;
  revenueByMonth: { month: string; shortMonth: string; revenue: number }[];
  topCustomers: { name: string; revenue: number; jobCount: number }[];
  popularServices: { name: string; count: number; revenue: number }[];
  revenueByCategory: { name: string; value: number }[];
  jobsPerMonth: { month: string; count: number }[];
  leadFunnel: { leads: number; quoteSent: number; accepted: number; completed: number };
}

const PERIODS = [
  { value: "this_month", label: "Denne måned" },
  { value: "last_month", label: "Sidste måned" },
  { value: "last_3_months", label: "Sidste 3 måneder" },
  { value: "this_year", label: "I år" },
  { value: "all", label: "Alt" },
];

const PIE_COLORS = ["#2d6a2d", "#4a9e4a", "#6bc46b", "#8fd48f", "#b3e5b3", "#d4f0d4"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("all");

  const { data: stats } = useQuery<ReportsStats>({
    queryKey: [`/api/reports/stats?period=${period}`],
  });

  // Compute cumulative revenue for the line overlay
  const cumulativeData = stats?.revenueByMonth?.map((item, idx) => {
    const cumulative = stats.revenueByMonth.slice(0, idx + 1).reduce((s, i) => s + i.revenue, 0);
    return { ...item, cumulative };
  }) || [];

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapporter</h1>
          <p className="text-muted-foreground">Overblik over forretningens nøgletal</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid="period-selector"
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="kpi-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Samlet omsætning</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDKK(stats?.totalRevenue ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-avg-job-value">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gns. jobværdi</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDKK(stats?.avgJobValue ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-completed-jobs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Afsluttede jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedJobs ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-quote-accept-rate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tilbuds-acceptrate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.quoteAcceptRate ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="kpi-new-customers">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nye kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newCustomers ?? 0}</div>
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
        <Card data-testid="kpi-outstanding">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Udestående beløb</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDKK(stats?.outstandingAmount ?? 0)}</div>
          </CardContent>
        </Card>
        <Card data-testid="kpi-avg-payment-days">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gns. betalingstid</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgPaymentDays ?? 0} dage</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart with Cumulative Line */}
      <Card data-testid="revenue-chart">
        <CardHeader>
          <CardTitle>Omsætning pr. måned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="shortMonth" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatDKK(value), name === "revenue" ? "Omsætning" : "Kumulativ"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Legend formatter={(value) => value === "revenue" ? "Omsætning" : "Kumulativ"} />
                <Bar yAxisId="left" dataKey="revenue" fill="#2d6a2d" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#4a9e4a" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="top-customers-table">
          <CardHeader>
            <CardTitle>Top kunder</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.topCustomers?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Ingen data for perioden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Omsætning</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.topCustomers?.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{formatDKK(c.revenue)}</TableCell>
                      <TableCell className="text-right">{c.jobCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card data-testid="popular-services-table">
          <CardHeader>
            <CardTitle>Populære ydelser</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats?.popularServices?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Ingen data for perioden</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ydelse</TableHead>
                    <TableHead className="text-right">Antal</TableHead>
                    <TableHead className="text-right">Omsætning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.popularServices?.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right">{formatDKK(s.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Category Pie */}
        <Card data-testid="revenue-category-chart">
          <CardHeader>
            <CardTitle>Omsætning pr. kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.revenueByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(stats?.revenueByCategory || []).map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatDKK(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Jobs per Month */}
        <Card data-testid="jobs-per-month-chart">
          <CardHeader>
            <CardTitle>Jobs pr. måned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.jobsPerMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Jobs"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="count" fill="#4a9e4a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lead Conversion Funnel */}
      <Card data-testid="lead-funnel-chart">
        <CardHeader>
          <CardTitle>Lead konverteringstragt</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.leadFunnel && (
            <div className="space-y-3">
              {[
                { label: "Leads i alt", value: stats.leadFunnel.leads, color: "bg-blue-500" },
                { label: "Tilbud sendt", value: stats.leadFunnel.quoteSent, color: "bg-orange-500" },
                { label: "Accepteret", value: stats.leadFunnel.accepted, color: "bg-green-500" },
                { label: "Afsluttet", value: stats.leadFunnel.completed, color: "bg-emerald-600" },
              ].map((step, idx) => {
                const maxValue = stats.leadFunnel!.leads || 1;
                const pct = Math.round((step.value / maxValue) * 100);
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-sm w-32 text-right font-medium">{step.label}</span>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${step.color} rounded-lg transition-all flex items-center px-3`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        <span className="text-white text-xs font-bold">{step.value}</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-12">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
