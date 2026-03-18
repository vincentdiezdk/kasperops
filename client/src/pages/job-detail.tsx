import { useState, useRef } from "react";
import { useRoute } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "wouter";
import { ArrowLeft, MapPin, Calendar, Play, CheckCircle, XCircle, Upload, Trash2, Camera, FileText } from "lucide-react";
import { formatDate, formatDateTime, getStatusLabel, getStatusColor } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import type { Job, Customer, JobPhoto, Quote } from "@shared/schema";

export default function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const jobId = Number(params?.id);

  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");

  const beforeRef = useRef<HTMLInputElement>(null);
  const duringRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const { data: job, isLoading: jobLoading } = useQuery<Job>({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  const { data: customers = [] } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });
  const { data: photos = [] } = useQuery<JobPhoto[]>({
    queryKey: [`/api/jobs/${jobId}/photos`],
    enabled: !!jobId,
  });
  const { data: quotes = [] } = useQuery<Quote[]>({ queryKey: ["/api/quotes"] });

  const customer = job ? customers.find(c => c.id === job.customerId) : null;
  const linkedQuote = job?.quoteId ? quotes.find(q => q.id === job.quoteId) : null;

  const beforePhotos = photos.filter(p => p.type === "before");
  const duringPhotos = photos.filter(p => p.type === "during");
  const afterPhotos = photos.filter(p => p.type === "after");

  const canComplete = beforePhotos.length >= 2 && afterPhotos.length >= 2;

  const statusMutation = useMutation({
    mutationFn: (data: { status: string; completionNotes?: string }) =>
      apiRequest("PATCH", `/api/jobs/${jobId}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (data: { type: string; fileName: string; url: string }) =>
      apiRequest("POST", `/api/jobs/${jobId}/photos`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/photos`] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) =>
      apiRequest("DELETE", `/api/jobs/${jobId}/photos/${photoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}/photos`] });
    },
  });

  const handleStartJob = () => {
    statusMutation.mutate({ status: "in_progress" }, {
      onSuccess: () => toast({ title: "Job startet" }),
    });
  };

  const handleCompleteJob = () => {
    statusMutation.mutate(
      { status: "completed", completionNotes: completionNotes || undefined },
      {
        onSuccess: () => {
          setCompletionDialogOpen(false);
          setCompletionNotes("");
          toast({ title: "Job afsluttet" });
        },
      }
    );
  };

  const handleCancelJob = () => {
    statusMutation.mutate({ status: "cancelled" }, {
      onSuccess: () => toast({ title: "Job annulleret" }),
    });
  };

  const handleFileUpload = (type: "before" | "during" | "after", files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        uploadMutation.mutate({
          type,
          fileName: file.name,
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  if (jobLoading) {
    return (
      <div className="space-y-6" data-testid="job-detail-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12" data-testid="job-not-found">
        <p className="text-muted-foreground">Job ikke fundet</p>
        <Button variant="link" onClick={() => navigate("/jobs")} data-testid="back-to-jobs-link">
          Tilbage til jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="job-detail-page">
      {/* Breadcrumb */}
      <Breadcrumb data-testid="job-breadcrumb">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/jobs">Jobs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{job.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/jobs")} data-testid="back-btn">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">
            Job #{job.id} —{" "}
            {customer ? (
              <Link href={`/customers/${customer.id}`} className="text-primary hover:underline" data-testid="job-customer-link">
                {customer.name}
              </Link>
            ) : "Ukendt kunde"}
          </p>
        </div>
        <Badge className={getStatusColor(job.status)} variant="secondary">
          {getStatusLabel(job.status)}
        </Badge>
      </div>

      {/* Status workflow buttons */}
      <div className="flex gap-3 flex-wrap">
        {job.status === "planned" && (
          <Button onClick={handleStartJob} disabled={statusMutation.isPending} data-testid="start-job-btn" className="bg-green-600 hover:bg-green-700">
            <Play className="h-4 w-4 mr-2" />Start job
          </Button>
        )}
        {job.status === "in_progress" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={() => setCompletionDialogOpen(true)}
                    disabled={!canComplete || statusMutation.isPending}
                    data-testid="complete-job-btn"
                    className={canComplete ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />Afslut job
                  </Button>
                </span>
              </TooltipTrigger>
              {!canComplete && (
                <TooltipContent>
                  <p>Upload mindst 2 før-billeder og 2 efter-billeder</p>
                </TooltipContent>
              )}
            </Tooltip>
            <Button variant="destructive" onClick={handleCancelJob} disabled={statusMutation.isPending} data-testid="cancel-job-btn">
              <XCircle className="h-4 w-4 mr-2" />Annuller job
            </Button>
          </>
        )}
        {job.status === "completed" && (
          <div className="text-sm text-muted-foreground py-2">
            Afsluttet: {formatDateTime(job.completedAt)}
          </div>
        )}
        {job.status === "cancelled" && (
          <div className="text-sm text-muted-foreground py-2">
            Dette job er annulleret.
          </div>
        )}
      </div>

      {/* Photo section */}
      <div className="grid gap-6 md:grid-cols-3" data-testid="photo-section">
        {/* Before photos */}
        <Card data-testid="before-photos-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Før-billeder</CardTitle>
              <Badge variant={beforePhotos.length >= 2 ? "default" : "secondary"} className={beforePhotos.length >= 2 ? "bg-green-600" : ""}>
                {beforePhotos.length}/2 {beforePhotos.length >= 2 ? "✓" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {beforePhotos.map(p => (
                <div key={p.id} className="relative group">
                  <img src={p.url} alt={p.fileName} className="w-full h-24 object-cover rounded-lg" />
                  {(job.status === "planned" || job.status === "in_progress") && (
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`delete-photo-${p.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(job.status === "planned" || job.status === "in_progress") && (
              <>
                <input
                  ref={beforeRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload("before", e.target.files)}
                  data-testid="before-photo-input"
                />
                <Button variant="outline" className="w-full" onClick={() => beforeRef.current?.click()} data-testid="upload-before-btn">
                  <Upload className="h-4 w-4 mr-2" />Upload før-billede
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* During photos */}
        <Card data-testid="during-photos-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Under-billeder</CardTitle>
              <Badge variant="secondary">{duringPhotos.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {duringPhotos.map(p => (
                <div key={p.id} className="relative group">
                  <img src={p.url} alt={p.fileName} className="w-full h-24 object-cover rounded-lg" />
                  {(job.status === "planned" || job.status === "in_progress") && (
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`delete-photo-${p.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(job.status === "planned" || job.status === "in_progress") && (
              <>
                <input
                  ref={duringRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload("during", e.target.files)}
                  data-testid="during-photo-input"
                />
                <Button variant="outline" className="w-full" onClick={() => duringRef.current?.click()} data-testid="upload-during-btn">
                  <Upload className="h-4 w-4 mr-2" />Upload under-billede
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* After photos */}
        <Card data-testid="after-photos-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Efter-billeder</CardTitle>
              <Badge variant={afterPhotos.length >= 2 ? "default" : "secondary"} className={afterPhotos.length >= 2 ? "bg-green-600" : ""}>
                {afterPhotos.length}/2 {afterPhotos.length >= 2 ? "✓" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {afterPhotos.map(p => (
                <div key={p.id} className="relative group">
                  <img src={p.url} alt={p.fileName} className="w-full h-24 object-cover rounded-lg" />
                  {(job.status === "planned" || job.status === "in_progress") && (
                    <button
                      onClick={() => deleteMutation.mutate(p.id)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`delete-photo-${p.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(job.status === "planned" || job.status === "in_progress") && (
              <>
                <input
                  ref={afterRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => handleFileUpload("after", e.target.files)}
                  data-testid="after-photo-input"
                />
                <Button variant="outline" className="w-full" onClick={() => afterRef.current?.click()} data-testid="upload-after-btn">
                  <Upload className="h-4 w-4 mr-2" />Upload efter-billede
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job info section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="job-info-card">
          <CardHeader><CardTitle>Detaljer</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {job.description && <p className="text-sm">{job.description}</p>}
            {job.addressLine1 && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {job.addressLine1}, {job.postalCode} {job.city}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Planlagt: {formatDate(job.scheduledDate)}
            </div>
            {job.startedAt && (
              <p className="text-sm text-muted-foreground">Startet: {formatDateTime(job.startedAt)}</p>
            )}
            {job.completedAt && (
              <p className="text-sm text-muted-foreground">Afsluttet: {formatDateTime(job.completedAt)}</p>
            )}
            {job.completionNotes && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Afslutningsnoter:</p>
                {job.completionNotes}
              </div>
            )}
            {linkedQuote && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Tilbud:{" "}
                <Link href={`/quotes/${linkedQuote.id}`} className="text-primary hover:underline" data-testid="job-quote-link">
                  {linkedQuote.title}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="job-timeline-card">
          <CardHeader><CardTitle>Tidslinje</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Oprettet:</span>
                <span>{formatDateTime(job.createdAt)}</span>
              </div>
              {job.startedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Startet:</span>
                  <span>{formatDateTime(job.startedAt)}</span>
                </div>
              )}
              {job.completedAt && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Afsluttet:</span>
                  <span>{formatDateTime(job.completedAt)}</span>
                </div>
              )}
              {job.status === "cancelled" && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Annulleret</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completion dialog */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent data-testid="completion-dialog">
          <DialogHeader>
            <DialogTitle>Afslut job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tilføj eventuelt afslutningsnoter til dette job.
            </p>
            <Textarea
              placeholder="Skriv noter om det udførte arbejde..."
              value={completionNotes}
              onChange={e => setCompletionNotes(e.target.value)}
              data-testid="completion-notes-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletionDialogOpen(false)} data-testid="completion-cancel-btn">
              Annuller
            </Button>
            <Button onClick={handleCompleteJob} disabled={statusMutation.isPending} data-testid="completion-confirm-btn" className="bg-green-600 hover:bg-green-700">
              {statusMutation.isPending ? "Afslutter..." : "Bekræft afslutning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
