import axios from "axios";
import { API_BASE_URL, buildUrl } from "./config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Accept": "application/json",
  },
});

export type PlotlyResponse = { figure: any };
export type MapHtmlResponse = { html: string };

export async function getPlotly(path: string, params?: Record<string, any>) {
  const res = await api.get<PlotlyResponse>(path, { params });
  return res.data;
}

export async function getHtml(path: string, params?: Record<string, any>) {
  const res = await api.get<MapHtmlResponse>(path, { params });
  return res.data;
}

export type AgentResponse = {
  code: string;
  stdout: string;
  error: string;
  result_preview: Array<Record<string, any>>;
  figure?: any;
  mpl_png_base64?: string | null;
  analysis: string;
};

export async function runAgent(params: { question: string; dataset?: string; model?: string }) {
  const res = await api.get<AgentResponse>("/agent/run", { params });
  return res.data;
}

// Workbooks
export type WorkbookReloadResponse = {
  reloaded: boolean;
  sheet_count?: number;
  sheets?: string[];
};

export async function reloadWorkbooks() {
  const res = await api.get<WorkbookReloadResponse>("/workbooks/reload");
  return res.data;
}

export type WorkbookSelection = {
  incident?: string;
  hazard?: string;
  audit?: string;
  inspection?: string;
};

export async function getWorkbookSelection() {
  const res = await api.get<WorkbookSelection>("/workbooks/selection");
  return res.data;
}

