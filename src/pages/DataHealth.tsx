import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Database, CheckCircle, AlertTriangle, FileText, RefreshCw, 
  Eye, Activity, Shield, FileCheck, ClipboardCheck, Search, X, Filter, BarChart3 
} from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function DataHealth() {
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [sourceInfo, setSourceInfo] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [chartsValidation, setChartsValidation] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>("incidents");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchFilters, setSearchFilters] = useState({
    search: "",
    start_date: "",
    end_date: "",
    status: "",
    department: "",
    location: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Chart tracing state
  const [allCharts, setAllCharts] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState<string>("");
  const [chartTrace, setChartTrace] = useState<any>(null);
  const [traceFilters, setTraceFilters] = useState({
    start_date: "",
    end_date: "",
    location: "",
  });
  const [isTracing, setIsTracing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [health, source, valid, chartsValid] = await Promise.all([
        axios.get(`${API_BASE}/data-health/summary`),
        axios.get(`${API_BASE}/data-health/source-info`),
        axios.get(`${API_BASE}/data-health/validation/check`),
        axios.get(`${API_BASE}/data-health/validate/charts`),
      ]);

      setHealthSummary(health.data);
      setSourceInfo(source.data);
      setValidation(valid.data);
      setChartsValidation(chartsValid.data);
    } catch (err: any) {
      console.error("Error fetching data health:", err);
      setError(err.message || "Failed to load data health information");
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleData = async (dataset: string, filters = searchFilters) => {
    setIsSearching(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({ limit: "10" });
      
      if (filters.search) params.append("search", filters.search);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      if (filters.status) params.append("status", filters.status);
      if (filters.department) params.append("department", filters.department);
      if (filters.location) params.append("location", filters.location);
      
      const response = await axios.get(`${API_BASE}/data-health/sample/${dataset}?${params}`);
      setSampleData(response.data);
    } catch (err) {
      console.error(`Error fetching ${dataset} sample:`, err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    fetchSampleData(selectedDataset, searchFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: "",
      start_date: "",
      end_date: "",
      status: "",
      department: "",
      location: "",
    };
    setSearchFilters(clearedFilters);
    fetchSampleData(selectedDataset, clearedFilters);
  };

  const fetchAllCharts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/data-health/trace/all-charts`);
      setAllCharts(response.data);
    } catch (err) {
      console.error("Error fetching all charts:", err);
    }
  };

  const fetchChartTrace = async (chartEndpoint: string) => {
    setIsTracing(true);
    try {
      // Build a robust URL that works for both:
      // 1) analytics endpoints like "/analytics/data/incident-trend"
      // 2) prebuilt trace endpoints like "/data-health/trace/...?..."
      let url: URL;
      if (chartEndpoint.startsWith("/analytics/")) {
        url = new URL(`${API_BASE}/data-health/trace/by-endpoint`);
        url.searchParams.set("endpoint", chartEndpoint);
      } else {
        url = new URL(`${API_BASE}${chartEndpoint}`);
      }

      // Merge optional filters
      if (traceFilters.start_date) url.searchParams.set("start_date", traceFilters.start_date);
      if (traceFilters.end_date) url.searchParams.set("end_date", traceFilters.end_date);
      if (traceFilters.location) url.searchParams.set("location", traceFilters.location);

      const response = await axios.get(url.toString());
      setChartTrace(response.data);
    } catch (err) {
      console.error(`Error tracing chart:`, err);
    } finally {
      setIsTracing(false);
    }
  };

  const handleTraceChart = (traceEndpoint: string) => {
    setSelectedChart(traceEndpoint);
    // Navigate to Tracing tab so results are visible immediately
    setActiveTab("tracing");
    fetchChartTrace(traceEndpoint);
  };

  useEffect(() => {
    fetchAllData();
    fetchSampleData("incidents");
    fetchAllCharts();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchSampleData(selectedDataset);
    }
  }, [selectedDataset]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "valid":
      case "ok":
      case "verified":
        return "bg-green-100 text-green-700 border-green-300";
      case "missing_columns":
      case "has_issues":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load data health</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={fetchAllData} variant="outline" size="sm" className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Data Health & Validation
          </h1>
          <p className="text-muted-foreground">Verify data quality and cross-check Excel sources</p>
        </div>
        <Button onClick={fetchAllData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !healthSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Health Summary Cards */}
          {healthSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthSummary.grand_total?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all datasets
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthSummary.data_quality?.completeness_percentage?.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthSummary.data_quality?.non_null_cells?.toLocaleString()} non-null cells
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                  <Shield className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {validation?.overall_health_score?.toFixed(1)}%
                  </div>
                  <Badge className={`mt-2 ${getStatusColor(healthSummary.status)}`}>
                    {healthSummary.status}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {healthSummary.last_sync ? new Date(healthSummary.last_sync).toLocaleString() : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {healthSummary.date_range?.total_days} days of data
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="source">Data Source</TabsTrigger>
              <TabsTrigger value="samples">Raw Data</TabsTrigger>
              <TabsTrigger value="tracing">Chart Tracing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {healthSummary && (
                <>
                  {/* Record Counts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Records by Dataset</CardTitle>
                      <CardDescription>Total records in each Excel sheet</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <AlertTriangle className="h-8 w-8 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Incidents</p>
                            <p className="text-2xl font-bold">{healthSummary.total_records?.incidents?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-lg border border-rose-200">
                          <Shield className="h-8 w-8 text-rose-600" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Hazards</p>
                            <p className="text-2xl font-bold">{healthSummary.total_records?.hazards?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <FileCheck className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Audits</p>
                            <p className="text-2xl font-bold">{healthSummary.total_records?.audits?.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <ClipboardCheck className="h-8 w-8 text-emerald-600" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Inspections</p>
                            <p className="text-2xl font-bold">{healthSummary.total_records?.inspections?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Date Range */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Coverage</CardTitle>
                      <CardDescription>Date range of available data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">Earliest Date</p>
                          <p className="text-lg font-bold">{healthSummary.date_range?.earliest}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Coverage</p>
                          <p className="text-lg font-bold">{healthSummary.date_range?.total_days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Latest Date</p>
                          <p className="text-lg font-bold">{healthSummary.date_range?.latest}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts Validation (OK & Verified) */}
                  {chartsValidation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Charts Validation
                        </CardTitle>
                        <CardDescription>
                          Authenticity check of chart inputs. {chartsValidation.summary?.timestamp ? `As of ${new Date(chartsValidation.summary.timestamp).toLocaleString()}` : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                            <p className="text-sm text-green-700">OK / Verified</p>
                            <p className="text-3xl font-bold text-green-700">{chartsValidation.summary?.ok ?? (chartsValidation.validated?.filter((c: any) => ["ok","verified"].includes((c.status||"").toLowerCase())).length || 0)}</p>
                          </div>
                          <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                            <p className="text-sm text-amber-700">With Issues</p>
                            <p className="text-3xl font-bold text-amber-700">{chartsValidation.summary?.with_issues ?? (chartsValidation.validated?.filter((c: any) => !["ok","verified"].includes((c.status||"").toLowerCase())).length || 0)}</p>
                          </div>
                          <div className="p-4 rounded-lg border bg-muted">
                            <p className="text-sm text-muted-foreground">Total Charts</p>
                            <p className="text-3xl font-bold">{chartsValidation.validated?.length || 0}</p>
                          </div>
                        </div>

                        {/* OK / Verified charts */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-muted-foreground mb-3">OK / Verified</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {(chartsValidation.validated || [])
                              .filter((c: any) => ["ok","verified"].includes((c.status||"").toLowerCase()))
                              .map((c: any, idx: number) => (
                                <div key={`${c.endpoint}-${idx}`} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                                      <p className="font-medium truncate">{c.chart}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate max-w-[26rem]">{c.endpoint}</p>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => handleTraceChart(c.endpoint)}>
                                    Trace
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Charts with issues */}
                        {(chartsValidation.validated || []).some((c: any) => !["ok","verified"].includes((c.status||"").toLowerCase())) && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Issues Detected</h3>
                            <div className="space-y-3">
                              {(chartsValidation.validated || [])
                                .filter((c: any) => !["ok","verified"].includes((c.status||"").toLowerCase()))
                                .map((c: any, idx: number) => (
                                  <Card key={`${c.endpoint}-issue-${idx}`} className="border-amber-200">
                                    <CardHeader>
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-base flex items-center gap-2">
                                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                                          {c.chart}
                                        </CardTitle>
                                        <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                                      </div>
                                      <CardDescription className="truncate">{c.endpoint}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                        <div>
                                          <p className="text-xs text-muted-foreground">Rows</p>
                                          <p className="text-lg font-bold">{c.rows?.toLocaleString?.() || c.rows}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-xs text-muted-foreground">Missing Columns</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {(c.missing || []).map((m: string) => (
                                              <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Resolved Columns</p>
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(c.resolved_columns || {}).map(([k,v]) => (
                                            <Badge key={k} variant="outline" className="text-xs">
                                              <span className="font-mono">{k}</span>: <span className="ml-1">{String(v)}</span>
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="mt-3 flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleTraceChart(c.endpoint)}>
                                          Trace Chart
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="space-y-6">
              {validation && (
                <>
                  {/* Overall Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Summary</CardTitle>
                      <CardDescription>Data quality checks across all datasets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Overall Health Score</p>
                          <p className="text-3xl font-bold">{validation.overall_health_score?.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Issues Found</p>
                          <p className="text-3xl font-bold">{validation.total_issues}</p>
                        </div>
                      </div>

                      {/* Issues by Dataset */}
                      <div className="space-y-4">
                        {Object.entries(validation.validation_results || {}).map(([key, result]: [string, any]) => (
                          <Card key={key} className="border">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{result.dataset}</CardTitle>
                                <Badge className={getStatusColor(result.status)}>
                                  {result.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Rows</p>
                                  <p className="text-lg font-bold">{result.total_rows?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Valid Rows</p>
                                  <p className="text-lg font-bold text-green-600">{result.valid_rows?.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Issues Found</p>
                                  <p className="text-lg font-bold text-amber-600">{result.issues_found}</p>
                                </div>
                              </div>

                              {result.issues && result.issues.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold">Issues:</p>
                                  {result.issues.map((issue: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded">
                                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                                            {issue.severity}
                                          </Badge>
                                          <span className="text-xs font-medium">{issue.type}</span>
                                        </div>
                                        <p className="text-sm">{issue.message}</p>
                                        {issue.column && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Column: {issue.column}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {result.issues?.length === 0 && (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm">No issues found</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Data Source Tab */}
            <TabsContent value="source" className="space-y-6">
              {sourceInfo && (
                <>
                  {/* Excel File Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Excel File Information
                      </CardTitle>
                      <CardDescription>Source file details and metadata</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Filename</span>
                          <span className="text-sm font-mono">{sourceInfo.excel_file?.filename}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">File Size</span>
                          <span className="text-sm">{sourceInfo.excel_file?.file_size_mb} MB</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Last Modified</span>
                          <span className="text-sm">
                            {sourceInfo.excel_file?.last_modified 
                              ? new Date(sourceInfo.excel_file.last_modified).toLocaleString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">File Status</span>
                          <Badge variant={sourceInfo.excel_file?.exists ? "default" : "destructive"}>
                            {sourceInfo.excel_file?.exists ? "✓ Found" : "✗ Not Found"}
                          </Badge>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium block mb-2">File Path</span>
                          <code className="text-xs break-all">{sourceInfo.excel_file?.path}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sheets Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Excel Sheets ({sourceInfo.total_sheets})</CardTitle>
                      <CardDescription>Sheet structure and column information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sourceInfo.sheets?.map((sheet: any) => (
                          <Card key={sheet.name} className="border">
                            <CardHeader>
                              <CardTitle className="text-base">{sheet.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Rows</span>
                                  <span className="text-sm font-bold">{sheet.row_count?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Columns</span>
                                  <span className="text-sm font-bold">{sheet.column_count}</span>
                                </div>
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-muted-foreground mb-2">Sample Columns:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {sheet.columns?.slice(0, 5).map((col: string) => (
                                      <Badge key={col} variant="outline" className="text-xs">
                                        {col}
                                      </Badge>
                                    ))}
                                    {sheet.columns?.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{sheet.columns.length - 5} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Raw Data Samples Tab */}
            <TabsContent value="samples" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Raw Data Samples
                      </CardTitle>
                      <CardDescription>View actual records from Excel sheets</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedDataset === "incidents" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDataset("incidents")}
                      >
                        Incidents
                      </Button>
                      <Button
                        variant={selectedDataset === "hazards" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDataset("hazards")}
                      >
                        Hazards
                      </Button>
                      <Button
                        variant={selectedDataset === "audits" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDataset("audits")}
                      >
                        Audits
                      </Button>
                      <Button
                        variant={selectedDataset === "inspections" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedDataset("inspections")}
                      >
                        Inspections
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter Section */}
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4" />
                      <h3 className="font-semibold">Search & Filter</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Text Search */}
                      <div className="space-y-2">
                        <Label htmlFor="search" className="text-xs">Search Text</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="search"
                            placeholder="Search in title, description..."
                            value={searchFilters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="pl-9"
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          />
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label htmlFor="start_date" className="text-xs">Start Date</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={searchFilters.start_date}
                          onChange={(e) => handleFilterChange("start_date", e.target.value)}
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-2">
                        <Label htmlFor="end_date" className="text-xs">End Date</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={searchFilters.end_date}
                          onChange={(e) => handleFilterChange("end_date", e.target.value)}
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-xs">Status</Label>
                        <Input
                          id="status"
                          placeholder="e.g., Closed, Open"
                          value={searchFilters.status}
                          onChange={(e) => handleFilterChange("status", e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                      </div>

                      {/* Department */}
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-xs">Department</Label>
                        <Input
                          id="department"
                          placeholder="e.g., Process, PVC"
                          value={searchFilters.department}
                          onChange={(e) => handleFilterChange("department", e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-xs">Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Karachi, Manufacturing"
                          value={searchFilters.location}
                          onChange={(e) => handleFilterChange("location", e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSearch} disabled={isSearching} size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                      <Button onClick={handleClearFilters} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>

                  {sampleData ? (
                    <>
                      {/* Results Summary */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Showing {sampleData.returned_count} of {sampleData.filtered_count?.toLocaleString() || sampleData.total_count?.toLocaleString()} records
                              </p>
                              <p className="text-xs text-blue-700">
                                From <strong>{sampleData.sheet_name}</strong> sheet
                                {sampleData.filtered_count !== sampleData.total_count && (
                                  <span> • Filtered from {sampleData.total_count?.toLocaleString()} total</span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {/* Active Filters Badge */}
                          {sampleData.filters_applied && Object.values(sampleData.filters_applied).some((v: any) => v) && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(sampleData.filters_applied).map(([key, value]: [string, any]) => 
                                value && (
                                  <Badge key={key} variant="secondary" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              {sampleData.columns_shown?.slice(0, 8).map((col: string) => (
                                <th key={col} className="text-left p-2 font-medium">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sampleData.records?.map((record: any, idx: number) => (
                              <tr key={idx} className="border-b hover:bg-muted/50">
                                {sampleData.columns_shown?.slice(0, 8).map((col: string) => (
                                  <td key={col} className="p-2">
                                    {record[col]?.toString() || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading sample data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Chart Tracing Tab */}
            <TabsContent value="tracing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Chart Data Tracing
                  </CardTitle>
                  <CardDescription>
                    Cross-verify which Excel sheets and columns each chart uses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* All Charts Overview */}
                  {allCharts && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Available Charts ({allCharts.total_charts})</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allCharts.charts?.map((chart: any, idx: number) => (
                          <Card 
                            key={idx} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedChart === chart.trace_endpoint ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => handleTraceChart(chart.trace_endpoint)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">{chart.chart_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Sheets Used:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {chart.sheets_used?.map((sheet: string) => (
                                      <Badge key={sheet} variant="outline" className="text-xs">
                                        {sheet}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Key Columns:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {chart.key_columns?.slice(0, 3).map((col: string) => (
                                      <Badge key={col} variant="secondary" className="text-xs">
                                        {col}
                                      </Badge>
                                    ))}
                                    {chart.key_columns?.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{chart.key_columns.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trace Filters */}
                  {selectedChart && (
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-4 w-4" />
                        <h3 className="font-semibold">Trace Filters (Optional)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="trace_start_date" className="text-xs">Start Date</Label>
                          <Input
                            id="trace_start_date"
                            type="date"
                            value={traceFilters.start_date}
                            onChange={(e) => setTraceFilters({...traceFilters, start_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trace_end_date" className="text-xs">End Date</Label>
                          <Input
                            id="trace_end_date"
                            type="date"
                            value={traceFilters.end_date}
                            onChange={(e) => setTraceFilters({...traceFilters, end_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trace_location" className="text-xs">Location</Label>
                          <Input
                            id="trace_location"
                            placeholder="e.g., Karachi"
                            value={traceFilters.location}
                            onChange={(e) => setTraceFilters({...traceFilters, location: e.target.value})}
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => fetchChartTrace(selectedChart)} 
                        disabled={isTracing}
                        size="sm"
                        className="mt-4"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {isTracing ? "Tracing..." : "Apply Filters & Trace"}
                      </Button>
                    </div>
                  )}

                  {/* Chart Trace Results */}
                  {chartTrace && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <h3 className="font-semibold text-blue-900">{chartTrace.chart_name}</h3>
                          {chartTrace.endpoint && (
                            <p className="text-xs text-blue-700 font-mono">{chartTrace.endpoint}</p>
                          )}
                        </div>
                        {chartTrace.filters_applied && Object.values(chartTrace.filters_applied).some((v: any) => v) && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(chartTrace.filters_applied).map(([key, value]: [string, any]) => 
                              value && (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* Calculation Method */}
                      {chartTrace.calculation_method && (
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Calculation Method</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{chartTrace.calculation_method}</p>
                            {chartTrace.formula && (
                              <div className="mt-2 p-2 bg-muted rounded font-mono text-xs">
                                {chartTrace.formula}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Data Sources */}
                      {chartTrace.data_sources && (
                        <div className="space-y-3">
                          <h3 className="font-semibold">Data Sources</h3>
                          {chartTrace.data_sources.map((source: any, idx: number) => (
                            <Card key={idx} className="border">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm">
                                    {source.layer || source.component || `Source ${idx + 1}`}
                                  </CardTitle>
                                  <Badge variant="outline">{source.excel_sheet}</Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Total Records</p>
                                    <p className="text-lg font-bold">{source.total_records_in_sheet?.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">After Filter</p>
                                    <p className="text-lg font-bold text-blue-600">
                                      {source.records_after_filter?.toLocaleString()}
                                    </p>
                                  </div>
                                  {source.count !== undefined && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Count</p>
                                      <p className="text-lg font-bold text-green-600">{source.count}</p>
                                    </div>
                                  )}
                                  {source.points !== undefined && (
                                    <div>
                                      <p className="text-xs text-muted-foreground">Points</p>
                                      <p className="text-lg font-bold text-purple-600">{source.points}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Columns Used:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {source.columns_used?.map((col: string) => (
                                        <Badge key={col} variant="secondary" className="text-xs">
                                          {col}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {source.filter_criteria && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Filter Criteria:</p>
                                      <p className="text-xs bg-muted p-2 rounded font-mono">
                                        {source.filter_criteria}
                                      </p>
                                    </div>
                                  )}

                                  {source.sample_ids && source.sample_ids.length > 0 && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Sample IDs:</p>
                                      <div className="flex flex-wrap gap-1">
                                        {source.sample_ids.slice(0, 5).map((id: string) => (
                                          <Badge key={id} variant="outline" className="text-xs font-mono">
                                            {id}
                                          </Badge>
                                        ))}
                                        {source.sample_ids.length > 5 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{source.sample_ids.length - 5} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {/* Additional Info */}
                      {chartTrace.total_score !== undefined && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">Total Score:</span>
                              <span className="text-2xl font-bold text-green-700">
                                {chartTrace.total_score}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {!selectedChart && !chartTrace && (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">Select a chart above to trace its data sources</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
