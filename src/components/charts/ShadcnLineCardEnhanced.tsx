import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCachedGet } from "@/hooks/useCachedGet";
import { DetailedTrendResponse, MonthDetailedData } from "@/lib/api";
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
import { ChartDetailsModal } from "./ChartDetailsModal";

export default function ShadcnLineCardEnhanced({
  title,
  params,
  height = 260,
  refreshKey,
  datasetType = "incident",
}: {
  title: string;
  params?: Record<string, any>;
  height?: number;
  refreshKey?: number;
  datasetType?: "incident" | "hazard";
}) {
  const [selectedMonth, setSelectedMonth] = useState<MonthDetailedData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Use the detailed endpoint which includes tooltip data
  const { data, error, loading } = useCachedGet<DetailedTrendResponse>(
    "/analytics/data/incident-trend-detailed",
    params,
    undefined,
    refreshKey
  );

  // Sanitize and optionally aggregate series
  const safeData = useMemo(() => {
    if (!data) return null;
    const indices: number[] = [];
    data.labels.forEach((lbl, idx) => {
      if (lbl && String(lbl).toLowerCase() !== "nat") indices.push(idx);
    });
    const labels = indices.map((i) => data.labels[i]);
    let series = data.series.map((s) => ({
      name: s.name,
      data: indices.map((i) => s.data[i] ?? 0),
    }));
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

  // Get tooltip details from the API response
  const tooltipDetails = data?.details || [];

  // Handle right-click on chart
  const handleChartClick = (e: any) => {
    if (e && e.activeLabel) {
      const monthData = tooltipDetails.find((d) => d.month === e.activeLabel);
      if (monthData) {
        setSelectedMonth(monthData);
        setModalOpen(true);
      }
    }
  };

  // Simple tooltip for hover
  const SimpleTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2">
        <p className="text-xs font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-600">
          {payload[0].dataKey}: {payload[0].value}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">Click to see  details</p>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
          {error && <div className="text-xs text-destructive">{error}</div>}
          {!loading && !error && safeData && (
            <div 
              style={{ width: "100%", height }}
              onContextMenu={(e) => {
                e.preventDefault();
                // Get the closest data point - this is a workaround
                // We'll trigger on regular click instead
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={rows} 
                  margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                  onClick={handleChartClick}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickLine={{ stroke: "#cbd5e1" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<SimpleTooltip />} />
                  {safeData.series.length > 1 && <Legend />}
                  {safeData.series.map((s, idx) => (
                    <Line
                      key={s.name}
                      type="monotone"
                      dataKey={s.name}
                      stroke={palette[idx % palette.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <ChartDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        monthDetails={selectedMonth}
        datasetType={datasetType}
      />
    </>
  );
}

const palette = [
  "hsl(174, 84%, 40%)",
  "hsl(201, 96%, 45%)",
  "hsl(38, 92%, 55%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 70%)",
];
