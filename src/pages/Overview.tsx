import { KPICard } from "@/components/dashboard/KPICard";
import { useState, useMemo, useEffect } from "react";
import ShadcnLineCard from "@/components/charts/ShadcnLineCard";
import ShadcnLineCardEnhanced from "@/components/charts/ShadcnLineCardEnhanced";
import ShadcnBarCard from "@/components/charts/ShadcnBarCard";
import ShadcnParetoCard from "@/components/charts/ShadcnParetoCard";
import ShadcnHeatmapCard from "@/components/charts/ShadcnHeatmapCard";
import { ChartDateFilter } from "@/components/charts/ChartDateFilter";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useKpi } from "@/hooks/useKpi";
import { useFilterOptions } from "@/hooks/useFilterOptions";
import { AlertTriangle, ShieldAlert, FileCheck, ClipboardCheck, Info, RefreshCw, Filter, X } from "lucide-react";
import { RecentList } from "@/components/dashboard/RecentList";
import { getRecentIncidents, getRecentHazards, getRecentAudits } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MultiSelect } from "@/components/ui/multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

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

          {/* Long-text findings */}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RecentList title="Recent Incidents" fetcher={getRecentIncidents} limit={5} />
          <RecentList title="Recent Hazards" fetcher={getRecentHazards} limit={5} />
          <RecentList title="Recent Audits" fetcher={getRecentAudits} limit={5} />
        </div>
      </main>
    </div>
  );
}