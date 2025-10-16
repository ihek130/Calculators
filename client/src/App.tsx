import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import HomePage from "@/components/HomePage";
import NotFound from "@/pages/not-found";

// Import category pages
import AllCalculatorsPage from "@/pages/AllCalculatorsPage";
import FinancialCalculatorsPage from "@/pages/FinancialCalculatorsPage";
import HealthCalculatorsPage from "@/pages/HealthCalculatorsPage";
import MathCalculatorsPage from "@/pages/MathCalculatorsPage";
import OtherCalculatorsPage from "@/pages/OtherCalculatorsPage";

// Import company pages
import AboutPage from "@/pages/AboutPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import BlogPage from "@/pages/BlogPage";

// Import dynamic calculator page
import DynamicCalculatorPage from "./pages/DynamicCalculatorPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      
      {/* Category Pages */}
      <Route path="/all-calculators" component={AllCalculatorsPage} />
      <Route path="/financial-calculators" component={FinancialCalculatorsPage} />
      <Route path="/health-calculators" component={HealthCalculatorsPage} />
      <Route path="/math-calculators" component={MathCalculatorsPage} />
      <Route path="/other-calculators" component={OtherCalculatorsPage} />
      
      {/* Company Pages */}
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/blog" component={BlogPage} />
      
      {/* Dynamic Calculator Routes - SEO Friendly */}
      <Route path="/calculators/:slug" component={DynamicCalculatorPage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
