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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, ArrowLeft, MapPin, Calendar, Play, CheckCircle, XCircle } from "lucide-react";
import { formatDate, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/formatters";
import type { Job, Customer } from "@shared/schema";

const statusFilters = ["all", "planned", "in_progress", "completed", "cancelled"] as const;

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: jobs = [] } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/jobs/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] }); },
  });

  const getCustomerName = (id: number) => customers.find(c => c.id === id)?.name || "Ukendt kunde";

  const filtered = jobs.filter(j => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !j.title.toLowerCase().includes(q) && !getCustomerName(j.customerId).toLowerCase().includes(q)) return false;
    return true;
  });

  const selectedJob = selectedJobId ? jobs.find(j => j.id === selectedJobId) : null;

  const handleStatusChange = (jobId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "in_progress") updates.startedAt = new Date().toISOString();
    if (newStatus === "completed") updates.completedAt = new Date().toISOString();
    updateMutation.mutate({ id: jobId, data: updates });
  };

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

  if (selectedJob) {
    const customer = customers.find(c => c.id === selectedJob.customerId);
    return (
      <div className="space-y-6" data-testid="job-detail-page">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedJobId(null)} data-testid="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selectedJob.title}</h1>
            <p className="text-muted-foreground">Job #{selectedJob.id} — {getCustomerName(selectedJob.customerId)}</p>
          </div>
          <Badge className={getStatusColor(selectedJob.status)} variant="secondary">
            {getStatusLabel(selectedJob.status)}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-testid="job-info-card">
            <CardHeader><CardTitle>Detaljer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {selectedJob.description && <p className="text-sm">{selectedJob.description}</p>}
              {selectedJob.addressLine1 && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selectedJob.addressLine1}, {selectedJob.postalCode} {selectedJob.city}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Planlagt: {formatDate(selectedJob.scheduledDate)}
              </div>
              {selectedJob.startedAt && (
                <p className="text-sm text-muted-foreground">Startet: {formatDateTime(selectedJob.startedAt)}</p>
              )}
              {selectedJob.completedAt && (
                <p className="text-sm text-muted-foreground">Afsluttet: {formatDateTime(selectedJob.completedAt)}</p>
              )}
              {selectedJob.completionNotes && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Afslutningsnoter:</p>
                  {selectedJob.completionNotes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="job-actions-card">
            <CardHeader><CardTitle>Handlinger</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedJob.status === "planned" && (
                <Button className="w-full" onClick={() => handleStatusChange(selectedJob.id, "in_progress")} data-testid="start-job-btn">
                  <Play className="h-4 w-4 mr-2" />Start job
                </Button>
              )}
              {selectedJob.status === "in_progress" && (
                <>
                  <Button className="w-full" onClick={() => handleStatusChange(selectedJob.id, "completed")} data-testid="complete-job-btn">
                    <CheckCircle className="h-4 w-4 mr-2" />Markér som afsluttet
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => handleStatusChange(selectedJob.id, "cancelled")} data-testid="cancel-job-btn">
                    <XCircle className="h-4 w-4 mr-2" />Annuller job
                  </Button>
                </>
              )}
              {(selectedJob.status === "completed" || selectedJob.status === "cancelled") && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Dette job er {getStatusLabel(selectedJob.status).toLowerCase()}.
                </p>
              )}

              {customer && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Kunde</h4>
                  <p className="text-sm">{customer.name}</p>
                  {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
                  {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="jobs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">{jobs.length} jobs i alt</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="add-job-btn">
          <Plus className="h-4 w-4 mr-2" />Opret job
        </Button>
      </div>

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
              <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedJobId(j.id)} data-testid={`job-row-${j.id}`}>
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
