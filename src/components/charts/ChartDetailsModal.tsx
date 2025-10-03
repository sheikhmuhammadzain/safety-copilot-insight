import { format, parseISO } from "date-fns";
import { Calendar, TrendingUp, AlertTriangle, Building2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

interface ChartDetailsModalProps {
  open: boolean;
  onClose: () => void;
  monthDetails: TooltipDetail | null;
  datasetType: "incident" | "hazard";
}

export function ChartDetailsModal({
  open,
  onClose,
  monthDetails,
  datasetType,
}: ChartDetailsModalProps) {
  if (!monthDetails) return null;

  const formatMonthLabel = (month: string) => {
    try {
      return format(parseISO(month + "-01"), "MMMM yyyy");
    } catch {
      return month;
    }
  };

  const getSeverityColor = (avg: number) => {
    if (avg >= 4) return "text-red-600 bg-red-50";
    if (avg >= 3) return "text-orange-600 bg-orange-50";
    if (avg >= 2) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  {formatMonthLabel(monthDetails.month)}
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {monthDetails.total_count} {datasetType === "incident" ? "Incidents" : "Hazards"} Reported
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg font-semibold px-4 py-1">
              {monthDetails.total_count}
            </Badge>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Statistics Cards */}
          {(monthDetails.severity || monthDetails.risk) && (
            <div className="grid grid-cols-2 gap-4">
              {monthDetails.severity && (
                <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Severity</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Average</span>
                      <span className={`text-lg font-bold px-2 py-0.5 rounded ${getSeverityColor(monthDetails.severity.avg)}`}>
                        {monthDetails.severity.avg.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Range</span>
                      <span className="font-medium text-slate-700">
                        {monthDetails.severity.min.toFixed(1)} - {monthDetails.severity.max.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {monthDetails.risk && (
                <div className="border rounded-lg p-4 bg-gradient-to-br from-rose-50 to-red-50">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Risk</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Average</span>
                      <span className={`text-lg font-bold px-2 py-0.5 rounded ${getSeverityColor(monthDetails.risk.avg)}`}>
                        {monthDetails.risk.avg.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Range</span>
                      <span className="font-medium text-slate-700">
                        {monthDetails.risk.min.toFixed(1)} - {monthDetails.risk.max.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Departments */}
          {monthDetails.departments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Top Departments</h3>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-600 px-4 py-2 w-16">Rank</th>
                      <th className="text-left text-xs font-medium text-slate-600 px-4 py-2">Department</th>
                      <th className="text-right text-xs font-medium text-slate-600 px-4 py-2 w-24">Count</th>
                      <th className="text-right text-xs font-medium text-slate-600 px-4 py-2 w-24">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthDetails.departments.map((dept, idx) => {
                      const percentage = ((dept.count / monthDetails.total_count) * 100).toFixed(1);
                      return (
                        <tr key={dept.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">{dept.name}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{dept.count}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-600">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Types */}
          {monthDetails.types.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {datasetType === "incident" ? "Top Incident Types" : "Top Violation Types"}
                </h3>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs font-medium text-slate-600 px-4 py-2 w-16">Rank</th>
                      <th className="text-left text-xs font-medium text-slate-600 px-4 py-2">Type</th>
                      <th className="text-right text-xs font-medium text-slate-600 px-4 py-2 w-24">Count</th>
                      <th className="text-right text-xs font-medium text-slate-600 px-4 py-2 w-24">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthDetails.types.map((type, idx) => {
                      const percentage = ((type.count / monthDetails.total_count) * 100).toFixed(1);
                      return (
                        <tr key={type.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">#{idx + 1}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">{type.name}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{type.count}</td>
                          <td className="px-4 py-3 text-right text-xs text-slate-600">{percentage}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Items */}
          {monthDetails.recent_items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Recent {datasetType === "incident" ? "Incidents" : "Hazards"}
              </h3>
              <div className="space-y-3">
                {monthDetails.recent_items.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:border-primary/50 transition-colors bg-white">
                    <p className="text-sm text-slate-900 font-medium mb-2 leading-relaxed">{item.title}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" />
                        <span>{item.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{format(parseISO(item.date), "MMM dd, yyyy")}</span>
                      </div>
                      {item.severity && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">Severity: {item.severity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
