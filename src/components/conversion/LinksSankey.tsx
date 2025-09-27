import Plot from "react-plotly.js";
import { useQuery } from "@tanstack/react-query";
import { getConversionLinks } from "@/lib/api";

function buildSankeyFromEdges(edges: any[]) {
  const hazards: string[] = [];
  const incidents: string[] = [];
  const source: number[] = [];
  const target: number[] = [];
  const value: number[] = [];

  const hazardIndex = new Map<string, number>();
  const incidentIndex = new Map<string, number>();

  for (const e of edges) {
    const h = String(e.hazard ?? e.hazard_id ?? e.hazard_uid ?? "");
    const i = String(e.incident ?? e.incident_id ?? e.incident_uid ?? "");
    if (!h || !i) continue;
    if (!hazardIndex.has(h)) {
      hazardIndex.set(h, hazards.length);
      hazards.push(h);
    }
    if (!incidentIndex.has(i)) {
      incidentIndex.set(i, incidents.length);
      incidents.push(i);
    }
    source.push(hazardIndex.get(h)!);
    target.push(hazards.length + incidentIndex.get(i)!);
    value.push(Number(e.weight ?? e.count ?? 1));
  }

  const labels = [
    ...hazards.map((h) => `H-${h}`),
    ...incidents.map((i) => `I-${i}`),
  ];

  return { labels, source, target, value };
}

export function LinksSankey({ height = 420 }: { height?: number }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["conversion-links"],
    queryFn: getConversionLinks,
  });

  if (isLoading) return <div className="h-[200px] grid place-items-center text-muted-foreground">Loading sankey…</div>;
  if (isError) return (
    <div className="h-[200px] grid place-items-center text-destructive">
      <div className="text-center">
        <div className="font-medium mb-2">Failed to load links</div>
        <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
        <button onClick={() => refetch()} className="mt-3 text-xs underline">Retry</button>
      </div>
    </div>
  );

  const edges = Array.isArray((data as any)?.edges) ? (data as any).edges : Array.isArray(data) ? (data as any) : [];
  if (!edges.length) return <div className="h-[200px] grid place-items-center text-muted-foreground">No edge list available for Sankey</div>;

  const { labels, source, target, value } = buildSankeyFromEdges(edges);

  return (
    <Plot
      data={[{
        type: "sankey",
        orientation: "h",
        node: { label: labels, pad: 12, thickness: 12 },
        link: { source, target, value },
      } as any]}
      layout={{
        autosize: true,
        height,
        margin: { l: 40, r: 20, t: 40, b: 40 },
        title: { text: "Hazards → Incidents Sankey", x: 0.02 },
      }}
      config={{ responsive: true, displayModeBar: true }}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}
