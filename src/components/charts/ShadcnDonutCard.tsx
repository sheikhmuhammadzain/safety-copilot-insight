import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type Series = { name: string; data: number[] };

type ChartResponse = {
  labels: string[];
  series: Series[]; // use first series for values
};

export default function ShadcnDonutCard({
  title,
  endpoint,
  params,
  height = 260,
  centerText,
  maxSlices = 10,
}: {
  title: string;
  endpoint: string;
  params?: Record<string, any>;
  height?: number;
  centerText?: string;
  maxSlices?: number;
}) {
  const [data, setData] = useState<ChartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get<ChartResponse>(endpoint, { params })
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
    if (!data) return [] as { name: string; value: number }[];
    const values = data.series?.[0]?.data || [];
    // sanitize labels and values
    const items = data.labels
      .map((label, i) => ({ name: String(label || '').trim(), value: Number(values[i]) || 0 }))
      .filter((r) => r.name && r.name.toLowerCase() !== 'nat');
    // sort desc and cap slices
    items.sort((a, b) => b.value - a.value);
    if (items.length <= maxSlices) return items;
    const top = items.slice(0, maxSlices);
    const other = items.slice(maxSlices).reduce((acc, r) => acc + r.value, 0);
    return [...top, { name: 'Other', value: other }];
  }, [data, maxSlices]);

  const total = useMemo(() => rows.reduce((acc, r) => acc + (r.value || 0), 0), [rows]);

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string }> = {};
    rows.forEach((r) => (cfg[r.name] = { label: r.name }));
    return cfg;
  }, [rows]);

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-xs text-slate-500">Loading…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {!loading && !error && data && (
          <div style={{ width: "100%", height }} className="relative">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {rows.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
                  <Pie data={rows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {rows.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={palette[idx % palette.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{total}</div>
                {centerText && <div className="text-xs text-slate-600">{centerText}</div>}
              </div>
            </div>
          </div>
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
  "hsl(140, 70%, 40%)",
  "hsl(20, 90%, 60%)",
];
