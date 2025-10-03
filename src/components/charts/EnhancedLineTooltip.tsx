import { format, parseISO } from "date-fns";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TooltipDetail {
  month: string;
  total_count: number;
  departments: Array<{ name: string; count: number }>;
  types: Array<{ name: string; count: number }>;
  severity: { avg: number; max: number; min: number } | null;
  risk: { avg: number; max: number; min: number } | null;
  recent_items: Array<{
    title: string;
    department: string;
    date: string;
    severity: number | null;
  }>;
}

interface EnhancedLineTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  details?: TooltipDetail[];
  datasetType?: "incident" | "hazard";
}

export function EnhancedLineTooltip({
  active,
  payload,
  label,
  details,
  datasetType = "incident",
}: EnhancedLineTooltipProps) {
  const [expanded, setExpanded] = useState(false);

  if (!active || !payload || !payload.length) return null;

  const monthLabel = label;
  const count = payload[0]?.value || 0;

  // Find details for this month
  const monthDetails = details?.find((d) => d.month === monthLabel);

  // If no details available, show simple tooltip
  if (!monthDetails) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 pointer-events-auto">
        <p className="font-medium text-slate-900 mb-1">{monthLabel}</p>
        <p className="text-sm text-slate-700">
          {payload[0].dataKey}: {count}
        </p>
      </div>
    );
  }

  const formatMonthLabel = (month: string) => {
    try {
      return format(parseISO(month + "-01"), "MMMM yyyy");
    } catch {
      return month;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg z-[9999] max-w-xs pointer-events-auto">
      {/* Minimal Header - Always Visible */}
      <div 
        className="p-3 cursor-pointer hover:bg-slate-50 transition-colors select-none"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-slate-900 text-sm">
              {formatMonthLabel(monthLabel)}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {monthDetails.total_count} {datasetType === "incident" ? "Incidents" : "Hazards"}
            </p>
          </div>
          <div className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
        {!expanded && (
          <p className="text-[10px] text-slate-400 mt-1">Click to expand details</p>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t">
          {/* Top Departments */}
          {monthDetails.departments.length > 0 && (
            <div className="pt-3">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Top Departments:</p>
              <div className="space-y-0.5">
                {monthDetails.departments.slice(0, 3).map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">• {dept.name}</span>
                    <span className="font-medium text-slate-900">({dept.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Types */}
          {monthDetails.types.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                {datasetType === "incident" ? "Top Incident Types:" : "Top Violation Types:"}
              </p>
              <div className="space-y-0.5">
                {monthDetails.types.slice(0, 3).map((type) => (
                  <div key={type.name} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">• {type.name}</span>
                    <span className="font-medium text-slate-900">({type.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Severity & Risk Stats */}
          {(monthDetails.severity || monthDetails.risk) && (
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {monthDetails.severity && (
                  <div>
                    <p className="text-slate-600 font-semibold mb-1">Severity:</p>
                    <p className="text-slate-700">Avg: {monthDetails.severity.avg.toFixed(1)}</p>
                    <p className="text-slate-700">Max: {monthDetails.severity.max.toFixed(1)}</p>
                  </div>
                )}
                {monthDetails.risk && (
                  <div>
                    <p className="text-slate-600 font-semibold mb-1">Risk:</p>
                    <p className="text-slate-700">Avg: {monthDetails.risk.avg.toFixed(1)}</p>
                    <p className="text-slate-700">Max: {monthDetails.risk.max.toFixed(1)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Items */}
          {monthDetails.recent_items.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                Recent {datasetType === "incident" ? "Incidents" : "Hazards"}:
              </p>
              <div className="space-y-1.5">
                {monthDetails.recent_items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="text-slate-700 font-medium leading-tight">{item.title}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {item.department} | {format(parseISO(item.date), "MMM dd")} | Severity: {item.severity || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
