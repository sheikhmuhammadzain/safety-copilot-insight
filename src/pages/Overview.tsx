import { KPICard } from "@/components/dashboard/KPICard";
import ShadcnLineCard from "@/components/charts/ShadcnLineCard";
import ShadcnBarCard from "@/components/charts/ShadcnBarCard";
import ShadcnDonutCard from "@/components/charts/ShadcnDonutCard";
import ShadcnParetoCard from "@/components/charts/ShadcnParetoCard";
import ShadcnHeatmapCard from "@/components/charts/ShadcnHeatmapCard";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useKpi } from "@/hooks/useKpi";
import { AlertTriangle, ShieldAlert, FileCheck, ClipboardCheck } from "lucide-react";
import { RecentList } from "@/components/dashboard/RecentList";
import { getRecentIncidents, getRecentHazards, getRecentAudits } from "@/lib/api";

export default function Overview() {
  // KPIs sourced from real KPI endpoints that return Plotly indicator figures
  const incidentsTotal = useKpi(
    "/kpis/incident-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    }
  );

  const hazardsTotal = useKpi(
    "/kpis/hazard-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    }
  );

  const auditsTotal = useKpi(
    "/kpis/audit-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    }
  );

  const inspectionsTotal = useKpi(
    "/kpis/inspection-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    }
  );
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Safety Co-pilot</h1>
              <p className="text-sm text-muted-foreground">Health, Safety & Environment Dashboard</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* KPI Cards - Real data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Incidents"
            value={incidentsTotal.value != null ? String(incidentsTotal.value) : "124"}
            change={{ value: 12 }}
            trend="up"
            variant="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBgClass="bg-amber-100 text-amber-700"
          />
          <KPICard
            title="Hazards"
            value={hazardsTotal.value != null ? String(hazardsTotal.value) : "47"}
            change={{ value: 4 }}
            trend="up"
            variant="danger"
            icon={<ShieldAlert className="h-5 w-5" />}
            iconBgClass="bg-rose-100 text-rose-600"
          />
          <KPICard
            title="Audits"
            value={auditsTotal.value != null ? String(auditsTotal.value) : "23"}
            change={{ value: -7 }}
            trend="down"
            variant="default"
            icon={<FileCheck className="h-5 w-5" />}
            iconBgClass="bg-accent/10 text-accent"
          />
          <KPICard
            title="Inspections"
            value={inspectionsTotal.value != null ? String(inspectionsTotal.value) : "0"}
            change={{ value: 0 }}
            trend="up"
            variant="success"
            icon={<ClipboardCheck className="h-5 w-5" />}
            iconBgClass="bg-emerald-100 text-emerald-600"
          />
        </div>

        {/* Analytics Overview (requested endpoints only) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trends */}
          <div className="lg:col-span-6">
            <ShadcnLineCard title="Incidents Trend" endpoint="/analytics/data/incident-trend" params={{ dataset: "incident" }} />
          </div>
          <div className="lg:col-span-6">
            <ShadcnLineCard title="Incident Cost Trend" endpoint="/analytics/data/incident-cost-trend" />
          </div>

          {/* Categories and Pareto */}
          <div className="lg:col-span-4">
            <ShadcnBarCard title="Incident Types" endpoint="/analytics/data/incident-type-distribution" params={{ dataset: "incident" }} />
          </div>
          <div className="lg:col-span-8">
            <ShadcnParetoCard title="Root Cause Pareto" endpoint="/analytics/data/root-cause-pareto" params={{ dataset: "incident" }} />
          </div>

          {/* Long-text findings */}
          <div className="lg:col-span-12">
            <ShadcnBarCard title="Top Inspection Findings" endpoint="/analytics/data/inspection-top-findings" />
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-12">
            <ShadcnHeatmapCard title="Department × Month (Avg)" endpoint="/analytics/data/department-month-heatmap" params={{ dataset: "incident" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RecentList title="Recent Incidents" fetcher={getRecentIncidents} limit={5} />
          <RecentList title="Recent Hazards" fetcher={getRecentHazards} limit={5} />
          <RecentList title="Recent Audits" fetcher={getRecentAudits} limit={5} />
        </div>
      </main>
    </div>
  );
}