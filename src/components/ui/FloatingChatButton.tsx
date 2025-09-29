import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot } from "lucide-react";

export default function FloatingChatButton() {
  const location = useLocation();
  // Hide on the agent page itself
  if (location.pathname.startsWith("/agent")) return null;

  return (
    <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/agent"
              aria-label="Open Safety Copilot"
              className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-white/20 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Bot className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-slate-700">
            Talk to the Copilot
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
