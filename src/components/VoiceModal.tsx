import { Mic, Send, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GlassSurface from "./GlassSurface";

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: () => void;
  isListening: boolean;
}

export default function VoiceModal({ isOpen, onClose, onSend, isListening }: VoiceModalProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isListening) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [isListening]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none overflow-visible">
        <DialogTitle className="sr-only">Voice Input</DialogTitle>
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={16}
          brightness={50}
          opacity={0.95}
          blur={14}
          displace={0.5}
          backgroundOpacity={0.05}
          saturation={1.4}
          distortionScale={-200}
          redOffset={0}
          greenOffset={15}
          blueOffset={25}
          className="relative"
        >
          {/* Close (X) button */}
          <DialogClose asChild>
            <button
              aria-label="Close"
              className="absolute top-3 right-3 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 backdrop-blur-md ring-1 ring-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>

          <div className="w-full py-8 px-6">
          <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-4">
            {/* Mic Icon */}
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-all",
                isListening
                  ? "bg-white/15 ring-1 ring-white/40 animate-pulse"
                  : "bg-white/20 ring-1 ring-white/30"
              )}
            >
              {isListening ? (
                <div className="w-8 h-8 rounded-sm animate-spin bg-white" style={{ animationDuration: "3s" }} />
              ) : (
                <Mic className="w-8 h-8 text-white/90" />
              )}
            </div>

            {/* Timer */}
            <span
              className={cn(
                "font-mono text-lg font-semibold transition-opacity duration-300",
                isListening
                  ? "text-white"
                  : "text-white"
              )}
            >
              {formatTime(time)}
            </span>

            {/* Waveform Animation */}
            <div className="h-16 w-full max-w-sm flex items-center justify-center gap-1">
              {[...Array(32)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-300",
                    isListening
                      ? "bg-white animate-pulse shadow-[0_0_10px_rgba(255,99,99,0.6)]"
                      : "bg-white/30 h-2"
                  )}
                  style={
                    isListening
                      ? { height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.05}s` }
                      : undefined
                  }
                />
              ))}
            </div>

            {/* Status Text */}
            <p className="text-sm font-medium text-white">
              {isListening ? "Listening... Click send when done" : "Click to start speaking"}
            </p>

            {/* Send Button */}
            {isListening && (
              <Button variant="outline" onClick={onSend} className="" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Send & Transcribe
              </Button>
            )}
          </div>
          </div>
        </GlassSurface>
      </DialogContent>
    </Dialog>
  );
}
