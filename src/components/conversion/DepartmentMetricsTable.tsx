import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDepartmentMetricsData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChartInsightsButton } from "@/components/charts/ChartInsightsButton";

export function DepartmentMetricsTable() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["department-metrics-data"],
    queryFn: getDepartmentMetricsData,
  });

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<string>("department");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const rows = Array.isArray(data) ? data : [];
  const filtered = useMemo(() => {
    if (!q) return rows;
    const query = q.toLowerCase();
    return rows.filter((r: any) => String(r.department || "").toLowerCase().includes(query));
  }, [rows, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const getVal = (r: any) => r?.[sortBy];
    arr.sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === "asc" ? -1 : 1;
      if (bv == null) return sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const requestSort = (key: string) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const toCsv = () => {
    const headers = [
      "department",
      "total_hazards",
      "total_incidents",
      "conversion_rate_pct",
      "prevention_success_pct",
      "avg_hazard_severity",
      "avg_incident_severity",
    ];
    const lines = [headers.join(",")];
    for (const r of sorted) {
      lines.push(headers.map((h) => JSON.stringify(r?.[h] ?? "")).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "department-metrics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Department Metrics {isFetching && <span className="text-xs text-muted-foreground">(refreshing)</span>}
          </CardTitle>
          <ChartInsightsButton 
            figure={undefined}
            title="Department Metrics"
            meta={{ endpoint: "/analytics/conversion/department-metrics-data" }}
          />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Input placeholder="Search department…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
            <button onClick={toCsv} className="text-xs underline">Export CSV</button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[160px] grid place-items-center text-muted-foreground">Loading departments…</div>
        ) : isError ? (
          <div className="h-[160px] grid place-items-center text-destructive">
            <div className="text-center">
              <div className="font-medium mb-2">Failed to load department metrics</div>
              <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
              <button className="mt-3 text-xs underline" onClick={() => refetch()}>Retry</button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="h-[120px] grid place-items-center text-muted-foreground">No data</div>
        ) : (
          <div className="rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort("department")} className="cursor-pointer">Department {sortBy==="department"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("total_hazards")} className="text-right cursor-pointer">Hazards {sortBy==="total_hazards"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("total_incidents")} className="text-right cursor-pointer">Incidents {sortBy==="total_incidents"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("conversion_rate_pct")} className="text-right cursor-pointer">Conv % {sortBy==="conversion_rate_pct"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("prevention_success_pct")} className="text-right cursor-pointer">Prev % {sortBy==="prevention_success_pct"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("avg_hazard_severity")} className="text-right cursor-pointer">Avg Hazard Sev {sortBy==="avg_hazard_severity"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                  <TableHead onClick={() => requestSort("avg_incident_severity")} className="text-right cursor-pointer">Avg Incident Sev {sortBy==="avg_incident_severity"? (sortDir==="asc"?"▲":"▼") : ""}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{r.department ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.total_hazards ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.total_incidents ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.conversion_rate_pct ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.prevention_success_pct ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.avg_hazard_severity ?? "-"}</TableCell>
                    <TableCell className="text-right">{r.avg_incident_severity ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
