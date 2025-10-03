import { useMemo } from "react";
import { format, parseISO } from "date-fns";

interface RawRecord {
  occurrence_date?: string;
  date_reported?: string;
  entered_date?: string;
  department?: string;
  incident_type?: string;
  violation_type?: string;
  title?: string;
  description?: string;
  severity_score?: number;
  risk_score?: number;
  [key: string]: any;
}

interface TooltipDetail {
  month: string;
  total_count: number;
  departments: Array<{ name: string; count: number }>;
  types: Array<{ name: string; count: number }>;
  severity: { avg: number; max: number; min: number };
  risk: { avg: number; max: number; min: number };
  recent_items: Array<{
    title: string;
    department: string;
    date: string;
    severity: number;
  }>;
}

export function useTooltipDetails(
  rawData: RawRecord[] | null | undefined,
  datasetType: "incident" | "hazard"
): TooltipDetail[] {
  return useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    // Group by month
    const monthGroups = new Map<string, RawRecord[]>();

    rawData.forEach((record) => {
      // Try multiple date fields
      const dateStr =
        record.occurrence_date ||
        record.date_reported ||
        record.entered_date ||
        record.start_date;

      if (!dateStr) return;

      try {
        const date = parseISO(dateStr);
        const monthKey = format(date, "yyyy-MM");
        
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, []);
        }
        monthGroups.get(monthKey)!.push(record);
      } catch {
        // Skip invalid dates
      }
    });

    // Process each month
    const details: TooltipDetail[] = [];

    monthGroups.forEach((records, month) => {
      // Count by department
      const deptCounts = new Map<string, number>();
      records.forEach((r) => {
        const dept = r.department || "Unknown";
        deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
      });

      // Count by type
      const typeCounts = new Map<string, number>();
      records.forEach((r) => {
        const typeField = datasetType === "incident" ? "incident_type" : "violation_type";
        const type = r[typeField] || "Unknown";
        
        // Handle comma-separated types
        const types = String(type).split(",").map((t) => t.trim());
        types.forEach((t) => {
          if (t) typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
        });
      });

      // Calculate severity stats
      const severities = records
        .map((r) => r.severity_score)
        .filter((s): s is number => typeof s === "number" && !isNaN(s));

      const severityStats = severities.length > 0
        ? {
            avg: severities.reduce((a, b) => a + b, 0) / severities.length,
            max: Math.max(...severities),
            min: Math.min(...severities),
          }
        : { avg: 0, max: 0, min: 0 };

      // Calculate risk stats
      const risks = records
        .map((r) => r.risk_score)
        .filter((r): r is number => typeof r === "number" && !isNaN(r));

      const riskStats = risks.length > 0
        ? {
            avg: risks.reduce((a, b) => a + b, 0) / risks.length,
            max: Math.max(...risks),
            min: Math.min(...risks),
          }
        : { avg: 0, max: 0, min: 0 };

      // Get recent items (sorted by date, take last 3)
      const sortedRecords = [...records].sort((a, b) => {
        const dateA = a.occurrence_date || a.date_reported || a.entered_date || "";
        const dateB = b.occurrence_date || b.date_reported || b.entered_date || "";
        return dateB.localeCompare(dateA);
      });

      const recent_items = sortedRecords.slice(0, 3).map((r) => ({
        title: r.title || r.description || "No title",
        department: r.department || "Unknown",
        date: r.occurrence_date || r.date_reported || r.entered_date || "",
        severity: r.severity_score || 0,
      }));

      details.push({
        month,
        total_count: records.length,
        departments: Array.from(deptCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        types: Array.from(typeCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
        severity: severityStats,
        risk: riskStats,
        recent_items,
      });
    });

    return details.sort((a, b) => a.month.localeCompare(b.month));
  }, [rawData, datasetType]);
}
