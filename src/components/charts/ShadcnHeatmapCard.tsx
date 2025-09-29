import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCachedGet } from "@/hooks/useCachedGet";
import { Palette } from "lucide-react";

type HeatmapResponse = {
  x: string[]; // columns (e.g., months)
  y: string[]; // rows (e.g., departments)
  z: number[][]; // matrix y x
  metric?: string; // "avg" | "count" | etc.
};

// Fetches will use the shared api client

export default function ShadcnHeatmapCard({
  title = "Sample Heatmap",
  endpoint = "/api/heatmap",
  params,
  height = 360,
  cellSize = 43,
  showLegend = true,
  lowLabel = "Low",
  highLabel = "High",
  refreshKey,
}: {
  title?: string;
  endpoint?: string;
  params?: Record<string, any>;
  height?: number;
  /** size in px of each square cell */
  cellSize?: number;
  showLegend?: boolean;
  lowLabel?: string;
  highLabel?: string;
  refreshKey?: number;
}) {
  const { data, error, loading } = useCachedGet<HeatmapResponse>(endpoint, params, undefined, refreshKey);

  // hover/focus state for keyboard & hover highlights
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);
  const [tooltip, setTooltip] = useState<{ left: number; top: number; text: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // fetching handled by useCachedGet

  // parse / sanitize data and compute stats
  const { xLabels, yLabels, values, min, max } = useMemo(() => {
    if (!data) return { xLabels: [] as string[], yLabels: [] as string[], values: [] as number[][], min: 0, max: 0 };

    // remove bad columns like NaT/null
    const keepX: number[] = [];
    data.x.forEach((lbl, i) => {
      if (lbl != null && String(lbl).toLowerCase() !== "nat" && String(lbl).trim() !== "") {
        keepX.push(i);
      }
    });

    const xLabels = keepX.map((i) => data.x[i]);
    const yLabels = data.y ? [...data.y] : [];

    // normalize values matrix to ensure every row has the same length
    const values = (data.z || []).map((row) => keepX.map((i) => {
      const v = row?.[i];
      if (v == null || Number.isNaN(Number(v))) return 0;
      return Number(v);
    }));

    let _min = Infinity;
    let _max = -Infinity;
    
    values.forEach((row) => row.forEach((v) => {
      if (v < _min) _min = v;
      if (v > _max) _max = v;
    }));

    if (!isFinite(_min)) _min = 0;
    if (!isFinite(_max)) _max = 0;

    return { xLabels, yLabels, values, min: _min, max: _max };
  }, [data]);

  // palette: Viridis-like (accessible), last color for high values
  const scale = useMemo(() => [
    "#440154",
    "#3b528b",
    "#21918c",
    "#5cc863",
    "#fde725",
  ], []);

  const zeroColor = "rgba(255, 255, 255, 0.05)";

  // helpers for color interpolation between two hexes
  function hexToRgb(hex: string) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  
  function rgbToHex(r: number, g: number, b: number) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }
  
  function interpolateHex(a: string, b: string, t: number) {
    const A = hexToRgb(a);
    const B = hexToRgb(b);
    return rgbToHex(
      A[0] + (B[0] - A[0]) * t, 
      A[1] + (B[1] - A[1]) * t, 
      A[2] + (B[2] - A[2]) * t
    );
  }

  // value formatter: keep up to 2 decimals, trim trailing zeros
  function fmtValue(n: number) {
    const s = Number(n).toFixed(2);
    return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function colorFor(v: number) {
    if (v === 0) return zeroColor;
    if (max <= min) return scale[0];
    const t = (v - min) / (max - min);
    const steps = scale.length - 1;
    const pos = Math.max(0, Math.min(1, t)) * steps;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    if (idx >= scale.length - 1) return scale[scale.length - 1];
    return interpolateHex(scale[idx], scale[idx + 1], frac);
  }

  // compute legend thresholds (equal intervals)
  const thresholds = useMemo(() => {
    const n = Math.max(1, scale.length);
    if (max <= min) return new Array(n).fill(min);
    const arr = [] as number[];
    for (let i = 0; i < n; i++) {
      arr.push(min + (i / (n - 1)) * (max - min));
    }
    return arr;
  }, [min, max, scale.length]);

  // small helpers for accessibility text
  function cellAriaLabel(r: number, c: number, v: number) {
    const col = xLabels[c] ?? c;
    const row = yLabels[r] ?? r;
    const metric = data?.metric ? ` (${data.metric})` : '';
    return `${row}, ${col}: ${v.toLocaleString()}${metric}`;
  }

  // keyboard: show tooltip when cell focused or enter pressed
  function handleCellFocus(e: React.FocusEvent, r: number, c: number, v: number) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({ 
      left: rect.left + rect.width / 2, 
      top: rect.top - 10, 
      text: cellAriaLabel(r, c, v) 
    });
    setHovered({ r, c });
  }
  
  function handleCellBlur() {
    setTooltip(null);
    setHovered(null);
  }

  // loading skeleton helper
  const renderSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 w-48 rounded bg-slate-700/40 mb-3"></div>
      <div className="grid grid-cols-[200px_repeat(6,32px)] gap-1">
        <div className="h-6 w-full rounded bg-slate-700/20" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 w-8 rounded bg-slate-700/20" />
        ))}
        {Array.from({ length: 6 }).map((_, r) => (
          <React.Fragment key={r}>
            <div className="h-6 w-full rounded bg-slate-700/20" />
            {Array.from({ length: 6 }).map((_, c) => (
              <div key={c} className="h-6 w-8 rounded bg-slate-700/20" />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="w-full border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {loading && renderSkeleton()}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        {!loading && !error && xLabels.length > 0 && (
          <div className="relative">
            <div 
              ref={scrollRef} 
              className="overflow-auto border border-slate-200 rounded-lg" 
              style={{ maxHeight: height }}
            >
              <div
                className="inline-grid min-w-max"
                style={{
                  gridTemplateColumns: `200px repeat(${xLabels.length}, ${cellSize}px)`,
                }}
                role="grid"
                aria-label={title}
              >
                {/* top-left corner */}
                <div className="sticky top-0 left-0 z-30 bg-slate-50 px-2 py-1 text-xs text-slate-600 border-b border-r border-slate-200 font-medium">
                  {data?.metric ? `Metric: ${data.metric}` : "Values"}
                </div>

                {/* column headers */}
                {xLabels.map((x, xi) => (
                  <div
                    key={xi}
                    className={`sticky top-0 z-20 px-1 py-1 text-[10px] text-slate-700 border-b border-r border-slate-200 text-center truncate font-medium ${
                      hovered?.c === xi ? 'bg-blue-50' : 'bg-slate-50'
                    }`}
                    title={String(x)}
                    role="columnheader"
                  >
                    {x}
                  </div>
                ))}

                {/* rows */}
                {yLabels.map((y, yi) => (
                  <React.Fragment key={yi}>
                    {/* row header */}
                    <div
                      className={`sticky left-0 z-20 bg-slate-50 px-2 py-1 text-xs text-slate-700 border-b border-r border-slate-200 truncate font-medium ${
                        hovered?.r === yi ? 'bg-blue-50' : ''
                      }`}
                      title={y}
                      role="rowheader"
                    >
                      {y}
                    </div>

                    {/* cells */}
                    {xLabels.map((_, xi) => {
                      const v = values[yi]?.[xi] ?? 0;
                      const bg = colorFor(v);
                      const isHovered = hovered && (hovered.r === yi || hovered.c === xi);
                      // Force white text for better visibility on colored cells
                      const textColor = v > 0 ? 'white' : 'white';
                      
                      return (
                        <div
                          key={`c-${yi}-${xi}`}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={cellAriaLabel(yi, xi, v)}
                          onFocus={(e) => handleCellFocus(e, yi, xi, v)}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).focus();
                            }
                          }}
                          onMouseEnter={(e) => {
                            setHovered({ r: yi, c: xi });
                            setTooltip({ 
                              left: e.clientX, 
                              top: e.clientY - 10, 
                              text: cellAriaLabel(yi, xi, v) 
                            });
                          }}
                          onMouseMove={(e) => {
                            setTooltip((t) => 
                              t ? { ...t, left: e.clientX, top: e.clientY - 10 } : 
                              { left: e.clientX, top: e.clientY - 10, text: cellAriaLabel(yi, xi, v) }
                            );
                          }}
                          onMouseLeave={() => {
                            setHovered(null);
                            setTooltip(null);
                          }}
                          style={{
                            width: cellSize,
                            height: cellSize,
                            backgroundColor: bg,
                            color: textColor,
                          }}
                          className={`border-b border-r border-slate-200 flex items-center justify-center text-[9px] font-medium overflow-hidden transition-all duration-150 cursor-pointer ${
                            isHovered ? 'ring-2 ring-blue-400 ring-inset scale-105' : ''
                          }`}
                          title={cellAriaLabel(yi, xi, v)}
                        >
                          {v > 0 ? fmtValue(v) : ''}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Tooltip */}
            {tooltip && (
              <div
                className="pointer-events-none fixed z-[1000] max-w-xs rounded-md border border-slate-300 bg-slate-900 px-2 py-1 text-xs text-white shadow-lg"
                style={{ 
                  left: Math.max(8, tooltip.left - 50), 
                  top: Math.max(8, tooltip.top - 30) 
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>
        )}

        {!loading && !error && xLabels.length === 0 && (
          <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg">
            No data to display
          </div>
        )}
      </CardContent>
      
      {showLegend && !loading && !error && xLabels.length > 0 && (
        <CardFooter className="flex justify-between items-center pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-600">
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">Scale</span>
            <span className="text-xs text-slate-500">
              {min.toLocaleString()} - {max.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: scale[0] }} />
              <span className="text-xs text-slate-600">{lowLabel}</span>
            </div>
            <div className="h-3 w-40 rounded-full overflow-hidden border border-slate-300">
              <div className="h-full" style={{ background: `linear-gradient(90deg, ${scale.join(',')})` }} />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: scale[scale.length - 1] }} />
              <span className="text-xs text-slate-600">{highLabel}</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}