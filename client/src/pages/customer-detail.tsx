import { useState } from "react";
import { useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { ArrowLeft, Phone, Mail, MapPin, Edit } from "lucide-react";
import { formatDate, formatDKK, getStatusLabel, getStatusColor } from "@/lib/formatters";
import type { Customer, Quote, Job, Communication } from "@shared/schema";

export default function CustomerDetailPage() {
  const [, params] = useRoute("/customers/:id");
  const [, navigate] = useHashLocation();
  const customerId = Number(params?.id);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tilbud");

  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });
  const { data: customerQuotes = [] } = useQuery<Quote[]>({
    queryKey: [`/api/customers/${customerId}/quotes`],
    enabled: !!customerId,
  });
  const { data: customerJobs = [] } = useQuery<Job[]>({
    queryKey: [`/api/customers/${customerId}/jobs`],
    enabled: !!customerId,
  });
  const { data: communications = [] } = useQuery<Communication[]>({
    queryKey: [`/api/customers/${customerId}/communications`],
    enabled: !!customerId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/customers/${customerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/customers/${customerId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditDialogOpen(false);
    },
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      name: fd.get("name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      addressLine1: fd.get("addressLine1") as string || null,
      postalCode: fd.get("postalCode") as string || null,
      city: fd.get("city") as string || null,
      cvr: fd.get("cvr") as string || null,
      notes: fd.get("notes") as string || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="customer-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12" data-testid="customer-not-found">
        <p className="text-muted-foreground">Kunde ikke fundet</p>
        <Button variant="link" onClick={() => navigate("/customers")} data-testid="back-to-customers-link">
          Tilbage til kunder
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="customer-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb data-testid="customer-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/customers">Kunder</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{customer.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">Kunde #{customer.id}</p>
        </div>
        <Button variant="outline" onClick={() => setEditDialogOpen(true)} data-testid="edit-customer-btn">
          <Edit className="h-4 w-4 mr-2" />Redigér
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact info card */}
        <Card data-testid="customer-info-card">
          <CardHeader><CardTitle>Kontaktoplysninger</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />{customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />{customer.phone}
              </div>
            )}
            {customer.addressLine1 && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {customer.addressLine1}, {customer.postalCode} {customer.city}
              </div>
            )}
            {customer.cvr && (
              <div className="text-sm text-muted-foreground">CVR: {customer.cvr}</div>
            )}
            {customer.tags && customer.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {customer.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
            {customer.notes && (
              <div className="text-sm mt-2 p-3 bg-muted rounded-lg">{customer.notes}</div>
            )}
          </CardContent>
        </Card>

        {/* Tabs section */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="customer-tabs">
            <TabsList>
              <TabsTrigger value="tilbud" data-testid="customer-quotes-tab">Tilbud ({customerQuotes.length})</TabsTrigger>
              <TabsTrigger value="jobs" data-testid="customer-jobs-tab">Jobs ({customerJobs.length})</TabsTrigger>
              <TabsTrigger value="kommunikation" data-testid="customer-comms-tab">Kommunikation ({communications.length})</TabsTrigger>
              <TabsTrigger value="notater" data-testid="customer-notes-tab">Notater</TabsTrigger>
            </TabsList>

            <TabsContent value="tilbud" className="mt-4">
              <Card data-testid="customer-quotes-card">
                <CardContent className="pt-6">
                  {customerQuotes.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Ingen tilbud for denne kunde.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead className="text-right">Beløb</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Dato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerQuotes.map(q => (
                          <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/quotes/${q.id}`)} data-testid={`customer-quote-row-${q.id}`}>
                            <TableCell className="font-medium">{q.title}</TableCell>
                            <TableCell className="text-right">{formatDKK(q.totalAmount)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(q.status)} variant="secondary">{getStatusLabel(q.status)}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(q.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs" className="mt-4">
              <Card data-testid="customer-jobs-card">
                <CardContent className="pt-6">
                  {customerJobs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Ingen jobs for denne kunde.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Dato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerJobs.map(j => (
                          <TableRow key={j.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/jobs/${j.id}`)} data-testid={`customer-job-row-${j.id}`}>
                            <TableCell className="font-medium">{j.title}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(j.status)} variant="secondary">{getStatusLabel(j.status)}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{formatDate(j.scheduledDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kommunikation" className="mt-4">
              <Card data-testid="customer-comms-card">
                <CardContent className="pt-6">
                  {communications.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Ingen kommunikation logget for denne kunde.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Retning</TableHead>
                          <TableHead>Emne</TableHead>
                          <TableHead className="hidden md:table-cell">Dato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {communications.map(c => (
                          <TableRow key={c.id} data-testid={`comm-row-${c.id}`}>
                            <TableCell>
                              <Badge variant="secondary">
                                {c.type === "email" ? "Email" : c.type === "phone" ? "Telefon" : c.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {c.direction === "inbound" ? "Indgående" : "Udgående"}
                            </TableCell>
                            <TableCell className="font-medium text-sm">{c.subject || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{formatDate(c.sentAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notater" className="mt-4">
              <Card data-testid="customer-notes-card">
                <CardContent className="pt-6">
                  {customer.notes ? (
                    <div className="p-4 bg-muted rounded-lg text-sm">{customer.notes}</div>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-8">Ingen notater for denne kunde.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md" data-testid="customer-edit-dialog">
          <DialogHeader>
            <DialogTitle>Redigér kunde</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" name="name" required defaultValue={customer.name} data-testid="customer-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={customer.email || ""} data-testid="customer-email-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" defaultValue={customer.phone || ""} data-testid="customer-phone-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Adresse</Label>
              <Input id="addressLine1" name="addressLine1" defaultValue={customer.addressLine1 || ""} data-testid="customer-address-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnr.</Label>
                <Input id="postalCode" name="postalCode" defaultValue={customer.postalCode || ""} data-testid="customer-postal-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">By</Label>
                <Input id="city" name="city" defaultValue={customer.city || ""} data-testid="customer-city-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvr">CVR-nummer</Label>
              <Input id="cvr" name="cvr" defaultValue={customer.cvr || ""} data-testid="customer-cvr-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Noter</Label>
              <Textarea id="notes" name="notes" defaultValue={customer.notes || ""} data-testid="customer-notes-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="cancel-edit-btn">Annuller</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="save-customer-btn">
                {updateMutation.isPending ? "Gemmer..." : "Gem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
