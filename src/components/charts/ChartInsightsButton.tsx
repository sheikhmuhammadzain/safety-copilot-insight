import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getChartInsightsForEndpoint, postChartInsights } from "@/lib/api";

export function ChartInsightsButton({
  figure,
  title,
  context,
  meta,
  size = "sm",
}: {
  figure: any | undefined;
  title?: string;
  context?: string;
  meta?: Record<string, any>;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const [sendRaw, setSendRaw] = useState(false);
  const [usedCache, setUsedCache] = useState(false);

  const canRequest = useMemo(() => !!figure && typeof figure === "object" && Array.isArray(figure.data), [figure]);

  const sanitizeFigure = (fig: any) => {
    try {
      const copy = JSON.parse(JSON.stringify(fig));
      if (Array.isArray(copy.data)) {
        copy.data = copy.data.map((tr: any) => {
          const t = { ...tr };
          if (Array.isArray(t.y)) {
            t.y = t.y.map((v: any) => {
              const n = Number(v);
              return Number.isFinite(n) ? n : null;
            });
          }
          if (Array.isArray(t.x)) {
            t.x = t.x.map((v: any) => (v === undefined ? null : v));
          }
          return t;
        });
      }
      return copy;
    } catch {
      return fig;
    }
  };

  const buildPayload = () => {
    const fig = sendRaw ? figure : sanitizeFigure(figure);
    return {
      figure: fig,
      title,
      context: context ?? (meta ? `meta: ${JSON.stringify(meta)}` : undefined),
    };
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      // Prefer GET /<endpoint>/insights if meta.endpoint exists
      let res;
      const ep = (meta as any)?.endpoint as string | undefined;
      const params = (meta as any)?.params as Record<string, any> | undefined;
      try {
        if (ep) {
          res = await getChartInsightsForEndpoint(ep, params);
        }
      } catch (_) {
        // swallow and fallback to POST
      }
      if (!res) {
        res = await postChartInsights(buildPayload());
      }
      setMarkdown(res?.insights_md || "No insights returned.");
      // Save to cache after a successful generation
      try {
        const key = cacheKey;
        if (key && res?.insights_md) localStorage.setItem(key, res.insights_md);
        setUsedCache(false);
      } catch {}
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  // Build a stable cache key based on title + endpoint + params
  const cacheKey = useMemo(() => {
    try {
      const endpoint = (meta as any)?.endpoint ?? "";
      const params = (meta as any)?.params ?? {};
      const paramsStr = JSON.stringify(params);
      const t = title ?? "";
      return `insights:${t}|${endpoint}|${paramsStr}`;
    } catch {
      return title ? `insights:${title}` : "";
    }
  }, [title, meta]);

  useEffect(() => {
    if (!open || !canRequest) return;
    let cancelled = false;
    (async () => {
      try {
        setError("");
        // Try cache first
        let cached: string | null = null;
        try {
          if (cacheKey) cached = localStorage.getItem(cacheKey);
        } catch {}
        if (cached) {
          if (!cancelled) {
            setMarkdown(cached);
            setUsedCache(true);
            setLoading(false);
          }
          return; // don't hit the API until user clicks re-generate
        }

        setLoading(true);
        // Prefer GET per-chart endpoint
        let res;
        const ep = (meta as any)?.endpoint as string | undefined;
        const params = (meta as any)?.params as Record<string, any> | undefined;
        try {
          if (ep) {
            res = await getChartInsightsForEndpoint(ep, params);
          }
        } catch (_) {
          // ignore and fallback
        }
        if (!res) {
          res = await postChartInsights(buildPayload());
        }
        if (!cancelled) {
          setMarkdown(res?.insights_md || "No insights returned.");
          try {
            if (cacheKey && res?.insights_md) localStorage.setItem(cacheKey, res.insights_md);
          } catch {}
          setUsedCache(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, canRequest, figure, title, context, sendRaw, cacheKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant="outline" disabled={!canRequest} title={canRequest ? "Get insights" : "Figure unavailable"}>
          <Lightbulb className="h-4 w-4 mr-1" /> Insights
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[min(92vw,42rem)] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title ? `Insights for ${title}` : "Chart Insights"}</DialogTitle>
          <DialogDescription>Generated summary, top contributors, trends, and recommendations.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Mode: {sendRaw ? "Raw figure" : "Sanitized figure"}</span>
            {usedCache && <span className="rounded bg-muted px-1.5 py-0.5">Using cached</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Send raw</label>
            <input type="checkbox" checked={sendRaw} onChange={(e) => setSendRaw(e.target.checked)} />
            <button className="text-xs underline" onClick={generate} disabled={loading || !canRequest}>Re-generate</button>
            {cacheKey && (
              <button
                className="text-xs underline"
                onClick={() => {
                  try { localStorage.removeItem(cacheKey); } catch {}
                  setUsedCache(false);
                }}
              >
                Clear cache
              </button>
            )}
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="h-[180px] grid place-items-center text-muted-foreground">Generating insights…</div>
          ) : error ? (
            <div className="text-destructive text-sm">{error}</div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert break-words">
              <ReactMarkdown>{markdown || "No content."}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <button className="underline" onClick={() => setShowDebug((v) => !v)}>{showDebug ? "Hide" : "Show"} debug</button>
          {showDebug && (
            <div className="mt-2 max-h-64 overflow-auto bg-muted/40 p-2 rounded">
              <pre>{JSON.stringify({
                title,
                context,
                meta,
                hasFigure: !!figure,
                traces: Array.isArray(figure?.data) ? figure.data.length : 0,
                payloadPreview: (() => {
                  const payload = buildPayload();
                  const d0 = payload?.figure?.data?.[0] ?? {};
                  const preview: any = {
                    firstTraceType: d0.type,
                    firstTraceName: d0.name,
                    xLen: Array.isArray(d0.x) ? d0.x.length : undefined,
                    yLen: Array.isArray(d0.y) ? d0.y.length : undefined,
                    ySample: Array.isArray(d0.y) ? d0.y.slice(0, 5) : undefined,
                  };
                  return preview;
                })(),
                willUse: (meta as any)?.endpoint ? `${(meta as any)?.endpoint}/insights?${new URLSearchParams(((meta as any)?.params)||{}).toString()}` : "POST /analytics/insights",
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
