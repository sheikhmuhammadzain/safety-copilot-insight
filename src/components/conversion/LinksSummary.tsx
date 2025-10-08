import { useQuery } from "@tanstack/react-query";
import { getConversionLinks } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartInsightsButton } from "@/components/charts/ChartInsightsButton";

export function LinksSummary({ className }: { className?: string }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["conversion-links"],
    queryFn: getConversionLinks,
  });

  if (isLoading) return <div className="h-[140px] grid place-items-center text-muted-foreground">Loading relationship data…</div>;
  if (isError) return (
    <div className="h-[160px] grid place-items-center text-destructive">
      <div className="text-center">
        <div className="font-medium mb-2">Failed to load relationship data</div>
        <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
        <button className="mt-3 text-xs underline" onClick={() => refetch()}>Retry</button>
      </div>
    </div>
  );

  const obj = data as any;
  const edges = Array.isArray(obj) ? obj : Array.isArray(obj?.edges) ? obj.edges : undefined;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Hazard–Incident Links {isFetching && <span className="text-xs text-muted-foreground">(refreshing)</span>}
          </CardTitle>
          <ChartInsightsButton 
            figure={undefined}
            title="Hazard-Incident Links"
            meta={{ endpoint: "/analytics/conversion/links" }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xs text-muted-foreground">Total Links</div>
            <div className="text-2xl font-bold">{obj?.total ?? (edges ? edges.length : "-")}</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xs text-muted-foreground">Unique Hazards</div>
            <div className="text-2xl font-bold">{obj?.unique_hazards ?? "-"}</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-xs text-muted-foreground">Unique Incidents</div>
            <div className="text-2xl font-bold">{obj?.unique_incidents ?? "-"}</div>
          </div>
        </div>

        {edges && edges.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium mb-2">Sample Links</div>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hazard</TableHead>
                    <TableHead>Incident</TableHead>
                    <TableHead>Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edges.slice(0, 10).map((e: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{e.hazard ?? e.hazard_id ?? e.hazard_uid ?? "-"}</TableCell>
                      <TableCell>{e.incident ?? e.incident_id ?? e.incident_uid ?? "-"}</TableCell>
                      <TableCell>{e.weight ?? e.count ?? 1}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
