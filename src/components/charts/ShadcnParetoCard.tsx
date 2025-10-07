import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCachedGet } from "@/hooks/useCachedGet";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line } from "recharts";

type ParetoResponse = {
  labels: string[];
  bars: number[];
  cum_pct: number[]; // 0..100
};

export default function ShadcnParetoCard({
  title,
  endpoint,
  params,
  height = 260,
  refreshKey,
}: {
  title: string;
  endpoint: string;
  params?: Record<string, any>;
  height?: number;
  refreshKey?: number;
}) {
  const { data, error, loading } = useCachedGet<ParetoResponse>(endpoint, params, undefined, refreshKey);

  const rows = useMemo(() => {
    if (!data) return [] as any[];
    const labels = data.labels.map((s) => String(s || "").trim()).filter(Boolean);
    return labels.map((label, i) => ({
      label,
      Count: Number(data.bars[i]) || 0,
      "Cumulative %": Number(data.cum_pct[i]) || 0,
    }));
  }, [data]);

  const chartConfig = useMemo(() => ({
    Count: { label: "Count" },
    "Cumulative %": { label: "Cumulative %" },
  }), []);

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-xs text-slate-500">Loading…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {!loading && !error && rows.length > 0 && (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            <ComposedChart data={rows} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={{ stroke: "#cbd5e1" }} axisLine={{ stroke: "#cbd5e1" }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={{ stroke: "#cbd5e1" }} axisLine={{ stroke: "#cbd5e1" }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v)=>`${v}%`} tickLine={{ stroke: "#cbd5e1" }} axisLine={{ stroke: "#cbd5e1" }} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="Count" fill="hsl(201, 96%, 45%)" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="Cumulative %" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
