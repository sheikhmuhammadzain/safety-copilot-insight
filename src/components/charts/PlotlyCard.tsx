import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Plot from "react-plotly.js";
import { usePlotly } from "@/hooks/usePlotly";
import { ChartInsightsButton } from "@/components/charts/ChartInsightsButton";

interface PlotlyCardProps {
  title: string;
  endpoint: string; // e.g. "/analytics/hse-scorecard"
  params?: Record<string, any>;
  height?: number;
}

export function PlotlyCard({ title, endpoint, params, height = 300 }: PlotlyCardProps) {
  const { data: figure, isLoading, isError, error, refetch, isFetching } = usePlotly(endpoint, params);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span>{title}</span>
            {isFetching && (
              <span className="text-xs text-muted-foreground">(refreshing)</span>
            )}
          </CardTitle>
          <ChartInsightsButton figure={figure} title={title} meta={{ endpoint, params }} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className={`flex items-center justify-center text-muted-foreground`} style={{ height }}>Loading chart…</div>
        ) : isError ? (
          <div className={`flex flex-col items-center justify-center text-destructive`} style={{ height }}>
            <p className="mb-2">Failed to load chart</p>
            <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
            <button onClick={() => refetch()} className="mt-3 text-xs underline">Retry</button>
          </div>
        ) : figure ? (
          <Plot
            data={figure.data}
            layout={{
              ...figure.layout,
              autosize: true,
              height,
              margin: { l: 60, r: 30, t: 60, b: 60, ...(figure.layout?.margin || {}) },
              legend: { orientation: "h", yanchor: "top", y: -0.2, xanchor: "left", x: 0, ...(figure.layout?.legend || {}) },
              uniformtext: { mode: "hide", minsize: 10, ...(figure.layout?.uniformtext || {}) },
              xaxis: { automargin: true, tickangle: figure.layout?.xaxis?.tickangle ?? -15, ...(figure.layout?.xaxis || {}) },
              yaxis: { automargin: true, ...(figure.layout?.yaxis || {}) },
              title: figure.layout?.title ? { ...(typeof figure.layout.title === 'object' ? figure.layout.title : { text: String(figure.layout.title) }), x: 0.02 } : undefined,
            }}
            config={{ responsive: true, displayModeBar: true }}
            useResizeHandler
            style={{ width: "100%" }}
          />
        ) : (
          <div className={`flex items-center justify-center text-muted-foreground`} style={{ height }}>No data</div>
        )}
      </CardContent>
    </Card>
  );
}
