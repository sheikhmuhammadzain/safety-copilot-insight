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
  const [sendRaw, setSendRaw] = useState(false);

  // Allow insights only if we have an endpoint in meta
  const canRequest = useMemo(() => {
    const hasEndpoint = !!(meta as any)?.endpoint;
    return hasEndpoint;
  }, [meta]);

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
      const ep = (meta as any)?.endpoint as string | undefined;
      const params = (meta as any)?.params as Record<string, any> | undefined;
      
      // Use GET endpoint if available
      if (ep) {
        const res = await getChartInsightsForEndpoint(ep, params);
        setMarkdown(res?.insights_md || "No insights returned.");
        // Save to cache after a successful generation
        try {
          const key = cacheKey;
          if (key && res?.insights_md) localStorage.setItem(key, res.insights_md);
        } catch {}
      } else {
        setError("No insights endpoint available for this chart.");
      }
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
            setLoading(false);
          }
          return; // don't hit the API until user clicks re-generate
        }

        setLoading(true);
        const ep = (meta as any)?.endpoint as string | undefined;
        const params = (meta as any)?.params as Record<string, any> | undefined;
        
        // Use GET endpoint only
        if (ep) {
          const res = await getChartInsightsForEndpoint(ep, params);
          if (!cancelled) {
            setMarkdown(res?.insights_md || "No insights returned.");
            try {
              if (cacheKey && res?.insights_md) localStorage.setItem(cacheKey, res.insights_md);
            } catch {}
          }
        } else {
          if (!cancelled) setError("No insights endpoint available for this chart.");
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
  }, [open, canRequest, cacheKey, meta]);

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
        <div className="flex items-center justify-end mb-2">
          <div className="flex items-center gap-2">
            <button className="text-xs underline" onClick={generate} disabled={loading || !canRequest}>Re-generate</button>
            {cacheKey && (
              <button
                className="text-xs underline"
                disabled={loading}
                onClick={async () => {
                  try { if (cacheKey) localStorage.removeItem(cacheKey); } catch {}
                  setMarkdown("");
                  await generate();
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
      </DialogContent>
    </Dialog>
  );
}
