export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://103.18.20.205:8087";

export function buildUrl(path: string, params?: Record<string, any>) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(base + p);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}
