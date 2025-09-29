import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getCache, makeKey, setCache } from "@/lib/cache";

export function useCachedGet<T = any>(endpoint: string, params?: Record<string, any>, ttlMs = 1000 * 60 * 60 * 6, refreshKey?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const key = makeKey(endpoint, params);

    async function run() {
      setLoading(true);
      setError(null);
      try {
        if (!refreshKey) {
          const cached = getCache<T>(key);
          if (cached && mounted) {
            setData(cached);
            setLoading(false);
            return;
          }
        }
        const res = await api.get<T>(endpoint, { params });
        if (!mounted) return;
        setData(res.data);
        setCache(key, res.data, ttlMs);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Request failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();
    return () => { mounted = false; };
  }, [endpoint, JSON.stringify(params || {}), refreshKey ?? 0, ttlMs]);

  return { data, error, loading } as const;
}
