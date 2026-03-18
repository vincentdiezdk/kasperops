import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/app-layout";
import Dashboard from "@/pages/dashboard";
import CustomersPage from "@/pages/customers";
import CustomerDetailPage from "@/pages/customer-detail";
import QuotesPage from "@/pages/quotes";
import QuoteDetailPage from "@/pages/quote-detail";
import JobsPage from "@/pages/jobs";
import JobDetailPage from "@/pages/job-detail";
import InvoicesPage from "@/pages/invoices";
import InvoiceDetailPage from "@/pages/invoice-detail";
import AgreementsPage from "@/pages/agreements";
import AgreementDetailPage from "@/pages/agreement-detail";
import PricesPage from "@/pages/prices";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/customers/:id" component={CustomerDetailPage} />
        <Route path="/customers" component={CustomersPage} />
        <Route path="/quotes/:id" component={QuoteDetailPage} />
        <Route path="/quotes" component={QuotesPage} />
        <Route path="/jobs/:id" component={JobDetailPage} />
        <Route path="/jobs" component={JobsPage} />
        <Route path="/invoices/:id" component={InvoiceDetailPage} />
        <Route path="/invoices" component={InvoicesPage} />
        <Route path="/agreements/:id" component={AgreementDetailPage} />
        <Route path="/agreements" component={AgreementsPage} />
        <Route path="/prices" component={PricesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
