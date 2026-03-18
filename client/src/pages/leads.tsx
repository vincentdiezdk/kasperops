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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, GripVertical, Phone, Mail, MapPin, User, ArrowRight, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDKK } from "@/lib/formatters";
import type { Lead } from "@shared/schema";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STAGES = [
  { id: "new", label: "Ny" },
  { id: "contacted", label: "Kontaktet" },
  { id: "quote_sent", label: "Tilbud sendt" },
  { id: "accepted", label: "Accepteret" },
  { id: "completed", label: "Afsluttet" },
  { id: "lost", label: "Tabt" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  website: "Hjemmeside",
  phone: "Telefon",
  referral: "Henvisning",
  other: "Andet",
};

const SOURCE_COLORS: Record<string, string> = {
  website: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  phone: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  referral: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  other: "bg-muted text-muted-foreground",
};

function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "I dag";
  if (days === 1) return "1 dag siden";
  if (days < 30) return `${days} dage siden`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 måned siden" : `${months} måneder siden`;
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lead-${lead.id}`,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-3 cursor-pointer hover:border-primary/40 transition-colors shadow-sm"
      onClick={onClick}
      data-testid={`lead-card-${lead.id}`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{lead.name}</p>
          <Badge className={SOURCE_COLORS[lead.source] || SOURCE_COLORS.other} variant="secondary">
            {SOURCE_LABELS[lead.source] || lead.source}
          </Badge>
          {lead.estimatedValue && (
            <p className="text-xs font-medium text-primary mt-1">{formatDKK(lead.estimatedValue)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{timeAgo(lead.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const [, navigate] = useHashLocation();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [convertConfirmOpen, setConvertConfirmOpen] = useState(false);
  const [lostConfirmOpen, setLostConfirmOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { data: leads = [] } = useQuery<Lead[]>({ queryKey: ["/api/leads"] });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setCreateDialogOpen(false);
      toast({ title: "Lead oprettet" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditDialogOpen(false);
      setSelectedLead(null);
    },
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/leads/${id}/convert`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setConvertConfirmOpen(false);
      setSelectedLead(null);
      toast({ title: "Lead konverteret til kunde" });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      email: fd.get("email") as string || null,
      phone: fd.get("phone") as string || null,
      address: fd.get("address") as string || null,
      source: fd.get("source") as string || "website",
      notes: fd.get("notes") as string || null,
      estimatedValue: fd.get("estimatedValue") ? Number(fd.get("estimatedValue")) : null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLead) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedLead.id,
      data: {
        name: fd.get("name") as string,
        email: fd.get("email") as string || null,
        phone: fd.get("phone") as string || null,
        address: fd.get("address") as string || null,
        source: fd.get("source") as string || "website",
        notes: fd.get("notes") as string || null,
        estimatedValue: fd.get("estimatedValue") ? Number(fd.get("estimatedValue")) : null,
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const leadData = (active.data.current as any)?.lead as Lead;
    if (!leadData) return;

    // The over target could be a column or another card
    let targetStage: string | null = null;

    // Check if dropped over a column container
    const overId = over.id as string;
    if (overId.startsWith("column-")) {
      targetStage = overId.replace("column-", "");
    } else if (overId.startsWith("lead-")) {
      // Dropped over another lead card — find which column it's in
      const overLead = leads.find(l => `lead-${l.id}` === overId);
      if (overLead) targetStage = overLead.stage;
    }

    if (targetStage && targetStage !== leadData.stage) {
      updateMutation.mutate({ id: leadData.id, data: { stage: targetStage } });
    }
  };

  const activeLead = activeDragId ? leads.find(l => `lead-${l.id}` === activeDragId) : null;

  return (
    <div className="space-y-6" data-testid="leads-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Lead pipeline — træk leads mellem kolonner</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="create-lead-btn">
          <Plus className="h-4 w-4 mr-2" />Opret lead
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none" data-testid="kanban-board">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                leads={stageLeads}
                onCardClick={(lead) => {
                  setSelectedLead(lead);
                  setEditDialogOpen(true);
                }}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeLead && (
            <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90 w-64">
              <p className="font-medium text-sm">{activeLead.name}</p>
              <Badge className={SOURCE_COLORS[activeLead.source]} variant="secondary">
                {SOURCE_LABELS[activeLead.source] || activeLead.source}
              </Badge>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md" data-testid="create-lead-dialog">
          <DialogHeader>
            <DialogTitle>Opret lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" name="name" required data-testid="lead-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" data-testid="lead-email-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" data-testid="lead-phone-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" name="address" data-testid="lead-address-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Kilde</Label>
                <select name="source" id="source" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="lead-source-select">
                  <option value="website">Hjemmeside</option>
                  <option value="phone">Telefon</option>
                  <option value="referral">Henvisning</option>
                  <option value="other">Andet</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimeret værdi</Label>
                <Input id="estimatedValue" name="estimatedValue" type="number" placeholder="kr." data-testid="lead-value-input" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Noter</Label>
              <Textarea id="notes" name="notes" data-testid="lead-notes-input" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuller</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="save-lead-btn">
                {createMutation.isPending ? "Opretter..." : "Opret"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setSelectedLead(null); }}>
        <DialogContent className="max-w-md" data-testid="edit-lead-dialog">
          <DialogHeader>
            <DialogTitle>Redigér lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Navn *</Label>
                <Input id="edit-name" name="name" required defaultValue={selectedLead.name} data-testid="edit-lead-name-input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedLead.email || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefon</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedLead.phone || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse</Label>
                <Input id="edit-address" name="address" defaultValue={selectedLead.address || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Kilde</Label>
                  <select name="source" id="edit-source" defaultValue={selectedLead.source} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="website">Hjemmeside</option>
                    <option value="phone">Telefon</option>
                    <option value="referral">Henvisning</option>
                    <option value="other">Andet</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-estimatedValue">Estimeret værdi</Label>
                  <Input id="edit-estimatedValue" name="estimatedValue" type="number" defaultValue={selectedLead.estimatedValue || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Noter</Label>
                <Textarea id="edit-notes" name="notes" defaultValue={selectedLead.notes || ""} />
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 border-t pt-3">
                {selectedLead.stage !== "completed" && !selectedLead.customerId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditDialogOpen(false); setConvertConfirmOpen(true); }}
                    data-testid="convert-lead-btn"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />Opret kunde
                  </Button>
                )}
                {selectedLead.stage !== "lost" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => { setEditDialogOpen(false); setLostConfirmOpen(true); }}
                    data-testid="mark-lost-btn"
                  >
                    <X className="h-4 w-4 mr-1" />Markér som tabt
                  </Button>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedLead(null); }}>Annuller</Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="update-lead-btn">
                  {updateMutation.isPending ? "Gemmer..." : "Gem"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to customer confirm */}
      <AlertDialog open={convertConfirmOpen} onOpenChange={setConvertConfirmOpen}>
        <AlertDialogContent data-testid="convert-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Konvertér lead til kunde?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLead?.name} oprettes som ny kunde med kontaktoplysninger fra lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedLead && convertMutation.mutate(selectedLead.id)} data-testid="confirm-convert-btn">
              Opret kunde
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark as lost confirm */}
      <AlertDialog open={lostConfirmOpen} onOpenChange={setLostConfirmOpen}>
        <AlertDialogContent data-testid="lost-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Markér lead som tabt?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLead?.name} flyttes til &quot;Tabt&quot;-kolonnen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedLead) {
                  updateMutation.mutate({ id: selectedLead.id, data: { stage: "lost" } });
                  setLostConfirmOpen(false);
                  setSelectedLead(null);
                }
              }}
              data-testid="confirm-lost-btn"
            >
              Markér som tabt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KanbanColumn({ stage, leads, onCardClick }: {
  stage: { id: string; label: string };
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef } = useSortable({
    id: `column-${stage.id}`,
    data: { type: "column", stageId: stage.id },
  });

  const stageColors: Record<string, string> = {
    new: "border-t-blue-500",
    contacted: "border-t-purple-500",
    quote_sent: "border-t-orange-500",
    accepted: "border-t-green-500",
    completed: "border-t-emerald-600",
    lost: "border-t-red-500",
  };

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[260px] w-[260px] flex-shrink-0 snap-start bg-muted/30 rounded-lg border border-t-4 ${stageColors[stage.id] || ""}`}
      data-testid={`kanban-column-${stage.id}`}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{stage.label}</h3>
          <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[100px]">
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
      </div>
    </div>
  );
}
