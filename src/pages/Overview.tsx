import { KPICard } from "@/components/dashboard/KPICard";
import { ActionQueue } from "@/components/dashboard/ActionQueue";
import { SafetyCopilot } from "@/components/dashboard/SafetyCopilot";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Overview() {
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
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="HSE Scorecard"
            value="82"
            change={{ value: 8, period: "last 30 days" }}
            trend="up"
            variant="success"
          />
          <KPICard
            title="Incidents"
            value="124"
            change={{ value: 12, period: "last 30 days" }}
            trend="up"
            variant="warning"
          />
          <KPICard
            title="Hazards"
            value="47"
            change={{ value: 4, period: "last 30 days" }}
            trend="up"
            variant="danger"
          />
          <KPICard
            title="Audits"
            value="23"
            change={{ value: -7, period: "last 30 days" }}
            trend="down"
            variant="default"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-1">
            <ActionQueue />
          </div>

          {/* Middle Column - Trend Chart */}
          <div className="lg:col-span-1">
            <TrendChart title="Incident Trends" />
          </div>

          {/* Right Column - Department Risk */}
          <div className="lg:col-span-1">
            <DonutChart 
              title="Department Risk" 
              centerText="Free incidents recommended"
              centerValue="45%"
            />
          </div>
        </div>

        {/* Safety Copilot */}
        <div className="max-w-4xl">
          <SafetyCopilot />
        </div>
      </main>
    </div>
  );
}