import { KPICard } from "@/components/dashboard/KPICard";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCachedGet } from "@/hooks/useCachedGet";
import ShadcnLineCard from "@/components/charts/ShadcnLineCard";
import ShadcnLineCardEnhanced from "@/components/charts/ShadcnLineCardEnhanced";
import ShadcnBarCard from "@/components/charts/ShadcnBarCard";
import ShadcnParetoCard from "@/components/charts/ShadcnParetoCard";
import ShadcnHeatmapCard from "@/components/charts/ShadcnHeatmapCard";
import { ChartDateFilter } from "@/components/charts/ChartDateFilter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { AlertTriangle, ShieldAlert, FileCheck, ClipboardCheck, Info, RefreshCw, Filter, X, ListChecks, BarChart3 } from "lucide-react";
import { RecentList } from "@/components/dashboard/RecentList";
import { getRecentIncidents, getRecentHazards, getRecentAudits, getDataHealthCountsAll } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ConversionMetricsCards } from "@/components/conversion/ConversionMetricsCards";
import { LinksSummary } from "@/components/conversion/LinksSummary";
import { DepartmentMetricsTable } from "@/components/conversion/DepartmentMetricsTable";
import { PlotlyCard } from "@/components/charts/PlotlyCard";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { CardDescription } from "@/components/ui/card";

