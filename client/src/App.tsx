import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CustomerDetails from "@/pages/customer";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/customer/:id" component={CustomerDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // use Vite base (e.g. "/FiadoFacil/") but remove trailing slash to satisfy wouter's `base`
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || undefined;

  return (
    <WouterRouter base={base}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
