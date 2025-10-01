import { Link, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
              className="group inline-flex relative transition-all duration-300 hover:scale-105"
            >
              {/* Animated glow layers */}
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse" />
              
              <img 
                src="/copilot-logo.png" 
                alt="Copilot" 
                className="relative h-[90px] w-[90px] object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(132,204,22,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(132,204,22,0.9)]" 
              />
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
