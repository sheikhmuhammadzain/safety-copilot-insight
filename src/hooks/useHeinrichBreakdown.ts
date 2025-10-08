import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getCache, makeKey, setCache } from "@/lib/cache";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const HEINRICH_BREAKDOWN_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

interface FilterParams {
  startDate?: string;
  endDate?: string;
}

export function useHeinrichBreakdown(filters: FilterParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ["heinrich-breakdown", filters],
    queryFn: async () => {
      const key = makeKey("/analytics/advanced/heinrich-pyramid-breakdown", filters);
      const cached = getCache<any>(key);
      if (cached) return cached;
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      
      const response = await axios.get(`${API_BASE}/analytics/advanced/heinrich-pyramid-breakdown?${params}`);
      setCache(key, response.data, HEINRICH_BREAKDOWN_TTL_MS);
      return response.data;
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}