export async function uploadWorkbook(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post("/workbooks/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as any; // backend returns summary of sheets (names, columns, sample rows)
}

export async function loadExampleWorkbook() {
  const res = await api.get("/workbooks/example");
  return res.data as any;
}

// Wordclouds
export type WordItem = {
  text: string;
  value: number;
  color?: string;
  type?: string;
};

export type DepartmentWordcloudResponse = {
  incident: WordItem[];
  hazard: WordItem[];
  html_incident?: string;
  html_hazard?: string;
};

export async function getDepartmentWordcloud(params?: { top_n?: number; min_count?: number }) {
  const res = await api.get<DepartmentWordcloudResponse>("/wordclouds/departments", { params });
  return res.data;
}

// Wordcloud image helpers
export type WordcloudImageOptions = {
  width?: number;
  height?: number;
  background_color?: string;
  extra_stopwords?: string; // comma-separated
  department?: string; // when provided, uses department-image endpoint
  dataset?: "incident" | "hazard"; // default incident
  cacheBust?: string | number; // optional cache buster
};

export function getWordcloudImageUrl(opts: WordcloudImageOptions = {}) {
  const {
    width = 1200,
    height = 520,
    background_color = "white",
    extra_stopwords,
    department,
    dataset = "incident",
    cacheBust,
  } = opts;

  const endpoint = department ? "/wordclouds/department-image" : "/wordclouds/image";
  const params: Record<string, any> = {
    dataset,
    width,
    height,
    background_color,
  };
  if (extra_stopwords) params.extra_stopwords = extra_stopwords;
  if (department) params.department = department;
  if (cacheBust !== undefined) params.__t = cacheBust;

  return buildUrl(endpoint, params);
}

// Department names wordcloud image (frequency-based)
export type DepartmentsWordcloudImageOptions = {
  dataset?: "incident" | "hazard" | "both"; // default: both
  width?: number;
  height?: number;
  background_color?: string;
  top_n?: number;
  min_count?: number;
  exclude_other?: boolean;
  cacheBust?: string | number;
};

export function getDepartmentsWordcloudImageUrl(opts: DepartmentsWordcloudImageOptions = {}) {
  const {
    dataset = "both",
    width = 1200,
    height = 520,
    background_color = "white",
    top_n,
    min_count,
    exclude_other,
    cacheBust,
  } = opts;
  const params: Record<string, any> = { dataset, width, height, background_color };
  if (top_n !== undefined) params.top_n = top_n;
  if (min_count !== undefined) params.min_count = min_count;
  if (exclude_other !== undefined) params.exclude_other = exclude_other;
  if (cacheBust !== undefined) params.__t = cacheBust;
  return buildUrl("/wordclouds/departments-image", params);
}

// Lists
export type AnyRecord = Record<string, any>;

export async function getIncidents() {
  const res = await api.get<AnyRecord[]>("/incidents");
  return res.data;
}

export async function getHazards() {
  const res = await api.get<AnyRecord[]>("/hazards");
  return res.data;
}

export async function getAudits() {
  const res = await api.get<AnyRecord[]>("/audits");
  return res.data;
}

export async function getActionsOutgoing() {
  const res = await api.get<AnyRecord[]>("/actions/outgoing");
  return res.data;
}

// Recent lists
export async function getRecentIncidents(limit = 5) {
  const res = await api.get<AnyRecord[]>("/incidents/recent", { params: { limit } });
  return res.data;
}

export async function getRecentHazards(limit = 5) {
  const res = await api.get<AnyRecord[]>("/hazards/recent", { params: { limit } });
  return res.data;
}

export async function getRecentAudits(limit = 5) {
  const res = await api.get<AnyRecord[]>("/audits/recent", { params: { limit } });
  return res.data;
}

// Data health counts (single endpoint for multiple KPIs)
export type DataHealthCounts = {
  counts: {
    incident: number;
    hazard: number;
    audit: number;
    inspection: number;
    audit_findings: number;
    inspection_findings: number;
  };
  selected_sheets?: Record<string, string>;
  timestamp: string;
};

export async function getDataHealthCountsAll(params?: Record<string, any>) {
  const res = await api.get<DataHealthCounts>("/data-health/counts/all", { params });
  return res.data;
}

// Conversion analytics (JSON endpoints)
export async function getConversionLinks() {
  const res = await api.get<any>("/analytics/conversion/links");
  return res.data;
}

export async function getConversionMetrics() {
  const res = await api.get<any>("/analytics/conversion/metrics");
  return res.data;
}

export async function getDepartmentMetricsData() {
  const res = await api.get<AnyRecord[]>("/analytics/conversion/department-metrics-data");
  return res.data;
}

// Chart insights
export type ChartInsightsRequest = {
  figure: any;
  title?: string;
  context?: string;
};

export type ChartInsightsResponse = {
  insights_md: string;
};

export async function postChartInsights(payload: ChartInsightsRequest) {
  const res = await api.post<ChartInsightsResponse>("/analytics/insights", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
}

// Prefer per-chart insights: GET `${endpoint}/insights` with same query params
export async function getChartInsightsForEndpoint(endpoint: string, params?: Record<string, any>) {
  const base = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const path = `${base.replace(/\/$/, "")}/insights`;
  const res = await api.get<ChartInsightsResponse>(path, { params });
  return res.data;
}

// Filter Options
export type FilterOption = {
  value: string;
  label: string;
  count: number;
};

export type DateRangeInfo = {
  min_date: string | null;
  max_date: string | null;
  total_records: number;
};

export type NumericRange = {
  min: number;
  max: number;
  avg: number;
  median: number;
  count: number;
};

export type FilterOptionsResponse = {
  dataset: string;
  date_range: DateRangeInfo;
  departments: FilterOption[];
  locations: FilterOption[];
  sublocations: FilterOption[];
  statuses: FilterOption[];
  incident_types: FilterOption[];
  violation_types: FilterOption[];
  severity_range: NumericRange;
  risk_range: NumericRange;
  total_records: number;
};

export type CombinedFilterOptionsResponse = {
  incident: FilterOptionsResponse;
  hazard: FilterOptionsResponse;
  last_updated: string;
};

export async function getFilterOptions(dataset: "incident" | "hazard" = "incident") {
  const res = await api.get<FilterOptionsResponse>("/analytics/filter-options", {
    params: { dataset },
  });
  return res.data;
}

export async function getCombinedFilterOptions() {
  const res = await api.get<CombinedFilterOptionsResponse>("/analytics/filter-options/combined");
  return res.data;
}

// Enhanced Tooltips
export type CountItem = {
  name: string;
  count: number;
};

export type ScoreStats = {
  avg: number;
  max: number;
  min: number;
};

export type RecentItem = {
  title: string;
  department: string;
  date: string;
  severity: number | null;
};

export type MonthDetailedData = {
  month: string;
  total_count: number;
  departments: CountItem[];
  types: CountItem[];
  severity: ScoreStats | null;
  risk: ScoreStats | null;
  recent_items: RecentItem[];
};

export type DetailedTrendResponse = {
  labels: string[];
  series: { name: string; data: number[] }[];
  details: MonthDetailedData[];
};

export async function getDetailedTrend(params?: Record<string, any>) {
  const res = await api.get<DetailedTrendResponse>("/analytics/data/incident-trend-detailed", { params });
  return res.data;
}
