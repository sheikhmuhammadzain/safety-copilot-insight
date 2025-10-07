import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period?: string;
  };
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger";
  valueSuffix?: string;
  icon?: ReactNode;
  iconBgClass?: string;
  className?: string;
  info?: ReactNode;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  trend = "neutral", 
  variant = "default",
  valueSuffix,
  icon,
  iconBgClass,
  className,
  info,
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-kpi-positive";
      case "down":
        return "text-kpi-negative";
      default:
        return "text-kpi-neutral";
    }
  };

  const iconWrapperClass = iconBgClass ||
    (variant === "success"
      ? "bg-emerald-100 text-emerald-600"
      : variant === "warning"
      ? "bg-amber-100 text-amber-700"
      : variant === "danger"
      ? "bg-rose-100 text-rose-600"
      : "bg-accent/10 text-accent");

  return (
    <Card className={cn("relative overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-sm transition-all hover:shadow-lg", className)}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="h-6 w-6 rounded-full border border-muted-foreground/20 grid place-items-center text-muted-foreground/60 hover:bg-muted/40"
                  aria-label={`About ${title}`}
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs leading-relaxed">
                  {info || "Key performance indicator."}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="h-6 w-6 rounded-full bg-muted/50" />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className={cn("h-10 w-10 rounded-full grid place-items-center", iconWrapperClass)}>
              {icon}
            </div>
          )}
          <div>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              {value}{valueSuffix ? valueSuffix : ""}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
        </div>
        {change && (
          <div className="mt-4">
            <Badge 
              variant="secondary" 
              className={cn("text-xs px-2 py-1 rounded-md", (trend === "down" || change.value < 0) ? "text-rose-600" : (trend === "up" || change.value > 0) ? "text-emerald-600" : "text-muted-foreground")}
            >
              {(trend === "down" || change.value < 0) ? <TrendingDown className="h-3 w-3" /> : (trend === "up" || change.value > 0) ? <TrendingUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span className="ml-1">{change.value > 0 ? "+" : ""}{change.value}%</span>
            </Badge>
            {change.period && (
              <span className="text-xs text-muted-foreground ml-2">vs {change.period}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}