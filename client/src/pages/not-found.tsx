import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-20" data-testid="not-found-page">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">404 — Siden blev ikke fundet</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Den side du leder efter eksisterer ikke.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
