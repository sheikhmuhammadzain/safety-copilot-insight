import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type Fetcher<T = any> = (limit?: number) => Promise<T[]>;

function getField(obj: any, keys: string[], fallback = "-"): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return fallback;
}

export function RecentList({ title, fetcher, limit = 5 }: { title: string; fetcher: Fetcher; limit?: number }) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["recent", title.toLowerCase(), limit],
    queryFn: () => fetcher(limit),
  });

  const items = Array.isArray(data) ? data.slice(0, limit) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {title} {isFetching && <span className="text-xs text-muted-foreground">(refreshing)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[140px] grid place-items-center text-muted-foreground">Loading…</div>
        ) : isError ? (
          <div className="h-[160px] grid place-items-center text-destructive">
            <div className="text-center">
              <div className="font-medium mb-2">Failed to load</div>
              <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="h-[120px] grid place-items-center text-muted-foreground">No records</div>
        ) : (
          <div className="divide-y">
            {items.map((it, idx) => {
              const id = getField(it, ["id", "_id", "uid"], String(idx));
              const date = getField(it, ["date", "created_at", "reported_at", "occurred_at"], "");
              const dept = getField(it, ["department", "dept", "area", "location"], "");
              const status = getField(it, ["status", "state"], "");
              const title = getField(it, ["title", "summary", "description", "name"], "Record");
              return (
                <div key={id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-3">
                      {date && <span>{date}</span>}
                      {dept && <span>{dept}</span>}
                      {status && <span className="uppercase tracking-wide">{status}</span>}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">#{id}</div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
