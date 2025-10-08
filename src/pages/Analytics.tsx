import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlotlyCard } from "@/components/charts/PlotlyCard";
import { BarChart3, RefreshCw, Target, TrendingUp, AlertTriangle, Info, Calendar, FileText } from "lucide-react";
import { HeinrichBreakdownModal } from "@/components/modals/HeinrichBreakdownModal";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from "recharts";
import axios from "axios";
import { PyramidChart } from "@/components/charts/PyramidChart";
import { 
  useSafetyIndex, 
  useIncidentForecast, 
  useLeadingLagging, 
  useRiskTrend, 
  useHeinrichPyramid 
} from "@/hooks/useAdvancedAnalytics";

// API Base URL from environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface FilterState {
  startDate: string;
  endDate: string;
  location: string;
  department: string;
}

export default function Analytics() {
  const [dataset, setDataset] = useState<"incident" | "hazard">("incident");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [heinrichBreakdownOpen, setHeinrichBreakdownOpen] = useState<boolean>(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    location: "",
    department: "",
  });
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<any>(null);
  
  // Advanced analytics hooks with caching
  const { data: safetyIndex, isLoading: safetyLoading, isError: safetyError, error: safetyErrorMsg } = useSafetyIndex(filters, refreshKey);
  const { data: incidentForecast, isLoading: forecastLoading, isError: forecastError, error: forecastErrorMsg } = useIncidentForecast(filters, 4, refreshKey);
  const { data: leadingLagging, isLoading: leadingLoading, isError: leadingError, error: leadingErrorMsg } = useLeadingLagging(filters, refreshKey);
  const { data: riskTrend, isLoading: riskLoading, isError: riskError, error: riskErrorMsg } = useRiskTrend(filters, 3, refreshKey);
  const { data: heinrichData, isLoading: heinrichLoading, isError: heinrichError, error: heinrichErrorMsg } = useHeinrichPyramid(filters, refreshKey);

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/filters/all`);
      setFilterOptions(response.data);
      console.log("Filter options loaded:", response.data);
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };


  // Filter functions
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    console.log("Applying filters:", filters);
    setRefreshKey(Date.now());
  };

  const resetFilters = () => {
    setFilters({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      location: "",
      department: "",
    });
    // Trigger refresh after resetting filters
    setTimeout(() => setRefreshKey(Date.now()), 100);
  };

  useEffect(() => {
    fetchFilterOptions();
  }, []);

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
                <p className="text-sm text-muted-foreground">Interactive analytics powered by Safety Copilot</p>
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
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => setRefreshKey(Date.now())}
              title="Refresh charts"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="p-6 pb-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Select value={filters.location || "all"} onValueChange={(value) => handleFilterChange("location", value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {filterOptions?.locations?.map((loc: string) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select value={filters.department || "all"} onValueChange={(value) => handleFilterChange("department", value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {filterOptions?.departments?.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={applyFilters} className="flex-1">
                  Apply
                </Button>
                <Button onClick={resetFilters} variant="outline">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <main className="p-6 space-y-8">
        {/* Section 1: Performance & Risk Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Performance & Risk Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlotlyCard title="Risk Calendar Heatmap" endpoint="/analytics/risk-calendar-heatmap" params={{ dataset }} height={420} refreshKey={refreshKey} />
            <PlotlyCard title="Consequence Matrix" endpoint="/analytics/consequence-matrix" params={{ dataset }} height={420} refreshKey={refreshKey} />
          </div>
        </div>

        {/* Section 2: Timeline & Tracking */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Timeline & Tracking</h2>
          <div className="grid grid-cols-1 gap-6">
            <PlotlyCard title="Comprehensive Timeline" endpoint="/analytics/comprehensive-timeline" params={{ dataset }} height={420} refreshKey={refreshKey} />
            <PlotlyCard title="Audit/Inspection Tracker" endpoint="/analytics/audit-inspection-tracker" height={420} refreshKey={refreshKey} />
          </div>
        </div>

        {/* Section 3: Location & Department Analysis */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Location & Department Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <PlotlyCard title="Department Spider" endpoint="/analytics/department-spider" params={{ dataset }} height={420} refreshKey={refreshKey} />
          </div>
        </div>

        {/* Section 4: Facility Heatmaps */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Facility Risk Visualization</h2>
          <div className="grid grid-cols-1 gap-6">
            <PlotlyCard title="Facility Layout Heatmap" endpoint="/analytics/facility-layout-heatmap" height={600} refreshKey={refreshKey} />
          </div>
        </div>

        {/* Section 5: Advanced Analytics */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Advanced Analytics</h2>
          
          {/* Safety Index */}
          {safetyLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <Skeleton className="w-48 h-48 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : safetyError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Failed to load Safety Index</p>
                    <p className="text-sm text-muted-foreground">{(safetyErrorMsg as any)?.message || String(safetyErrorMsg)}</p>
          </div>
        </div>
              </CardContent>
            </Card>
          ) : safetyIndex && (
        <Card>
          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
            <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Site Safety Index
            </CardTitle>
                    <CardDescription>Real-time safety health score (0-100)</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Site Safety Index</p>
                        <p className="text-sm mb-2">A 0-100 score measuring overall safety health.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded">
                          Score = 100 - Deductions + Bonuses
                        </p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• Serious injuries: -10 each</li>
                          <li>• Minor injuries: -3 each</li>
                          <li>• High-risk hazards: -2 each</li>
                          <li>• Days since last incident: +0.1/day</li>
                          <li>• Completed audits: +0.5 each</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
          </CardHeader>
          <CardContent>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={safetyIndex.color}
                        strokeWidth="8"
                        strokeDasharray={`${safetyIndex.score * 2.51} 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{safetyIndex.score}</span>
                      <span className="text-sm text-muted-foreground">{safetyIndex.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {safetyIndex.breakdown?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{item.factor}</span>
                      <Badge variant={item.impact > 0 ? "default" : "destructive"}>
                        {item.impact > 0 ? "+" : ""}{item.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leading vs Lagging */}
          {leadingLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-80 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
                <div className="mt-4">
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : leadingError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Failed to load Leading vs Lagging Indicators</p>
                    <p className="text-sm text-muted-foreground">{(leadingErrorMsg as any)?.message || String(leadingErrorMsg)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : leadingLagging && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leading vs Lagging Indicators</CardTitle>
                    <CardDescription>Proactive vs Reactive Safety Measures</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Leading vs Lagging Indicators</p>
                        <p className="text-sm mb-2">Compares proactive safety measures vs reactive outcomes.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          Ratio = Leading / Lagging
                        </p>
                        <p className="text-xs mb-2"><strong>Leading (Proactive):</strong></p>
                        <ul className="text-xs space-y-1 mb-2">
                          <li>• Hazards identified</li>
                          <li>• Audits completed</li>
                          <li>• Inspections performed</li>
                          <li>• Near-miss reports</li>
                        </ul>
                        <p className="text-xs mb-2"><strong>Lagging (Reactive):</strong></p>
                        <ul className="text-xs space-y-1">
                          <li>• Total incidents</li>
                          <li>• Lost-time incidents</li>
                          <li>• Medical cases</li>
                          <li>• Serious incidents</li>
                        </ul>
                        <p className="text-xs mt-2 text-muted-foreground">Best practice: 5-10:1 ratio</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Leading",
                        Hazards: leadingLagging.leading_indicators.hazards_identified,
                        Audits: leadingLagging.leading_indicators.audits_completed,
                        Inspections: leadingLagging.leading_indicators.inspections_performed,
                        NearMiss: leadingLagging.leading_indicators.near_miss_reports,
                      },
                      {
                        name: "Lagging",
                        Incidents: leadingLagging.lagging_indicators.total_incidents,
                        LostTime: leadingLagging.lagging_indicators.lost_time_incidents,
                        Medical: leadingLagging.lagging_indicators.medical_treatment_cases,
                        Serious: leadingLagging.lagging_indicators.serious_incidents,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="Hazards" fill="#8bc34a" />
                    <Bar dataKey="Audits" fill="#4caf50" />
                    <Bar dataKey="Inspections" fill="#66bb6a" />
                    <Bar dataKey="NearMiss" fill="#81c784" />
                    <Bar dataKey="Incidents" fill="#f44336" />
                    <Bar dataKey="LostTime" fill="#e53935" />
                    <Bar dataKey="Medical" fill="#d32f2f" />
                    <Bar dataKey="Serious" fill="#b71c1c" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Ratio:</span>
                    <Badge style={{ backgroundColor: leadingLagging.color }}>
                      {leadingLagging.ratio_text}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {leadingLagging.assessment}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {leadingLagging.recommendation}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Incident Forecast */}
          {forecastLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          ) : forecastError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Failed to load Incident Forecast</p>
                    <p className="text-sm text-muted-foreground">{(forecastErrorMsg as any)?.message || String(forecastErrorMsg)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : incidentForecast && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Incident Forecast (4 Months)
                    </CardTitle>
                    <CardDescription>Predictive analysis using moving average with trend adjustment</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Incident Forecast</p>
                        <p className="text-sm mb-2">Predicts future incident counts based on historical trends.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          Forecast = Average(last 6 months) + Trend
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• Uses moving average method</li>
                          <li>• Analyzes last 6 months of data</li>
                          <li>• Calculates trend slope</li>
                          <li>• Projects 4 months ahead</li>
                          <li>• Shows confidence intervals (upper/lower bounds)</li>
                        </ul>
                        <p className="text-xs mt-2 text-muted-foreground">Helps anticipate safety resource needs</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={[
                      ...incidentForecast.historical.map((d: any) => ({
                        month: d.month,
                        actual: d.count,
                        type: "Historical",
                      })),
                      ...incidentForecast.forecast.map((d: any) => ({
                        month: d.month,
                        predicted: d.predicted_count,
                        lower: d.confidence_lower,
                        upper: d.confidence_upper,
                        type: "Forecast",
                      })),
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#2196f3" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#ff9800" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
                    <Line type="monotone" dataKey="lower" stroke="#e0e0e0" strokeWidth={1} name="Lower Bound" />
                    <Line type="monotone" dataKey="upper" stroke="#e0e0e0" strokeWidth={1} name="Upper Bound" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Risk Trend Projection */}
          {riskLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-80 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
                <div className="mt-4">
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : riskError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Failed to load Risk Trend Projection</p>
                    <p className="text-sm text-muted-foreground">{(riskErrorMsg as any)?.message || String(riskErrorMsg)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : riskTrend && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Risk Trend Projection</CardTitle>
                    <CardDescription>Average risk score trends and forecast</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Risk Trend Projection</p>
                        <p className="text-sm mb-2">Shows historical average risk scores and predicts future trends.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          Avg Risk = Sum(Risk Scores) / Total Events
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>Risk score:</strong> Calculated from severity × likelihood (1-5 scale)</li>
                          <li>• <strong>Historical data:</strong> Past 6 months of actual risk scores</li>
                          <li>• <strong>Forecast:</strong> Next 3 months prediction based on trend</li>
                          <li>• <strong>Trend analysis:</strong> Shows if risks are increasing or decreasing</li>
                        </ul>
                        <p className="text-xs mt-2 text-muted-foreground">Lower scores indicate better risk management</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={[
                      ...riskTrend.historical.map((d: any) => ({
                        month: d.month,
                        risk: d.avg_risk,
                        type: "Historical",
                      })),
                      ...riskTrend.forecast.map((d: any) => ({
                        month: d.month,
                        risk: d.predicted_avg_risk,
                        type: "Forecast",
                      })),
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="risk" stroke={riskTrend.trend_color} fill={riskTrend.trend_color} fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Trend:</span>
                    <Badge style={{ backgroundColor: riskTrend.trend_color }}>
                      {riskTrend.trend}
                    </Badge>
                  </div>
            </div>
          </CardContent>
        </Card>
          )}

          {/* Heinrich's Pyramid */}
          {heinrichLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : heinrichError ? (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Failed to load Heinrich's Pyramid</p>
                    <p className="text-sm text-muted-foreground">{(heinrichErrorMsg as any)?.message || String(heinrichErrorMsg)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : heinrichData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Heinrich's Safety Pyramid
                    </CardTitle>
                    <CardDescription>
                      Foundational safety analytics - Industry standard ratios (1:10:30:600:3000)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setHeinrichBreakdownOpen(true)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Breakdown
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Heinrich's Safety Pyramid</p>
                        <p className="text-sm mb-2">Shows the relationship between minor and major safety events.</p>
                        <p className="text-sm mb-2"><strong>5 Levels (Top to Bottom):</strong></p>
                        <ul className="text-xs space-y-1 mb-2">
                          <li>• <strong>Level 5:</strong> Serious Injury/Fatality (severity ≥ 4)</li>
                          <li>• <strong>Level 4:</strong> Minor Injury (severity 2-3)</li>
                          <li>• <strong>Level 3:</strong> First Aid/Near Miss (severity 1)</li>
                          <li>• <strong>Level 2:</strong> Unsafe Conditions (hazards)</li>
                          <li>• <strong>Level 1:</strong> At-Risk Behaviors (observations)</li>
                        </ul>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          Industry Ratio: 1:10:30:600:3000
                        </p>
                        <p className="text-xs text-muted-foreground">For every serious injury, there are typically 10 minor injuries, 30 near-misses, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Map API layers to PyramidChart shape and compute totals */}
                {(() => {
                  const apiLayers = Array.isArray(heinrichData.layers) ? heinrichData.layers : [];
                  const totalEvents = apiLayers.reduce((sum: number, l: any) => sum + (Number(l.count) || 0), 0);
                  const layersForChart = apiLayers.map((l: any) => ({
                    level: l.level,
                    label: l.label,
                    count: Number(l.count) || 0,
                    // ratio not used by chart, set as realized vs expected if available
                    ratio: l.heinrich_expected ? (Number(l.count) || 0) / Math.max(1, Number(l.heinrich_expected) || 1) : 0,
                    color: l.color || "#7fbf7f",
                  }));

                  return (
                    <>
                      <PyramidChart layers={layersForChart} totalEvents={totalEvents} />

                      {/* Stats and context */}
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Total Events</span>
                          <p className="text-2xl font-bold">{totalEvents}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <span className="text-sm text-muted-foreground">Near-Miss Ratio</span>
                          <p className="text-2xl font-bold">{heinrichData.near_miss_ratio}:1</p>
                        </div>
                        {heinrichData.filters_applied && (
                          <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm text-muted-foreground block mb-2">Filters Applied</span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(heinrichData.filters_applied).map(([k,v]: [string, any]) => (
                                v ? <span key={k} className="text-xs px-2 py-1 rounded bg-background border">{k}: {String(v)}</span> : null
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expected vs Actual per layer */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {apiLayers.map((l: any, idx: number) => (
                          <div key={idx} className="p-3 rounded border flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{l.label}</p>
                              <p className="text-xs text-muted-foreground">Expected: {l.heinrich_expected ?? '-'}{l.anchor ? ` • Anchor: ${l.anchor}` : ''}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground block">Actual</span>
                              <span className="text-lg font-bold">{l.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>

      </main>

      {/* Heinrich Breakdown Modal */}
      <HeinrichBreakdownModal 
        open={heinrichBreakdownOpen}
        onOpenChange={setHeinrichBreakdownOpen}
        filters={{
          startDate: filters.startDate,
          endDate: filters.endDate
        }}
      />
    </div>
  );
}
