import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Overview from "./pages/Overview";
import Incidents from "./pages/Incidents";
import Hazards from "./pages/Hazards";
import Audits from "./pages/Audits";
import Maps from "./pages/Maps";
import Agent from "./pages/Agent2";
import Workbooks from "./pages/WorkbooksReal";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import DataHealth from "./pages/DataHealth";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Wordclouds from "./pages/Wordclouds";
import FloatingChatButton from "@/components/ui/FloatingChatButton";

const queryClient = new QueryClient();  

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing page without sidebar layout */}
          <Route path="/" element={<Landing />} />

          {/* App routes wrapped with sidebar layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/hazards" element={<Hazards />} />
            <Route path="/audits" element={<Audits />} />
            <Route path="/maps" element={<Maps />} />
            <Route path="/wordclouds" element={<Wordclouds />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/advanced-analytics" element={<AdvancedAnalytics />} />
            <Route path="/workbooks" element={<Workbooks />} />
            <Route path="/data-health" element={<DataHealth />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        {/* Global floating chat button */}
        <FloatingChatButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
