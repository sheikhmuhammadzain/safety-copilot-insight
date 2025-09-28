import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
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
}: {
  title: string;
  endpoint: string;
  params?: Record<string, any>;
  height?: number;
}) {
  const [data, setData] = useState<ParetoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ParetoResponse>(endpoint, { params })
      .then((res) => {
        if (!mounted) return;
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Failed to load chart");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [endpoint, JSON.stringify(params)]);

  const rows = useMemo(() => {
    if (!data) return [] as any[];
    const labels = data.labels.map((s) => String(s || "").trim()).filter(Boolean);
    return labels.map((label, i) => ({
      label,
      Count: Number(data.bars[i]) || 0,
      "Cum %": Number(data.cum_pct[i]) || 0,
    }));
  }, [data]);

  const chartConfig = useMemo(() => ({
    Count: { label: "Count" },
    "Cum %": { label: "Cum %" },
  }), []);

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {error && <div className="text-xs text-destructive">{error}</div>}
        {!loading && !error && rows.length > 0 && (
          <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
            <ComposedChart data={rows} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis yAxisId="left" tick={{ fill: "#94A3B8", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94A3B8", fontSize: 11 }} tickFormatter={(v)=>`${v}%`} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent className="text-white" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="left" dataKey="Count" fill="hsl(201, 96%, 45%)" radius={[4,4,0,0]} />
              <Line yAxisId="right" type="monotone" dataKey="Cum %" stroke="hsl(38, 92%, 55%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
