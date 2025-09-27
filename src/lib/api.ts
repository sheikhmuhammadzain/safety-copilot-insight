import axios from "axios";
import { API_BASE_URL } from "./config";

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
