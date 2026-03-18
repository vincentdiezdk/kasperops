import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil } from "lucide-react";
import { formatDKK } from "@/lib/formatters";
import type { PriceItem } from "@shared/schema";

export default function PricesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PriceItem | null>(null);

  const { data: items = [] } = useQuery<PriceItem[]>({ queryKey: ["/api/price-items"] });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/price-items", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/price-items"] }); setDialogOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/price-items/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/price-items"] }); setDialogOpen(false); setEditing(null); },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => apiRequest("PATCH", `/api/price-items/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/price-items"] }),
  });

  // Group by category
  const categories = Array.from(new Set(items.map(i => i.category))).sort();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      description: fd.get("description") as string || null,
      unitLabel: fd.get("unitLabel") as string || "stk",
      unitPrice: parseFloat(fd.get("unitPrice") as string),
      isActive: true,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6" data-testid="prices-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Priskatalog</h1>
          <p className="text-muted-foreground">{items.length} ydelser i kataloget</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} data-testid="add-price-item-btn">
          <Plus className="h-4 w-4 mr-2" />Tilføj ydelse
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground" data-testid="empty-prices">
          Ingen ydelser i kataloget endnu. Opret din første ydelse.
        </Card>
      ) : categories.map(cat => (
        <Card key={cat} data-testid={`category-${cat}`}>
          <div className="px-4 py-3 bg-muted/50 border-b">
            <h3 className="font-semibold text-sm">{cat}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead className="hidden md:table-cell">Beskrivelse</TableHead>
                <TableHead>Enhed</TableHead>
                <TableHead className="text-right">Pris</TableHead>
                <TableHead className="text-center">Aktiv</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.filter(i => i.category === cat).map(item => (
                <TableRow key={item.id} data-testid={`price-item-${item.id}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{item.description || "—"}</TableCell>
                  <TableCell>{item.unitLabel}</TableCell>
                  <TableCell className="text-right">{formatDKK(item.unitPrice)}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={item.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, isActive: checked })}
                      data-testid={`toggle-${item.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setDialogOpen(true); }} data-testid={`edit-price-${item.id}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
        <DialogContent className="max-w-md" data-testid="price-item-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Redigér ydelse" : "Ny ydelse"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Navn *</Label>
              <Input id="name" name="name" required defaultValue={editing?.name || ""} data-testid="price-name-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Input id="category" name="category" required defaultValue={editing?.category || ""} placeholder="f.eks. Algebehandling" data-testid="price-category-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea id="description" name="description" defaultValue={editing?.description || ""} data-testid="price-description-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitLabel">Enhed</Label>
                <Input id="unitLabel" name="unitLabel" defaultValue={editing?.unitLabel || "stk"} placeholder="stk, m², time" data-testid="price-unit-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Pris (DKK) *</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required defaultValue={editing?.unitPrice || ""} data-testid="price-amount-input" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }} data-testid="cancel-price-btn">Annuller</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="save-price-btn">
                {(createMutation.isPending || updateMutation.isPending) ? "Gemmer..." : "Gem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
