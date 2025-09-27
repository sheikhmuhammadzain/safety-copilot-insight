import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
  };
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  trend = "neutral", 
  variant = "default",
  className 
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

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-l-4 border-l-safety-success";
      case "warning":
        return "border-l-4 border-l-safety-warning";
      case "danger":
        return "border-l-4 border-l-safety-danger";
      default:
        return "border-l-4 border-l-accent";
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-lg", getVariantStyles(), className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {change && (
            <div className="flex items-center space-x-1">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getTrendColor())}
              >
                {getTrendIcon()}
                <span className="ml-1">
                  {change.value > 0 ? "+" : ""}{change.value}%
                </span>
              </Badge>
            </div>
          )}
        </div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            vs {change.period}
          </p>
        )}
      </CardContent>
    </Card>
  );
}