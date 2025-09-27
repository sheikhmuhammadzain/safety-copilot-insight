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
import { postChartInsights, getPlotly } from "@/lib/api";

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
  const [sendRaw, setSendRaw] = useState(true);
  const [usedCache, setUsedCache] = useState(false);
  const [sourceFigure, setSourceFigure] = useState<any>(figure);
  const [ensureNumeric, setEnsureNumeric] = useState(true);

  const canRequest = useMemo(() => {
    const hasFig = !!figure && typeof figure === "object" && Array.isArray(figure.data);
    const hasEndpoint = !!(meta as any)?.endpoint;
    return hasFig || hasEndpoint;
  }, [figure, meta]);

  // Parses formatted numbers like "2M", "3.4k", "$1,234", "45%", "−5×10^18" into real numbers.
  const coerceSmart = (val: any): number | null => {
    if (val == null) return null;
    if (typeof val === "number") return Number.isFinite(val) ? val : null;
    if (typeof val !== "string") {
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    }
    let s = val.toString().trim();
    if (!s) return null;
    // Normalize unicode minus
    s = s.replace(/\u2212/g, "-");
    // Parentheses negative e.g., (123)
    let negative = false;
    if (s.startsWith("(") && s.endsWith(")")) {
      negative = true;
      s = s.slice(1, -1);
    }
    // Scientific like 5×10^18 or 5 x10^18
    const sci = s.match(/^\s*([+-]?[0-9]*\.?[0-9]+)\s*(?:[x×]\s*10\s*\^\s*([+-]?[0-9]+))\s*%?\s*$/i);
    if (sci) {
      const base = parseFloat(sci[1]);
      const exp = parseInt(sci[2], 10);
      let n = Number.isFinite(base) && Number.isFinite(exp) ? base * Math.pow(10, exp) : NaN;
      if (negative) n = -n;
      return Number.isFinite(n) ? n : null;
    }
    // Remove currency and spaces/commas
    s = s.replace(/[$€£₹\s,]/g, "");
    // Percent
    let isPct = false;
    if (s.endsWith("%")) {
      isPct = true;
      s = s.slice(0, -1);
    }
    // Suffix multipliers
    let mul = 1;
    const suf = s.match(/([kKmMbBtT])$/);
    if (suf) {
      const ch = suf[1].toLowerCase();
      if (ch === "k") mul = 1e3;
      else if (ch === "m") mul = 1e6;
      else if (ch === "b") mul = 1e9;
      else if (ch === "t") mul = 1e12;
      s = s.slice(0, -1);
    }
    let n = parseFloat(s);
    if (!Number.isFinite(n)) return null;
    n *= mul;
    if (negative) n = -n;
    if (isPct) {
      // keep as 0-100 value for readability/insights
      // if you prefer 0-1, divide by 100 here
      n = n;
    }
    return Number.isFinite(n) ? n : null;
  };

  const sanitizeFigure = (fig: any) => {
    try {
      const copy = JSON.parse(JSON.stringify(fig));
      if (Array.isArray(copy.data)) {
        copy.data = copy.data.map((tr: any) => {
          const t = { ...tr };
          const coerce = coerceSmart;
          if (Array.isArray(t.y)) {
            t.y = t.y.map(coerce);
          }
          if (Array.isArray(t.x)) {
            t.x = t.x.map((v: any) => (v === undefined ? null : v));
          }
          if (Array.isArray(t.values)) {
            t.values = t.values.map(coerce);
          }
          if (t?.marker && Array.isArray(t.marker.size)) {
            t.marker = { ...t.marker, size: t.marker.size.map(coerce) };
          }
          if (Array.isArray(t.z)) {
            t.z = t.z.map((row: any) => (Array.isArray(row) ? row.map(coerce) : coerce(row)));
          }
          return t;
        });
      }
      return copy;
    } catch {
      return fig;
    }
  };

  const computeClientSummary = (fig: any) => {
    try {
      const traces = Array.isArray(fig?.data) ? fig.data : [];
      const parts: string[] = [];
      traces.slice(0, 6).forEach((tr: any, idx: number) => {
        const nums: number[] = [];
        const pushNums = (arr: any) => {
          if (Array.isArray(arr)) {
            for (const v of arr) {
              if (Array.isArray(v)) pushNums(v);
              else {
                const n = Number(v);
                if (Number.isFinite(n)) nums.push(n);
              }
            }
          }
        };
        pushNums(tr?.y);
        pushNums(tr?.z);
        pushNums(tr?.values);
        pushNums(tr?.marker?.size);
        if (nums.length) {
          let min = nums[0], max = nums[0], sum = 0;
          for (const n of nums) { if (n < min) min = n; if (n > max) max = n; sum += n; }
          const mean = sum / nums.length;
          parts.push(`trace ${idx} (${tr?.type || 'unknown'}${tr?.name ? `:${tr.name}` : ''}) n=${nums.length} min=${min} max=${max} mean=${mean.toFixed(2)}`);
        } else {
          parts.push(`trace ${idx} (${tr?.type || 'unknown'}${tr?.name ? `:${tr.name}` : ''}) no numeric series detected`);
        }
      });
      return parts.join("\n");
    } catch {
      return "";
    }
  };

  const buildPayload = () => {
    const baseFig = sourceFigure ?? figure;
    const fig = ensureNumeric ? sanitizeFigure(baseFig) : (sendRaw ? baseFig : sanitizeFigure(baseFig));
    const summary = computeClientSummary(fig);
    return {
      figure: fig,
      title,
      context: [
        context ?? (meta ? `meta: ${JSON.stringify(meta)}` : undefined),
        summary ? `\nclient_summary:\n${summary}` : undefined,
      ].filter(Boolean).join("\n"),
    };
  };

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      // Always refetch the figure from the source endpoint when available to guarantee exact API data
      try {
        const endpoint = (meta as any)?.endpoint;
        const params = (meta as any)?.params;
        if (endpoint) {
          const res = await getPlotly(endpoint, params);
          setSourceFigure(res?.figure ?? figure);
        }
      } catch {
        // ignore refetch errors; fall back to provided figure
      }
      const res = await postChartInsights(buildPayload());
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
        // Fetch exact raw figure from the analytics endpoint when available
        try {
          const endpoint = (meta as any)?.endpoint;
          const params = (meta as any)?.params;
          if (endpoint) {
            const fres = await getPlotly(endpoint, params);
            if (!cancelled) setSourceFigure(fres?.figure ?? figure);
          } else {
            if (!cancelled) setSourceFigure(figure);
          }
        } catch {
          if (!cancelled) setSourceFigure(figure);
        }
        const res = await postChartInsights(buildPayload());
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title ? `Insights for ${title}` : "Chart Insights"}</DialogTitle>
          <DialogDescription>Generated summary, top contributors, trends, and recommendations.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Mode: {ensureNumeric ? "Ensure numeric" : (sendRaw ? "Raw figure" : "Sanitized figure")}</span>
            {usedCache && <span className="rounded bg-muted px-1.5 py-0.5">Using cached</span>}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Ensure numeric</label>
            <input type="checkbox" checked={ensureNumeric} onChange={(e) => setEnsureNumeric(e.target.checked)} />
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
        {loading ? (
          <div className="h-[180px] grid place-items-center text-muted-foreground">Generating insights…</div>
        ) : error ? (
          <div className="text-destructive text-sm">{error}</div>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{markdown || "No content."}</ReactMarkdown>
          </div>
        )}
        <div className="mt-3 text-xs text-muted-foreground">
          <button className="underline" onClick={() => setShowDebug((v) => !v)}>{showDebug ? "Hide" : "Show"} debug</button>
          {showDebug && (
            <div className="mt-2 max-h-64 overflow-auto bg-muted/40 p-2 rounded">
              <pre>{JSON.stringify({
                title,
                context,
                meta,
                hasFigure: !!(sourceFigure ?? figure),
                traces: Array.isArray((sourceFigure ?? figure)?.data) ? (sourceFigure ?? figure).data.length : 0,
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
              }, null, 2)}</pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
