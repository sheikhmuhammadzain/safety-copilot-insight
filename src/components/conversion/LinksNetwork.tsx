import Plot from "react-plotly.js";
import { useQuery } from "@tanstack/react-query";
import { getConversionLinks } from "@/lib/api";

function buildBipartite(edges: any[]) {
  const hazards: string[] = [];
  const incidents: string[] = [];
  const hDeg = new Map<string, number>();
  const iDeg = new Map<string, number>();

  for (const e of edges) {
    const h = String(e.hazard ?? e.hazard_id ?? e.hazard_uid ?? "");
    const i = String(e.incident ?? e.incident_id ?? e.incident_uid ?? "");
    if (!h || !i) continue;
    hDeg.set(h, (hDeg.get(h) ?? 0) + 1);
    iDeg.set(i, (iDeg.get(i) ?? 0) + 1);
  }

  hazards.push(...Array.from(hDeg.keys()).sort((a, b) => (hDeg.get(b)! - hDeg.get(a)!)));
  incidents.push(...Array.from(iDeg.keys()).sort((a, b) => (iDeg.get(b)! - iDeg.get(a)!)));

  const hPos = new Map<string, number>();
  const iPos = new Map<string, number>();
  hazards.forEach((h, idx) => hPos.set(h, idx));
  incidents.forEach((i, idx) => iPos.set(i, idx));

  const hY = hazards.map((_, idx) => idx / Math.max(1, hazards.length - 1));
  const iY = incidents.map((_, idx) => idx / Math.max(1, incidents.length - 1));

  // Node traces
  const hazardTrace: any = {
    type: "scatter",
    mode: "markers+text",
    x: new Array(hazards.length).fill(0),
    y: hY,
    text: hazards.map((h) => `H-${h}`),
    textposition: "middle right",
    textfont: { size: 10 },
    marker: { size: 8, color: "#f97316" },
    hoverinfo: "text",
  };

  const incidentTrace: any = {
    type: "scatter",
    mode: "markers+text",
    x: new Array(incidents.length).fill(1),
    y: iY,
    text: incidents.map((i) => `I-${i}`),
    textposition: "middle left",
    textfont: { size: 10 },
    marker: { size: 8, color: "#22c55e" },
    hoverinfo: "text",
  };

  // Edge segments
  const lineX: number[] = [];
  const lineY: number[] = [];
  const text: string[] = [];
  for (const e of edges) {
    const h = String(e.hazard ?? e.hazard_id ?? e.hazard_uid ?? "");
    const i = String(e.incident ?? e.incident_id ?? e.incident_uid ?? "");
    if (!hPos.has(h) || !iPos.has(i)) continue;
    lineX.push(0, 1, NaN);
    lineY.push(hY[hPos.get(h)!], iY[iPos.get(i)!], NaN);
    text.push(`${h} → ${i}`);
  }

  const edgeTrace: any = {
    type: "scatter",
    mode: "lines",
    x: lineX,
    y: lineY,
    line: { color: "#94a3b8", width: 1 },
    hoverinfo: "skip",
  };

  return { hazardTrace, incidentTrace, edgeTrace };
}

export function LinksNetwork({ height = 420 }: { height?: number }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["conversion-links"],
    queryFn: getConversionLinks,
  });

  if (isLoading) return <div className="h-[200px] grid place-items-center text-muted-foreground">Loading network…</div>;
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
  if (!edges.length) return <div className="h-[200px] grid place-items-center text-muted-foreground">No edge list available for Network</div>;

  const { hazardTrace, incidentTrace, edgeTrace } = buildBipartite(edges);

  return (
    <Plot
      data={[edgeTrace, hazardTrace, incidentTrace]}
      layout={{
        autosize: true,
        height,
        margin: { l: 40, r: 20, t: 40, b: 40 },
        title: { text: "Hazard–Incident Bipartite Network", x: 0.02 },
        xaxis: { range: [-0.1, 1.1], visible: false },
        yaxis: { range: [-0.05, 1.05], visible: false },
        showlegend: false,
      }}
      config={{ responsive: true, displayModeBar: true }}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}
