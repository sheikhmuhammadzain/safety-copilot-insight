import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDepartmentWordcloud } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Cloud } from "lucide-react";

export default function Wordclouds() {
  const [topN, setTopN] = useState<number>(50);
  const [minCount, setMinCount] = useState<number>(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["wordclouds", topN, minCount],
    queryFn: () => getDepartmentWordcloud({ top_n: topN, min_count: minCount }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Department Wordclouds</h1>
                <p className="text-sm text-muted-foreground">Incidents and Hazards</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="topn">Top N</label>
              <Input id="topn" type="number" min={1} value={topN} onChange={(e) => setTopN(Number(e.target.value))} className="w-24" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="mincount">Min Count</label>
              <Input id="mincount" type="number" min={1} value={minCount} onChange={(e) => setMinCount(Number(e.target.value))} className="w-24" />
            </div>
            <Button onClick={() => refetch()} variant="default" disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Apply"}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Incidents by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[520px] grid place-items-center text-muted-foreground">Loading wordcloud…</div>
              ) : isError ? (
                <div className="h-[520px] grid place-items-center text-destructive">
                  <div>
                    <div className="font-medium mb-2">Failed to load incidents wordcloud</div>
                    <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
                    <Button className="mt-3" size="sm" onClick={() => refetch()}>Retry</Button>
                  </div>
                </div>
              ) : data?.html_incident ? (
                <div className="overflow-auto rounded-md border" dangerouslySetInnerHTML={{ __html: data.html_incident }} />
              ) : (
                <div className="h-[520px] grid place-items-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Hazards by Department</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[520px] grid place-items-center text-muted-foreground">Loading wordcloud…</div>
              ) : isError ? (
                <div className="h-[520px] grid place-items-center text-destructive">
                  <div>
                    <div className="font-medium mb-2">Failed to load hazards wordcloud</div>
                    <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
                    <Button className="mt-3" size="sm" onClick={() => refetch()}>Retry</Button>
                  </div>
                </div>
              ) : data?.html_hazard ? (
                <div className="overflow-auto rounded-md border" dangerouslySetInnerHTML={{ __html: data.html_hazard }} />
              ) : (
                <div className="h-[520px] grid place-items-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
