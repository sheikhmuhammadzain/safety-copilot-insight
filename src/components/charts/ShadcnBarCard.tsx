import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

type Series = { name: string; data: number[] };

type ChartResponse = {
  labels: string[];
  series: Series[];
};

const palette = [
  "hsl(174, 84%, 40%)",
  "hsl(201, 96%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 70%)",
  "hsl(120, 60%, 50%)",
  "hsl(300, 70%, 60%)",
  "hsl(30, 80%, 55%)",
];

import { useCachedGet } from "@/hooks/useCachedGet";

export default function ShadcnBarCard({
  title,
  endpoint,
  params,
  height = 260,
  stacked = false,
  maxCategories = 12,
  refreshKey,
}: {
  title: string;
  endpoint: string;
  params?: Record<string, any>;
  height?: number;
  stacked?: boolean;
  maxCategories?: number;
  refreshKey?: number;
}) {
  const { data, error, loading } = useCachedGet<ChartResponse>(endpoint, params, undefined, refreshKey);

  const safeData = useMemo<ChartResponse | null>(() => {
    if (!data) return null;
    
    // Filter invalid labels and cap category count
    const valid: { idx: number; label: string }[] = [];
    data.labels.forEach((lbl, idx) => {
      const s = String(lbl || "").trim();
      if (s && s.toLowerCase() !== "nat") {
        valid.push({ idx, label: s });
      }
    });
    
    // Sort by total (desc) and keep top N
    const totals = valid.map(({ idx }) => 
      data.series.reduce((acc, s) => acc + (Number(s.data[idx]) || 0), 0)
    );
    
    const order = valid
      .map((v, i) => ({ ...v, total: totals[i] }))
      .sort((a, b) => b.total - a.total);
      
    const top = order.slice(0, maxCategories);
    const rest = order.slice(maxCategories);
    
    const labels = top.map((t) => t.label);
    let series = data.series.map((s) => ({
      name: s.name,
      data: top.map((t) => Number(s.data[t.idx]) || 0),
    }));
    
    if (rest.length > 0) {
      // Add "Other" bucket
      labels.push("Other");
      series = series.map((s, si) => ({
        ...s,
        data: [
          ...s.data,
          rest.reduce((acc, r) => acc + (Number(data.series[si].data[r.idx]) || 0), 0),
        ],
      }));
    }
    
    return { labels, series };
  }, [data, maxCategories]);

  const chartData = useMemo(() => {
    if (!safeData) return [];
    
    const { labels, series } = safeData;
    return labels.map((label, i) => {
      const row: Record<string, any> = { name: label };
      series.forEach((s) => {
        row[s.name] = s.data[i] ?? 0;
      });
      return row;
    });
  }, [safeData]);

  const formatTick = useCallback((value: any) => {
    const s = String(value ?? "");
    const max = 15; // visible length before ellipsis
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }, []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Loading skeleton
  const renderSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 w-16 bg-slate-200 rounded-t"></div>
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-16 bg-slate-200 rounded"></div>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="w-full" style={{ height: height }}>
            {renderSkeleton()}
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        {!loading && !error && safeData && chartData.length > 0 && (
          <div className="w-full" style={{ height: height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={{ stroke: "#cbd5e1" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tickFormatter={formatTick}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickLine={{ stroke: "#cbd5e1" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  allowDecimals={false}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                {safeData.series.length > 1 && (
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="rect"
                  />
                )}
                {safeData.series.map((series, idx) => (
                  <Bar
                    key={series.name}
                    dataKey={series.name}
                    stackId={stacked ? "stack" : undefined}
                    fill={palette[idx % palette.length]}
                    radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {!loading && !error && (!safeData || chartData.length === 0) && (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-lg font-medium mb-2">No Data Available</p>
            <p className="text-sm">There's no chart data to display at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 