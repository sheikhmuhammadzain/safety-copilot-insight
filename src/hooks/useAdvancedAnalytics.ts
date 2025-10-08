import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getCache, makeKey, setCache } from "@/lib/cache";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const ADVANCED_ANALYTICS_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

interface FilterParams {
  startDate?: string;
  endDate?: string;
  location?: string;
  department?: string;
}

// Hook for Site Safety Index
export function useSafetyIndex(filters: FilterParams, refreshKey?: number) {
  return useQuery({
    queryKey: ["safety-index", filters, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey("/analytics/advanced/site-safety-index", filters);
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);
      
      const response = await axios.get(`${API_BASE}/analytics/advanced/site-safety-index?${params}`);
      setCache(key, response.data, ADVANCED_ANALYTICS_TTL_MS);
      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

// Hook for Incident Forecast
export function useIncidentForecast(filters: FilterParams, monthsAhead: number = 4, refreshKey?: number) {
  return useQuery({
    queryKey: ["incident-forecast", filters, monthsAhead, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey("/analytics/predictive/incident-forecast", { ...filters, months_ahead: monthsAhead });
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);
      params.append("months_ahead", String(monthsAhead));
      
      const response = await axios.get(`${API_BASE}/analytics/predictive/incident-forecast?${params}`);
      setCache(key, response.data, ADVANCED_ANALYTICS_TTL_MS);
      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

// Hook for Leading vs Lagging Indicators
export function useLeadingLagging(filters: FilterParams, refreshKey?: number) {
  return useQuery({
    queryKey: ["leading-lagging", filters, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey("/analytics/predictive/leading-vs-lagging", filters);
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);
      
      const response = await axios.get(`${API_BASE}/analytics/predictive/leading-vs-lagging?${params}`);
      setCache(key, response.data, ADVANCED_ANALYTICS_TTL_MS);
      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

// Hook for Risk Trend Projection
export function useRiskTrend(filters: FilterParams, monthsAhead: number = 3, refreshKey?: number) {
  return useQuery({
    queryKey: ["risk-trend", filters, monthsAhead, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey("/analytics/predictive/risk-trend-projection", { ...filters, months_ahead: monthsAhead });
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);
      params.append("months_ahead", String(monthsAhead));
      
      const response = await axios.get(`${API_BASE}/analytics/predictive/risk-trend-projection?${params}`);
      setCache(key, response.data, ADVANCED_ANALYTICS_TTL_MS);
      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

// Hook for Heinrich's Pyramid
export function useHeinrichPyramid(filters: FilterParams, refreshKey?: number) {
  return useQuery({
    queryKey: ["heinrich-pyramid", filters, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey("/analytics/advanced/heinrich-pyramid", filters);
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.location) params.append("location", filters.location);
      if (filters.department) params.append("department", filters.department);
      
      const response = await axios.get(`${API_BASE}/analytics/advanced/heinrich-pyramid?${params}`);
      setCache(key, response.data, ADVANCED_ANALYTICS_TTL_MS);
      return response.data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}
