import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCachedGet } from "@/hooks/useCachedGet";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Series = { name: string; data: number[] };

type ChartResponse = {
  labels: string[];
  series: Series[];
};

export default function ShadcnLineCard({
  title,
  endpoint,
  params,
  height = 260,
  refreshKey,
}: {
  title: string;
  endpoint: string; // e.g. "/analytics/data/incident-trend"
  params?: Record<string, any>;
  height?: number;
  refreshKey?: number;
}) {
  const { data, error, loading } = useCachedGet<ChartResponse>(endpoint, params, undefined, refreshKey);

  // Sanitize and optionally aggregate series
  const safeData = useMemo<ChartResponse | null>(() => {
    if (!data) return null;
    // Filter invalid labels ("NaT", empty, null)
    const indices: number[] = [];
    data.labels.forEach((lbl, idx) => {
      if (lbl && String(lbl).toLowerCase() !== "nat") indices.push(idx);
    });
    const labels = indices.map((i) => data.labels[i]);
    let series = data.series.map((s) => ({
      name: s.name,
      data: indices.map((i) => s.data[i] ?? 0),
    }));
    // If backend returns too many series (e.g., per-incident), aggregate to a single Total
    if (series.length > 6) {
      const totals = labels.map((_, i) => series.reduce((acc, s) => acc + (Number(s.data[i]) || 0), 0));
      series = [{ name: "Total", data: totals }];
    }
    return { labels, series };
  }, [data]);

  const rows = useMemo(() => {
    if (!safeData) return [] as any[];
    const { labels, series } = safeData;
    return labels.map((label, i) => {
      const row: Record<string, any> = { label };
      series.forEach((s) => {
        row[s.name] = s.data[i] ?? null;
      });
      return row;
    });
  }, [safeData]);

  // Build shadcn chart config (labels only; colors come from series stroke)
  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string }> = {};
    safeData?.series.forEach((s) => {
      cfg[s.name] = { label: s.name };
    });
    return cfg;
  }, [safeData]);

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {error && <div className="text-xs text-destructive">{error}</div>}
        {!loading && !error && safeData && (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            <LineChart data={rows} margin={{ top: 10, right: 20, bottom: 10, left: 0 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={{ stroke: "#cbd5e1" }} axisLine={{ stroke: "#cbd5e1" }} minTickGap={24} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={{ stroke: "#cbd5e1" }} axisLine={{ stroke: "#cbd5e1" }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {safeData.series.length > 1 && (
                <ChartLegend content={<ChartLegendContent />} />
              )}
              {safeData.series.map((s, idx) => (
                <Line key={s.name} type="monotone" dataKey={s.name} stroke={palette[idx % palette.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

const palette = [
  "hsl(174, 84%, 40%)",
  "hsl(201, 96%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 70%)",
];
