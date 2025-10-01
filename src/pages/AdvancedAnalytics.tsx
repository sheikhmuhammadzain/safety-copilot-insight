import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, TrendingUp, Activity, AlertTriangle, Target, BarChart3, Info, Skull, Bandage, Heart, ShieldAlert, Eye } from "lucide-react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import axios from "axios";
import { PyramidChart } from "@/components/charts/PyramidChart";

// API Base URL from environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface FilterState {
  startDate: string;
  endDate: string;
  location: string;
  department: string;
}

export default function AdvancedAnalytics() {
  const [filters, setFilters] = useState<FilterState>({
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    location: "",
    department: "",
  });

  const [heinrichData, setHeinrichData] = useState<any>(null);
  const [safetyIndex, setSafetyIndex] = useState<any>(null);
  const [kpiSummary, setKpiSummary] = useState<any>(null);
  const [incidentForecast, setIncidentForecast] = useState<any>(null);
  const [leadingLagging, setLeadingLagging] = useState<any>(null);
  const [riskTrend, setRiskTrend] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<any>(null);

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

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);

      console.log("=== FETCHING ANALYTICS DATA ===");
      console.log("Current filters:", filters);
      console.log("URL params:", params.toString());
      console.log("Full URL:", `${API_BASE}/analytics/advanced/heinrich-pyramid?${params}`);

      const [heinrich, safety, kpis, forecast, leading, risk] = await Promise.all([
        axios.get(`${API_BASE}/analytics/advanced/heinrich-pyramid?${params}`),
        axios.get(`${API_BASE}/analytics/advanced/site-safety-index?${params}`),
        axios.get(`${API_BASE}/analytics/advanced/kpis/summary?${params}`),
        axios.get(`${API_BASE}/analytics/predictive/incident-forecast?${params}&months_ahead=4`),
        axios.get(`${API_BASE}/analytics/predictive/leading-vs-lagging?${params}`),
        axios.get(`${API_BASE}/analytics/predictive/risk-trend-projection?${params}&months_ahead=3`),
      ]);

      console.log("=== DATA FETCHED SUCCESSFULLY ===");
      console.log("Heinrich Pyramid:", heinrich.data);
      console.log("  - Total Events:", heinrich.data.total_events);
      console.log("  - Filters Applied:", heinrich.data.filters_applied);
      console.log("Safety Index:", safety.data?.score);
      console.log("KPIs:", kpis.data);
      console.log("================================");

      setHeinrichData(heinrich.data);
      setSafetyIndex(safety.data);
      setKpiSummary(kpis.data);
      setIncidentForecast(forecast.data);
      setLeadingLagging(leading.data);
      setRiskTrend(risk.data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      setError(error.message || "Failed to load analytics data. Please ensure the backend API is running on http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchData();
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    console.log("Applying filters:", filters);
    fetchData();
  };

  const resetFilters = () => {
    setFilters({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      location: "",
      department: "",
    });
    // Fetch data after resetting filters
    setTimeout(() => fetchData(), 100);
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advanced Analytics</h1>
          <p className="text-muted-foreground">Predictive insights and safety metrics</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Real-time Data
        </Badge>
      </div>

      {/* Filters */}
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

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load data</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={fetchData} variant="outline" size="sm" className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="pyramid">Heinrich's Pyramid</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading && (
            <>
              {/* Safety Index Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center mb-6">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </CardContent>
              </Card>
              
              {/* Leading vs Lagging Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </>
          )}
          
          {!safetyIndex && !leadingLagging && !loading && !error && (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make sure your backend API is running at http://localhost:8000
                </p>
                <Button onClick={fetchData} variant="outline">
                  Reload Data
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Safety Index */}
          {safetyIndex && (
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
          {leadingLagging && (
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
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-20 mb-2" />
                    <Skeleton className="h-6 w-16 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {kpiSummary && !loading && (
            <>
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* TRIR */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">TRIR</CardTitle>
                    <CardDescription>Total Recordable Incident Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: kpiSummary.trir.color }}>
                      {kpiSummary.trir.value}
                    </div>
                    <Badge className="mt-2">{kpiSummary.trir.benchmark}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.trir.recordable_incidents} incidents / {(kpiSummary.trir.total_hours_worked / 1000000).toFixed(1)}M hours
                    </p>
                  </CardContent>
                </Card>

                {/* LTIR */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">LTIR</CardTitle>
                    <CardDescription>Lost Time Incident Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {kpiSummary.ltir.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.ltir.lost_time_incidents} lost-time incidents
                    </p>
                  </CardContent>
                </Card>

                {/* PSTIR */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">PSTIR</CardTitle>
                    <CardDescription>Process Safety Total Incident Rate</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {kpiSummary.pstir.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.pstir.psm_incidents} PSM incidents
                    </p>
                  </CardContent>
                </Card>

                {/* Near-Miss Ratio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Near-Miss Ratio</CardTitle>
                    <CardDescription>Near-Miss to Incident Ratio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold" style={{ color: kpiSummary.near_miss_ratio.color }}>
                      {kpiSummary.near_miss_ratio.ratio}:1
                    </div>
                    <Badge className="mt-2">{kpiSummary.near_miss_ratio.benchmark}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.near_miss_ratio.near_misses} near-misses / {kpiSummary.near_miss_ratio.incidents} incidents
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {loading && (
            <>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[400px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </>
          )}
          
          {/* Incident Forecast */}
          {incidentForecast && !loading && (
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
          {riskTrend && !loading && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Trend Projection</CardTitle>
                <CardDescription>Average risk score trends and forecast</CardDescription>
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
        </TabsContent>

        {/* Heinrich's Pyramid Tab */}
        <TabsContent value="pyramid" className="space-y-6">
          {loading && (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton 
                      key={i} 
                      className="h-24 mx-auto" 
                      style={{ width: `${20 * i}%`, minWidth: "200px" }}
                    />
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          )}
          
          {heinrichData && !loading && (
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
              </CardHeader>
              <CardContent>
                <PyramidChart 
                  layers={heinrichData.layers} 
                  totalEvents={heinrichData.total_events}
                />
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Events</span>
                    <p className="text-2xl font-bold">{heinrichData.total_events}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Near-Miss Ratio</span>
                    <p className="text-2xl font-bold">{heinrichData.near_miss_ratio}:1</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