// API Base URL from environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Overview() {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Global filter states
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Per-chart date filters
  const [hazardsStartDate, setHazardsStartDate] = useState<Date | undefined>();
  const [hazardsEndDate, setHazardsEndDate] = useState<Date | undefined>();
  const [incidentsStartDate, setIncidentsStartDate] = useState<Date | undefined>();
  const [incidentsEndDate, setIncidentsEndDate] = useState<Date | undefined>();
  const [locations, setLocations] = useState<string[]>([]);
  const [sublocations, setSublocations] = useState<string[]>([]);
  const [minSeverity, setMinSeverity] = useState<string>("");
  const [maxSeverity, setMaxSeverity] = useState<string>("");
  const [minRisk, setMinRisk] = useState<string>("");
  const [maxRisk, setMaxRisk] = useState<string>("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [violationTypes, setViolationTypes] = useState<string[]>([]);

  // Fetch filter options from backend
  const { options: filterOptionsData, loading: filterOptionsLoading, error: filterOptionsError, toMultiSelectOptions } = useFilterOptions();

  // Set default date ranges from API when data loads
  useEffect(() => {
    if (filterOptionsData) {
      // Set hazards default dates
      if (filterOptionsData.hazard.date_range.min_date && !hazardsStartDate) {
        setHazardsStartDate(new Date(filterOptionsData.hazard.date_range.min_date));
      }
      if (filterOptionsData.hazard.date_range.max_date && !hazardsEndDate) {
        setHazardsEndDate(new Date(filterOptionsData.hazard.date_range.max_date));
      }
      
      // Set incidents default dates
      if (filterOptionsData.incident.date_range.min_date && !incidentsStartDate) {
        setIncidentsStartDate(new Date(filterOptionsData.incident.date_range.min_date));
      }
      if (filterOptionsData.incident.date_range.max_date && !incidentsEndDate) {
        setIncidentsEndDate(new Date(filterOptionsData.incident.date_range.max_date));
      }
    }
  }, [filterOptionsData]);

  // Get combined options from both datasets (incidents and hazards)
  const departmentOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    const incidentDepts = filterOptionsData.incident.departments;
    const hazardDepts = filterOptionsData.hazard.departments;
    
    // Merge and deduplicate by value
    const merged = [...incidentDepts, ...hazardDepts];
    const unique = merged.reduce((acc, curr) => {
      const existing = acc.find(item => item.value === curr.value);
      if (!existing) {
        acc.push(curr);
      } else {
        // Sum counts if duplicate
        existing.count += curr.count;
      }
      return acc;
    }, [] as typeof incidentDepts);
    
    return toMultiSelectOptions(unique);
  }, [filterOptionsData, toMultiSelectOptions]);

  const locationOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    const incidentLocs = filterOptionsData.incident.locations;
    const hazardLocs = filterOptionsData.hazard.locations;
    const merged = [...incidentLocs, ...hazardLocs];
    const unique = merged.reduce((acc, curr) => {
      const existing = acc.find(item => item.value === curr.value);
      if (!existing) {
        acc.push(curr);
      } else {
        existing.count += curr.count;
      }
      return acc;
    }, [] as typeof incidentLocs);
    return toMultiSelectOptions(unique);
  }, [filterOptionsData, toMultiSelectOptions]);

  const sublocationOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    const incidentSubs = filterOptionsData.incident.sublocations;
    const hazardSubs = filterOptionsData.hazard.sublocations;
    const merged = [...incidentSubs, ...hazardSubs];
    const unique = merged.reduce((acc, curr) => {
      const existing = acc.find(item => item.value === curr.value);
      if (!existing) {
        acc.push(curr);
      } else {
        existing.count += curr.count;
      }
      return acc;
    }, [] as typeof incidentSubs);
    return toMultiSelectOptions(unique);
  }, [filterOptionsData, toMultiSelectOptions]);

  const statusOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    const incidentStatuses = filterOptionsData.incident.statuses;
    const hazardStatuses = filterOptionsData.hazard.statuses;
    const merged = [...incidentStatuses, ...hazardStatuses];
    const unique = merged.reduce((acc, curr) => {
      const existing = acc.find(item => item.value === curr.value);
      if (!existing) {
        acc.push(curr);
      } else {
        existing.count += curr.count;
      }
      return acc;
    }, [] as typeof incidentStatuses);
    return toMultiSelectOptions(unique);
  }, [filterOptionsData, toMultiSelectOptions]);

  const incidentTypeOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    return toMultiSelectOptions(filterOptionsData.incident.incident_types);
  }, [filterOptionsData, toMultiSelectOptions]);

  const violationTypeOptions = useMemo(() => {
    if (!filterOptionsData) return [];
    return toMultiSelectOptions(filterOptionsData.hazard.violation_types);
  }, [filterOptionsData, toMultiSelectOptions]);

  // Build filter params object
  const filterParams = useMemo(() => {
    const params: Record<string, any> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (departments.length > 0) params.departments = departments;
    if (locations.length > 0) params.locations = locations;
    if (sublocations.length > 0) params.sublocations = sublocations;
    if (minSeverity) params.min_severity = parseFloat(minSeverity);
    if (maxSeverity) params.max_severity = parseFloat(maxSeverity);
    if (minRisk) params.min_risk = parseFloat(minRisk);
    if (maxRisk) params.max_risk = parseFloat(maxRisk);
    if (statuses.length > 0) params.statuses = statuses;
    if (incidentTypes.length > 0) params.incident_types = incidentTypes;
    if (violationTypes.length > 0) params.violation_types = violationTypes;
    return params;
  }, [startDate, endDate, departments, locations, sublocations, minSeverity, maxSeverity, minRisk, maxRisk, statuses, incidentTypes, violationTypes]);

  // Hazards chart params (per-chart filters override global filters)
  const hazardsParams = useMemo(() => {
    return {
      dataset: "hazard" as const,
      ...filterParams,
      ...(hazardsStartDate && { start_date: format(hazardsStartDate, "yyyy-MM-dd") }),
      ...(hazardsEndDate && { end_date: format(hazardsEndDate, "yyyy-MM-dd") }),
    };
  }, [filterParams, hazardsStartDate, hazardsEndDate]);

  // Incidents chart params (per-chart filters override global filters)
  const incidentsParams = useMemo(() => {
    return {
      dataset: "incident" as const,
      ...filterParams,
      ...(incidentsStartDate && { start_date: format(incidentsStartDate, "yyyy-MM-dd") }),
      ...(incidentsEndDate && { end_date: format(incidentsEndDate, "yyyy-MM-dd") }),
    };
  }, [filterParams, incidentsStartDate, incidentsEndDate]);

  // Clear all filters
  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setDepartments([]);
    setLocations([]);
    setSublocations([]);
    setMinSeverity("");
    setMaxSeverity("");
    setMinRisk("");
    setMaxRisk("");
    setStatuses([]);
    setIncidentTypes([]);
    setViolationTypes([]);
    // Clear per-chart filters
    setHazardsStartDate(undefined);
    setHazardsEndDate(undefined);
    setIncidentsStartDate(undefined);
    setIncidentsEndDate(undefined);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filterParams).length;
  }, [filterParams]);

  // KPIs via a single data-health endpoint (server-side filtered)
  const { data: dataHealth, isLoading: healthKpiLoading, isError: healthKpiError, error: healthKpiErr } = useQuery({
    queryKey: ["data-health-counts", filterParams, refreshKey ?? 0],
    queryFn: () => getDataHealthCountsAll(filterParams),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const counts = useMemo(() => ({
    incident: dataHealth?.counts?.incident ?? 0,
    hazard: dataHealth?.counts?.hazard ?? 0,
    audit: dataHealth?.counts?.audit ?? 0,
    inspection: dataHealth?.counts?.inspection ?? 0,
    audit_findings: dataHealth?.counts?.audit_findings ?? 0,
    inspection_findings: dataHealth?.counts?.inspection_findings ?? 0,
  }), [dataHealth]);

  // Fetch KPI Summary data with caching
  const { data: kpiSummary, error: kpiError, loading: kpiLoading } = useCachedGet(
    "/analytics/advanced/kpis/summary",
    {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      departments: departments.length > 0 ? departments.join(",") : undefined,
      locations: locations.length > 0 ? locations.join(",") : undefined
    },
    1000 * 60 * 60 * 6, // 6 hours TTL
    refreshKey
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
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
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
        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Analytics Filters</h2>
                  {activeFilterCount > 0 && (
                    <span className="text-sm text-muted-foreground">({activeFilterCount} active)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {filterOptionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading filter options...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {filterOptionsError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">
                    Failed to load filter options: {filterOptionsError}
                  </p>
                </div>
              )}

              {/* Filter Form */}
              {!filterOptionsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                {/* Departments */}
                <div className="space-y-2">
                  <Label>Departments</Label>
                  <MultiSelect
                    options={departmentOptions}
                    selected={departments}
                    onChange={setDepartments}
                    placeholder="Select departments..."
                  />
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <Label>Locations</Label>
                  <MultiSelect
                    options={locationOptions}
                    selected={locations}
                    onChange={setLocations}
                    placeholder="Select locations..."
                  />
                </div>

                {/* Sublocations */}
                <div className="space-y-2">
                  <Label>Sublocations</Label>
                  <MultiSelect
                    options={sublocationOptions}
                    selected={sublocations}
                    onChange={setSublocations}
                    placeholder="Select sublocations..."
                  />
                </div>

                {/* Severity Range */}
                <div className="space-y-2">
                  <Label htmlFor="min-severity">Min Severity (0-5)</Label>
                  <Input
                    id="min-severity"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minSeverity}
                    onChange={(e) => setMinSeverity(e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-severity">Max Severity (0-5)</Label>
                  <Input
                    id="max-severity"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={maxSeverity}
                    onChange={(e) => setMaxSeverity(e.target.value)}
                    placeholder="5.0"
                  />
                </div>

                {/* Risk Range */}
                <div className="space-y-2">
                  <Label htmlFor="min-risk">Min Risk (0-5)</Label>
                  <Input
                    id="min-risk"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={minRisk}
                    onChange={(e) => setMinRisk(e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-risk">Max Risk (0-5)</Label>
                  <Input
                    id="max-risk"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={maxRisk}
                    onChange={(e) => setMaxRisk(e.target.value)}
                    placeholder="5.0"
                  />
                </div>

                {/* Statuses */}
                <div className="space-y-2">
                  <Label>Statuses</Label>
                  <MultiSelect
                    options={statusOptions}
                    selected={statuses}
                    onChange={setStatuses}
                    placeholder="Select statuses..."
                  />
                </div>

                {/* Incident Types */}
                <div className="space-y-2">
                  <Label>Incident Types</Label>
                  <MultiSelect
                    options={incidentTypeOptions}
                    selected={incidentTypes}
                    onChange={setIncidentTypes}
                    placeholder="Select types..."
                  />
                </div>

                {/* Violation Types */}
                <div className="space-y-2">
                  <Label>Violation Types</Label>
                  <MultiSelect
                    options={violationTypeOptions}
                    selected={violationTypes}
                    onChange={setViolationTypes}
                    placeholder="Select violations..."
                  />
                </div>
                </div>
              )}

              {/* Filter Info */}
              {activeFilterCount > 0 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    <strong>{activeFilterCount}</strong> filter{activeFilterCount !== 1 ? 's' : ''} active. Charts will update automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* KPI Cards - Data Health (single endpoint) */}
        {healthKpiError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            Failed to load KPI counts{(healthKpiErr as any)?.message ? `: ${(healthKpiErr as any).message}` : "."}
          </div>
        )}
        
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <KPICard
            title="Incidents"
            value={healthKpiLoading ? "—" : counts.incident}
            trend="up"
            variant="warning"
            icon={<AlertTriangle className="h-5 w-5" />}
            iconBgClass="bg-amber-100 text-amber-700"
            info="An incident is an unplanned event that resulted in injury, illness, property damage, environmental impact, or operational disruption and was formally reported."
          />
          <KPICard
            title="Hazards"
            value={healthKpiLoading ? "—" : counts.hazard}
            trend="up"
            variant="danger"
            icon={<ShieldAlert className="h-5 w-5" />}
            iconBgClass="bg-rose-100 text-rose-600"
            info="A hazard is a potential source of harm — a condition or activity that could cause injury, illness, property damage, or environmental impact if not controlled."
          />
          <KPICard
            title="Audits"
            value={healthKpiLoading ? "—" : counts.audit}
            trend="up"
            variant="default"
            icon={<FileCheck className="h-5 w-5" />}
            iconBgClass="bg-accent/10 text-accent"
            info="An audit is a structured, formal assessment against standards or procedures to verify compliance and the effectiveness of the safety management system."
          />
          <KPICard
            title="Inspections"
            value={healthKpiLoading ? "—" : counts.inspection}
            trend="up"
            variant="success"
            icon={<ClipboardCheck className="h-5 w-5" />}
            iconBgClass="bg-emerald-100 text-emerald-600"
            info="An inspection is a routine on‑site check to identify unsafe acts/conditions and verify that controls are in place and functioning."
          />
          <KPICard
            title="Audit Findings"
            value={healthKpiLoading ? "—" : counts.audit_findings}
            trend="up"
            variant="warning"
            icon={<ListChecks className="h-5 w-5" />}
            iconBgClass="bg-amber-100 text-amber-700"
            info="Audit findings are the individual nonconformities or issues identified during an audit that require corrective or preventive action."
          />
          <KPICard
            title="Inspection Findings"
            value={healthKpiLoading ? "—" : counts.inspection_findings}
            trend="up"
            variant="warning"
            icon={<ListChecks className="h-5 w-5" />}
            iconBgClass="bg-amber-100 text-amber-700"
            info="Inspection findings are the issues or observations identified during inspections that indicate unsafe acts/conditions or control gaps."
          />
        </div>

        {/* Advanced KPI Cards */}
        {kpiError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
            Failed to load advanced KPI data: {kpiError}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* TRIR */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">TRIR</CardTitle>
                    <CardDescription>Total Recordable Incident Rate</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">TRIR - Total Recordable Incident Rate</p>
                        <p className="text-sm mb-2">Measures the number of recordable work-related injuries per 200,000 hours worked.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          TRIR = (Total Recordable Cases × 200,000) / Total Hours Worked
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>Recordable cases:</strong> Injuries requiring medical treatment beyond first aid</li>
                          <li>• <strong>200,000 hours:</strong> Equivalent to 100 employees working 40 hours/week for 50 weeks</li>
                          <li>• <strong>Industry benchmark:</strong> Below 3.0 is considered good</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground">—</div>
                    <div className="mt-2 h-5 w-24 bg-muted animate-pulse rounded"></div>
                    <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                  </>
                ) : kpiSummary ? (
                  <>
                    <div className="text-3xl font-bold" style={{ color: kpiSummary.trir.color }}>
                      {kpiSummary.trir.value}
                    </div>
                    <Badge className="mt-2">{kpiSummary.trir.benchmark}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.trir.recordable_incidents} incidents / {(kpiSummary.trir.total_hours_worked / 1000000).toFixed(1)}M hours
                    </p>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>

            {/* LTIR */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">LTIR</CardTitle>
                    <CardDescription>Lost Time Incident Rate</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">LTIR - Lost Time Incident Rate</p>
                        <p className="text-sm mb-2">Measures incidents that result in an employee being unable to work the next scheduled shift.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          LTIR = (Lost Time Incidents × 200,000) / Total Hours Worked
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>Lost time incident:</strong> Employee misses at least one full day of work</li>
                          <li>• <strong>Excludes:</strong> Day of injury and first aid cases</li>
                          <li>• <strong>Industry benchmark:</strong> Below 1.0 is considered excellent</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground">—</div>
                    <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                  </>
                ) : kpiSummary ? (
                  <>
                    <div className="text-3xl font-bold">
                      {kpiSummary.ltir.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.ltir.lost_time_incidents} lost-time incidents
                    </p>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>

            {/* PSTIR */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">PSTIR</CardTitle>
                    <CardDescription>Process Safety Total Incident Rate</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">PSTIR - Process Safety Total Incident Rate</p>
                        <p className="text-sm mb-2">Measures incidents related to process safety (fires, explosions, chemical releases).</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          PSTIR = (Process Safety Events × 200,000) / Total Hours Worked
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>Process safety events:</strong> Unplanned releases, fires, explosions</li>
                          <li>• <strong>Focus:</strong> Major hazard scenarios and catastrophic risks</li>
                          <li>• <strong>Industry benchmark:</strong> Below 0.5 is considered good</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground">—</div>
                    <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                  </>
                ) : kpiSummary ? (
                  <>
                    <div className="text-3xl font-bold">
                      {kpiSummary.pstir.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.pstir.psm_incidents} PSM incidents
                    </p>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>

            {/* Near-Miss Ratio */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Near-Miss Ratio</CardTitle>
                    <CardDescription>Near-Miss to Incident Ratio</CardDescription>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-semibold mb-2">Near-Miss Ratio</p>
                        <p className="text-sm mb-2">Compares near-miss reports to actual incidents. Higher ratio indicates better safety culture.</p>
                        <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                          Ratio = Near-Miss Reports / Total Incidents
                        </p>
                        <ul className="text-xs space-y-1">
                          <li>• <strong>Near-miss:</strong> Event that could have caused injury but didn't</li>
                          <li>• <strong>Good ratio:</strong> 10:1 or higher (10 near-misses per incident)</li>
                          <li>• <strong>Indicates:</strong> Strong reporting culture and proactive hazard identification</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent>
                {kpiLoading ? (
                  <>
                    <div className="text-3xl font-bold text-muted-foreground">—</div>
                    <div className="mt-2 h-5 w-24 bg-muted animate-pulse rounded"></div>
                    <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                  </>
                ) : kpiSummary ? (
                  <>
                    <div className="text-3xl font-bold" style={{ color: kpiSummary.near_miss_ratio.color }}>
                      {kpiSummary.near_miss_ratio.ratio}:1
                    </div>
                    <Badge className="mt-2">{kpiSummary.near_miss_ratio.benchmark}</Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpiSummary.near_miss_ratio.near_misses} near-misses / {kpiSummary.near_miss_ratio.incidents} incidents
                    </p>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Analytics Overview (hazards first, then incidents) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trends: Hazards */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Date Range Filter</h3>
              <ChartDateFilter
                startDate={hazardsStartDate}
                endDate={hazardsEndDate}
                onStartDateChange={setHazardsStartDate}
                onEndDateChange={setHazardsEndDate}
                onClear={() => {
                  setHazardsStartDate(undefined);
                  setHazardsEndDate(undefined);
                }}
              />
            </div>
            <div className="relative">
              <ShadcnLineCardEnhanced 
                title="Hazards Trend" 
                params={hazardsParams} 
                refreshKey={refreshKey}
                datasetType="hazard"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-sm">
                    <p className="font-semibold mb-2">Hazards Trend</p>
                    <p className="text-sm mb-2">Shows the number of hazards identified each month over time.</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                      Count = Total Hazards Identified per Month
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• <strong>Rising trend:</strong> More hazards being identified (could indicate better reporting)</li>
                      <li>• <strong>Falling trend:</strong> Fewer hazards (could indicate improved conditions or underreporting)</li>
                      <li>• <strong>Use case:</strong> Track proactive hazard identification efforts</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Trends: Incidents */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Date Range Filter</h3>
              <ChartDateFilter
                startDate={incidentsStartDate}
                endDate={incidentsEndDate}
                onStartDateChange={setIncidentsStartDate}
                onEndDateChange={setIncidentsEndDate}
                onClear={() => {
                  setIncidentsStartDate(undefined);
                  setIncidentsEndDate(undefined);
                }}
              />
            </div>
            <div className="relative">
              <ShadcnLineCardEnhanced 
                title="Incidents Trend" 
                params={incidentsParams} 
                refreshKey={refreshKey}
                datasetType="incident"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-sm">
                    <p className="font-semibold mb-2">Incidents Trend</p>
                    <p className="text-sm mb-2">Displays the total number of incidents reported each month.</p>
                    <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                      Count = Total Incidents per Month
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• <strong>Peaks:</strong> Months with higher incident counts (investigate causes)</li>
                      <li>• <strong>Valleys:</strong> Months with fewer incidents (positive trend)</li>
                      <li>• <strong>Use case:</strong> Monitor reactive safety performance over time</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Root Cause Pareto */}
          <div className="lg:col-span-12 relative">
            <ShadcnParetoCard title="Root Cause Pareto" endpoint="/analytics/data/root-cause-pareto" params={{ dataset: "incident", ...filterParams }} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Root Cause Pareto Chart</p>
                  <p className="text-sm mb-2">Identifies the top root causes responsible for most incidents (80/20 rule).</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Cumulative % = (Sum of Top Causes / Total) × 100
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Bars:</strong> Count of incidents per root cause</li>
                    <li>• <strong>Line:</strong> Cumulative percentage (aim for 80% with fewest causes)</li>
                    <li>• <strong>Use case:</strong> Focus corrective actions on top 3-5 causes for maximum impact</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Top Findings Section */}
          <div className="lg:col-span-12 relative">
            <ShadcnBarCard title="Top Hazard Findings" endpoint="/analytics/data/hazard-top-findings" params={filterParams} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Top Hazard Findings</p>
                  <p className="text-sm mb-2">Shows the most frequently identified hazard descriptions and violation types.</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Count = Number of Similar Hazards Identified
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Data source:</strong> Hazard descriptions and violation types</li>
                    <li>• <strong>Top findings:</strong> Most common hazardous conditions</li>
                    <li>• <strong>Use case:</strong> Focus on controlling recurring hazards</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="lg:col-span-12 relative">
            <ShadcnBarCard title="Top Incident Findings" endpoint="/analytics/data/incident-top-findings" params={filterParams} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Top Incident Findings</p>
                  <p className="text-sm mb-2">Displays the most common incident descriptions, conclusions, and root causes.</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Count = Number of Similar Incidents
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Data source:</strong> Incident descriptions and conclusions</li>
                    <li>• <strong>Top findings:</strong> Most recurring incident types or causes</li>
                    <li>• <strong>Use case:</strong> Target preventive measures for common incidents</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="lg:col-span-12 relative">
            <ShadcnBarCard title="Top Audit Findings" endpoint="/analytics/data/audit-top-findings" params={filterParams} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Top Audit Findings</p>
                  <p className="text-sm mb-2">Shows the most frequently identified findings from safety audits.</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Count = Number of Times Finding Was Identified
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Data source:</strong> Audit findings from formal assessments</li>
                    <li>• <strong>Top findings:</strong> Most common nonconformities or issues</li>
                    <li>• <strong>Use case:</strong> Identify systemic gaps and compliance issues</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="lg:col-span-12 relative">
            <ShadcnBarCard title="Top Inspection Findings" endpoint="/analytics/data/inspection-top-findings" params={filterParams} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Top Inspection Findings</p>
                  <p className="text-sm mb-2">Lists the most commonly identified issues during safety inspections.</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Count = Number of Times Finding Was Reported
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Top findings:</strong> Issues that appear most frequently across inspections</li>
                    <li>• <strong>Examples:</strong> Housekeeping, PPE violations, equipment issues</li>
                    <li>• <strong>Use case:</strong> Prioritize corrective actions and training needs</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-12 relative">
            <ShadcnHeatmapCard title="Department × Month (Avg)" endpoint="/analytics/data/department-month-heatmap" params={{ dataset: "incident", ...filterParams }} refreshKey={refreshKey} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-sm">
                  <p className="font-semibold mb-2">Department × Month Heatmap</p>
                  <p className="text-sm mb-2">Shows average risk/severity scores by department and month. Helps identify patterns.</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded mb-2">
                    Avg = Sum(Scores) / Count per Department-Month
                  </p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Color scale:</strong> Light = low values, Dark = high values</li>
                    <li>• <strong>Rows:</strong> Different departments</li>
                    <li>• <strong>Columns:</strong> Different months</li>
                    <li>• <strong>Use case:</strong> Spot departments or time periods with elevated risk</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
              <PlotlyCard title="Funnel" endpoint="/analytics/conversion/funnel" height={420} refreshKey={refreshKey} />
              <PlotlyCard title="Time Lag" endpoint="/analytics/conversion/time-lag" height={420} refreshKey={refreshKey} />
              <PlotlyCard title="Hazard to Incident Flow Analysis" endpoint="/analytics/conversion/sankey" height={600} refreshKey={refreshKey} />
              <PlotlyCard title="Department Matrix" endpoint="/analytics/conversion/department-matrix" height={700} refreshKey={refreshKey} />
              <PlotlyCard title="Prevention Effectiveness" endpoint="/analytics/conversion/prevention-effectiveness" height={700} refreshKey={refreshKey} />
              <PlotlyCard title="Metrics Gauge" endpoint="/analytics/conversion/metrics-gauge" height={420} refreshKey={refreshKey} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RecentList title="Recent Incidents" fetcher={getRecentIncidents} limit={5} />
          <RecentList title="Recent Hazards" fetcher={getRecentHazards} limit={5} />
          <RecentList title="Recent Audits" fetcher={getRecentAudits} limit={5} />
        </div>
      </main>
    </div>
  );
}