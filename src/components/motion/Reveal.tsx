import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { useEffect, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: "fade-in" | "fade-up" | "slide-up" | "scale-in";
  delayMs?: number;
}

export default function Reveal({
  children,
  className,
  animation = "fade-up",
  delayMs = 0,
}: RevealProps) {
  const { ref, inView } = useInView({ threshold: 0.05, once: true });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      ref={ref as any}
      className={cn(
        "will-change-transform",
        !(inView && mounted) ? "opacity-0" : "opacity-100",
        inView && mounted && `animate-${animation}`,
        className
      )}
      style={{ animationDelay: delayMs ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}
