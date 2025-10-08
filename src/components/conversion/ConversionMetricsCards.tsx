import { useQuery } from "@tanstack/react-query";
import { getConversionMetrics } from "@/lib/api";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartInsightsButton } from "@/components/charts/ChartInsightsButton";

export function ConversionMetricsCards() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["conversion-metrics"],
    queryFn: getConversionMetrics,
  });

  if (isLoading) return <div className="h-[120px] grid place-items-center text-muted-foreground">Loading metrics…</div>;
  if (isError) return (
    <div className="h-[160px] grid place-items-center text-destructive">
      <div className="text-center">
        <div className="font-medium mb-2">Failed to load metrics</div>
        <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
        <button className="mt-3 text-xs underline" onClick={() => refetch()}>Retry</button>
      </div>
    </div>
  );

  const m = data || ({} as any);

  // Thresholds (adjustable):
  const targets = {
    conversion_rate_pct: 50, // want higher
    prevention_rate_pct: 50, // want higher
    avg_days_to_incident: 14, // want lower
  };

  const convTrend: "up" | "down" | "neutral" =
    typeof m.conversion_rate_pct === "number" ? (m.conversion_rate_pct >= targets.conversion_rate_pct ? "up" : "down") : "neutral";
  const prevTrend: "up" | "down" | "neutral" =
    typeof m.prevention_rate_pct === "number" ? (m.prevention_rate_pct >= targets.prevention_rate_pct ? "up" : "down") : "neutral";
  const daysTrend: "up" | "down" | "neutral" =
    typeof m.avg_days_to_incident === "number" ? (m.avg_days_to_incident <= targets.avg_days_to_incident ? "up" : "down") : "neutral";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Conversion Metrics</h3>
        <ChartInsightsButton 
          figure={undefined}
          title="Conversion Metrics"
          meta={{ endpoint: "/analytics/conversion/metrics" }}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Hazards" value={m.total_hazards ?? "-"} trend="up" variant="warning" />
        <KPICard title="Total Incidents" value={m.total_incidents ?? "-"} trend="up" variant="danger" />
        <KPICard title="Hazards → Incidents" value={m.hazards_became_incidents ?? "-"} trend="up" />
        <KPICard title="Prevented Hazards" value={m.prevented_hazards ?? "-"} trend="up" variant="success" />
        <KPICard title="Conversion Rate" value={m.conversion_rate_pct ?? "-"} valueSuffix="%" trend={convTrend} />
        <KPICard title="Prevention Rate" value={m.prevention_rate_pct ?? "-"} valueSuffix="%" trend={prevTrend} variant={prevTrend === "up" ? "success" : "danger"} />
        <KPICard title="Avg Days to Incident" value={m.avg_days_to_incident ?? "-"} trend={daysTrend} />
        <div className="self-center text-xs text-muted-foreground">{isFetching ? "Refreshing…" : ""}</div>
      </div>
    </div>
  );
}
