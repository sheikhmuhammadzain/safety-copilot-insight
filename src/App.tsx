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
import DataHealth from "./pages/DataHealth";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Wordclouds from "./pages/Wordclouds";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();  

// Component to conditionally render ChatBubble based on route
const ConditionalChatBubble = () => {
  const location = useLocation();
  
  // Don't show chat bubble on Agent page (full interface) or Landing page
  const showChatBubble = location.pathname !== "/agent" && location.pathname !== "/";
  
  return showChatBubble ? <ChatBubble /> : null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            <Route path="/workbooks" element={<Workbooks />} />
            <Route path="/data-health" element={<DataHealth />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        {/* Global floating chat bubble - only show when not on Agent or Landing page */}
        <ConditionalChatBubble />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
