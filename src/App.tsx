import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Overview from "./pages/Overview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/incidents" element={<div className="p-6"><h1 className="text-2xl font-bold">Incidents</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/hazards" element={<div className="p-6"><h1 className="text-2xl font-bold">Hazards</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/audits" element={<div className="p-6"><h1 className="text-2xl font-bold">Audits</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/maps" element={<div className="p-6"><h1 className="text-2xl font-bold">Maps</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/agent" element={<div className="p-6"><h1 className="text-2xl font-bold">Agent</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/workbooks" element={<div className="p-6"><h1 className="text-2xl font-bold">Workbooks</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Coming soon...</p></div>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
