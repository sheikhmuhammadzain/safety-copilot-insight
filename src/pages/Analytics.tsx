import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlotlyCard } from "@/components/charts/PlotlyCard";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ConversionMetricsCards } from "@/components/conversion/ConversionMetricsCards";
import { LinksSummary } from "@/components/conversion/LinksSummary";
import { DepartmentMetricsTable } from "@/components/conversion/DepartmentMetricsTable";
import { LinksNetwork } from "@/components/conversion/LinksNetwork";
import { LinksSankey } from "@/components/conversion/LinksSankey";

export default function Analytics() {
  const [dataset, setDataset] = useState<"incident" | "hazard">("incident");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground">Interactive analytics powered by Safety Co-pilot</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={dataset === "incident" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataset("incident")}
            >
              Incidents
            </Button>
            <Button
              variant={dataset === "hazard" ? "default" : "outline"}
              size="sm"
              onClick={() => setDataset("hazard")}
            >
              Hazards
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Core Analytics */}
        <div className="grid grid-cols-1 gap-6">
          <PlotlyCard title="HSE Scorecard" endpoint="/analytics/hse-scorecard" height={420} />
          <PlotlyCard title="HSE Performance Index" endpoint="/analytics/hse-performance-index" params={{ dataset }} height={420} />
          <PlotlyCard title="Risk Calendar Heatmap" endpoint="/analytics/risk-calendar-heatmap" params={{ dataset }} height={420} />
          <PlotlyCard title="Consequence Matrix" endpoint="/analytics/consequence-matrix" params={{ dataset }} height={420} />
          <PlotlyCard title="Data Quality Metrics" endpoint="/analytics/data-quality-metrics" params={{ dataset }} height={420} />
          <PlotlyCard title="Comprehensive Timeline" endpoint="/analytics/comprehensive-timeline" params={{ dataset }} height={420} />
          <PlotlyCard title="Audit/Inspection Tracker" endpoint="/analytics/audit-inspection-tracker" height={420} />
          <PlotlyCard title="Location Risk Treemap" endpoint="/analytics/location-risk-treemap" params={{ dataset }} height={420} />
          <PlotlyCard title="Department Spider" endpoint="/analytics/department-spider" params={{ dataset }} height={420} />
          <PlotlyCard title="Violation Analysis" endpoint="/analytics/violation-analysis" params={{ dataset }} height={420} />
          <PlotlyCard title="Cost Prediction Analysis" endpoint="/analytics/cost-prediction-analysis" params={{ dataset }} height={420} />
          <PlotlyCard title="Facility Layout Heatmap" endpoint="/analytics/facility-layout-heatmap" height={420} />
          <PlotlyCard title="Facility 3D Heatmap" endpoint="/analytics/facility-3d-heatmap" params={{ dataset, event_type: dataset === 'incident' ? 'Incidents' : 'Hazards' }} height={420} />
        </div>

        {/* Conversion Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Conversion Analytics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              {/* KPI cards from JSON metrics */}
              <ConversionMetricsCards />

              {/* Hazard–Incident links summary (edges/pairs source) */}
              <LinksSummary />

              {/* Department-level metrics table */}
              <DepartmentMetricsTable />

              {/* Existing Plotly visualizations */}
              <PlotlyCard title="Funnel" endpoint="/analytics/conversion/funnel" height={420} />
              <PlotlyCard title="Time Lag" endpoint="/analytics/conversion/time-lag" height={420} />
              <LinksSankey />
              <PlotlyCard title="Department Matrix" endpoint="/analytics/conversion/department-matrix" height={420} />
              <LinksNetwork />
              <PlotlyCard title="Prevention Effectiveness" endpoint="/analytics/conversion/prevention-effectiveness" height={420} />
              <PlotlyCard title="Metrics Gauge" endpoint="/analytics/conversion/metrics-gauge" height={420} />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
