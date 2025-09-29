import { useQuery } from "@tanstack/react-query";
import { getPlotly } from "@/lib/api";
import { getCache, makeKey, setCache } from "@/lib/cache";

const PLOTLY_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export function usePlotly(endpoint: string, params?: Record<string, any>, refreshKey?: number) {
  return useQuery({
    queryKey: ["plotly", endpoint, params, refreshKey ?? 0],
    queryFn: async () => {
      const key = makeKey(endpoint, params);
      if (!refreshKey) {
        const cached = getCache<any>(key);
        if (cached) return cached;
      }
      const res = await getPlotly(endpoint, params);
      setCache(key, res.figure, PLOTLY_TTL_MS);
      return res.figure;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}
