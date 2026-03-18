import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold">Indstillinger</h1>
        <p className="text-muted-foreground">Administrer virksomhedsoplysninger og præferencer.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="company-info-card">
          <CardHeader>
            <CardTitle>Virksomhedsoplysninger</CardTitle>
            <CardDescription>Oplysninger der vises på tilbud og fakturaer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Virksomhedsnavn</Label>
              <Input id="company-name" defaultValue="Kasper MH" data-testid="company-name-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-cvr">CVR-nummer</Label>
              <Input id="company-cvr" placeholder="12345678" data-testid="company-cvr-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" defaultValue="kasper@kaspermh.dk" data-testid="company-email-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefon</Label>
              <Input id="company-phone" defaultValue="+45 12345678" data-testid="company-phone-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Adresse</Label>
              <Input id="company-address" placeholder="Hovedgade 1, 2000 Frederiksberg" data-testid="company-address-input" />
            </div>
            <Button data-testid="save-company-btn" className="mt-2">Gem</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card data-testid="theme-card">
            <CardHeader>
              <CardTitle>Udseende</CardTitle>
              <CardDescription>Vælg mellem lyst og mørkt tema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  data-testid="theme-light-btn"
                  className="flex-1"
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Lyst
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  data-testid="theme-dark-btn"
                  className="flex-1"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Mørkt
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="user-management-card">
            <CardHeader>
              <CardTitle>Brugerstyring</CardTitle>
              <CardDescription>Administrer brugere og roller.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  KM
                </div>
                <div>
                  <p className="font-medium">Kasper MH</p>
                  <p className="text-sm text-muted-foreground">kasper@kaspermh.dk — Admin</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Flere brugere kan tilføjes i en fremtidig opdatering.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
