import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useHashLocation } from "wouter/use-hash-location";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatDate, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { downloadCSV } from "@/lib/csv-export";
import type { Job, Customer } from "@shared/schema";

const statusFilters = ["all", "planned", "in_progress", "completed", "cancelled"] as const;

const DANISH_MONTHS = [
  "Januar", "Februar", "Marts", "April", "Maj", "Juni",
  "Juli", "August", "September", "Oktober", "November", "December"
];

const DANISH_WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewTab, setViewTab] = useState("liste");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [, navigate] = useHashLocation();

  // Calendar state
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); setDialogOpen(false); },
  });

  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || "Ukendt kunde";

  const filtered = jobs.filter(j => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !j.title.toLowerCase().includes(q) && !getCustomerName(j.customerId).toLowerCase().includes(q)) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      customerId: parseInt(fd.get("customerId") as string),
      description: fd.get("description") as string || null,
      addressLine1: fd.get("addressLine1") as string || null,
      postalCode: fd.get("postalCode") as string || null,
      city: fd.get("city") as string || null,
      scheduledDate: fd.get("scheduledDate") ? new Date(fd.get("scheduledDate") as string).toISOString() : null,
      status: "planned",
    };
    createMutation.mutate(data);
  };

  // Calendar helpers
  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
    else setCalendarMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
    else setCalendarMonth(m => m + 1);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday-based
  };

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfWeek(calendarYear, calendarMonth);

  const getJobsForDate = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return jobs.filter(j => {
      if (!j.scheduledDate) return false;
      const d = new Date(j.scheduledDate);
      const jDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return jDateStr === dateStr;
    });
  };

  const isToday = (day: number) => {
    return calendarYear === today.getFullYear() && calendarMonth === today.getMonth() && day === today.getDate();
  };

  const selectedDateJobs = selectedCalendarDate ? jobs.filter(j => {
    if (!j.scheduledDate) return false;
    const d = new Date(j.scheduledDate);
    const jDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return jDateStr === selectedCalendarDate;
  }) : [];

  return (
    <div className="space-y-6" data-testid="jobs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">{jobs.length} jobs i alt</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const exportData = filtered.map(j => ({
              title: j.title,
              customer: getCustomerName(j.customerId),
              date: formatDate(j.scheduledDate),
              address: [j.addressLine1, j.postalCode, j.city].filter(Boolean).join(", "),
              status: getStatusLabel(j.status),
            }));
            downloadCSV(exportData, [
              { key: "title", header: "Titel" },
              { key: "customer", header: "Kunde" },
              { key: "date", header: "Dato" },
              { key: "address", header: "Adresse" },
              { key: "status", header: "Status" },
            ], "jobs.csv");
          }} data-testid="export-csv-btn">
            <Download className="h-4 w-4 mr-2" />CSV
          </Button>
          <Button onClick={() => setDialogOpen(true)} data-testid="add-job-btn">
            <Plus className="h-4 w-4 mr-2" />Opret job
          </Button>
        </div>
      </div>

      {/* View tabs: Liste | Kalender */}
      <Tabs value={viewTab} onValueChange={setViewTab} data-testid="view-tabs">
        <TabsList>
          <TabsTrigger value="liste" data-testid="list-tab">Liste</TabsTrigger>
          <TabsTrigger value="kalender" data-testid="calendar-tab">Kalender</TabsTrigger>
        </TabsList>

        <TabsContent value="liste" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg i jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="job-search"
              />
            </div>
            <Tabs value={statusFilter} onValueChange={setStatusFilter} data-testid="job-status-tabs">
              <TabsList>
                <TabsTrigger value="all">Alle</TabsTrigger>
                <TabsTrigger value="planned">Planlagt</TabsTrigger>
                <TabsTrigger value="in_progress">I gang</TabsTrigger>
                <TabsTrigger value="completed">Afsluttet</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card>
            <Table data-testid="jobs-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead className="hidden md:table-cell">Kunde</TableHead>
                  <TableHead className="hidden md:table-cell">Dato</TableHead>
                  <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Ingen jobs fundet.</TableCell></TableRow>
                ) : filtered.map(j => (
                  <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/jobs/${j.id}`)} data-testid={`job-row-${j.id}`}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{getCustomerName(j.customerId)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(j.scheduledDate)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{j.addressLine1 ? `${j.addressLine1}, ${j.city}` : "—"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(j.status)} variant="secondary">{getStatusLabel(j.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="kalender" className="mt-4">
          <Card data-testid="calendar-view">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth} data-testid="calendar-prev">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle data-testid="calendar-month-label">
                  {DANISH_MONTHS[calendarMonth]} {calendarYear}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="calendar-next">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DANISH_WEEKDAYS.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 md:h-24" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayJobs = getJobsForDate(day);
                  const isSelected = selectedCalendarDate === dateStr;
                  return (
                    <div
                      key={day}
                      className={`h-20 md:h-24 border rounded-lg p-1 cursor-pointer transition-colors ${
                        isToday(day) ? "border-primary bg-primary/5" : "border-border"
                      } ${isSelected ? "ring-2 ring-primary" : ""} hover:bg-muted/50`}
                      onClick={() => setSelectedCalendarDate(isSelected ? null : dateStr)}
                      data-testid={`calendar-day-${day}`}
                    >
                      <div className={`text-xs font-medium ${isToday(day) ? "text-primary" : ""}`}>{day}</div>
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayJobs.slice(0, 2).map(j => (
                          <div
                            key={j.id}
                            className={`text-[10px] md:text-xs px-1 py-0.5 rounded truncate cursor-pointer ${getStatusColor(j.status)}`}
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${j.id}`); }}
                            data-testid={`calendar-job-${j.id}`}
                          >
                            {j.title.length > 15 ? j.title.slice(0, 15) + "…" : j.title}
                          </div>
                        ))}
                        {dayJobs.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">+{dayJobs.length - 2} mere</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected date jobs */}
              {selectedCalendarDate && (
                <div className="mt-4 border-t pt-4" data-testid="selected-date-jobs">
                  <h3 className="text-sm font-medium mb-2">
                    Jobs d. {selectedCalendarDate.split("-").reverse().join("/")}
                  </h3>
                  {selectedDateJobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ingen jobs denne dag.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateJobs.map(j => (
                        <div
                          key={j.id}
                          className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/jobs/${j.id}`)}
                          data-testid={`selected-job-${j.id}`}
                        >
                          <div>
                            <p className="text-sm font-medium">{j.title}</p>
                            <p className="text-xs text-muted-foreground">{getCustomerName(j.customerId)}</p>
                          </div>
                          <Badge className={getStatusColor(j.status)} variant="secondary">{getStatusLabel(j.status)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="job-dialog">
          <DialogHeader><DialogTitle>Opret job</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required data-testid="job-title-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerId">Kunde *</Label>
              <select name="customerId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="job-customer-select">
                <option value="">Vælg kunde...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea id="description" name="description" data-testid="job-description-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Planlagt dato</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" data-testid="job-date-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input id="addressLine1" name="addressLine1" data-testid="job-address-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnr.</Label>
                <Input id="postalCode" name="postalCode" data-testid="job-postal-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">By</Label>
                <Input id="city" name="city" data-testid="job-city-input" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="cancel-job-btn">Annuller</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="save-job-btn">
                {createMutation.isPending ? "Opretter..." : "Opret"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
