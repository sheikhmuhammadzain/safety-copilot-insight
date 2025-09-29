import { KPICard } from "@/components/dashboard/KPICard";
import { useState } from "react";
import ShadcnLineCard from "@/components/charts/ShadcnLineCard";
import ShadcnBarCard from "@/components/charts/ShadcnBarCard";
import ShadcnDonutCard from "@/components/charts/ShadcnDonutCard";
import ShadcnParetoCard from "@/components/charts/ShadcnParetoCard";
import ShadcnHeatmapCard from "@/components/charts/ShadcnHeatmapCard";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useKpi } from "@/hooks/useKpi";
import { AlertTriangle, ShieldAlert, FileCheck, ClipboardCheck, Info, RefreshCw } from "lucide-react";
import { RecentList } from "@/components/dashboard/RecentList";
import { getRecentIncidents, getRecentHazards, getRecentAudits } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Overview() {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  // KPIs sourced from real KPI endpoints that return Plotly indicator figures
  const incidentsTotal = useKpi(
    "/kpis/incident-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    },
    refreshKey,
  );

  const hazardsTotal = useKpi(
    "/kpis/hazard-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    },
    refreshKey,
  );

  const auditsTotal = useKpi(
    "/kpis/audit-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    },
    refreshKey,
  );

  const inspectionsTotal = useKpi(
    "/kpis/inspection-total",
    undefined,
    (fig) => {
      const d = fig?.data?.[0];
      const val = d?.value as number | undefined;
      return Number.isFinite(val as number) ? Math.round(val as number) : null;
    },
    refreshKey,
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
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setRefreshKey(Date.now())}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <div className="text-sm text-muted-foreground hidden md:block">
              Last updated: {new Date().toLocaleDateString()}
            </div>
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

        {/* Analytics Overview (hazards first, then incidents) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trends: Hazards */}
          <div className="lg:col-span-6 relative">
            <ShadcnLineCard title="Hazards Trend" endpoint="/analytics/data/incident-trend" params={{ dataset: "hazard" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Monthly count of hazards over time. Use it to see rising or improving safety trends.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="lg:col-span-6 relative">
            <ShadcnLineCard title="Hazard Cost Trend" endpoint="/analytics/data/incident-cost-trend" params={{ dataset: "hazard" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Monthly sum of estimated hazard costs. Highlights cost impact trends by month.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Trends: Incidents */}
          <div className="lg:col-span-6 relative">
            <ShadcnLineCard title="Incidents Trend" endpoint="/analytics/data/incident-trend" params={{ dataset: "incident" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Monthly incident count trend. Peaks indicate periods with more incidents; valleys indicate improvement.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="lg:col-span-6 relative">
            <ShadcnLineCard title="Incident Cost Trend" endpoint="/analytics/data/incident-cost-trend" params={{ dataset: "incident" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Monthly total of incident costs. Use it to assess financial impact and prioritize actions.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Categories and Pareto */}
          <div className="lg:col-span-4 relative">
            <ShadcnBarCard title="Incident Types" endpoint="/analytics/data/incident-type-distribution" params={{ dataset: "incident" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Distribution of incident types (counts). Quickly see which categories occur most often.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="lg:col-span-8 relative">
            <ShadcnParetoCard title="Root Cause Pareto" endpoint="/analytics/data/root-cause-pareto" params={{ dataset: "incident" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Pareto of root causes with cumulative percentage. Focus on the vital few causes driving most incidents.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Long-text findings */}
          <div className="lg:col-span-12 relative">
            <ShadcnBarCard title="Top Inspection Findings" endpoint="/analytics/data/inspection-top-findings" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Most frequent inspection findings. Use this to prioritize corrective actions.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-12 relative">
            <ShadcnHeatmapCard title="Department × Month (Avg)" endpoint="/analytics/data/department-month-heatmap" params={{ dataset: "incident" }} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs text-slate-700">
                  Average metric by department and month. Darker cells indicate higher values in that period.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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