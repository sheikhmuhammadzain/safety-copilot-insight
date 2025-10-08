import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { getCache, makeKey, setCache } from "@/lib/cache";

// In-memory cache to reduce flicker when components unmount/mount quickly
const inMemoryCache = new Map<string, any>();

export function useCachedGet<T = any>(endpoint: string, params?: Record<string, any>, ttlMs = 1000 * 60 * 60 * 6, refreshKey?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const keyRef = useRef<string>(makeKey(endpoint, params));

  useEffect(() => {
    let mounted = true;
    const key = makeKey(endpoint, params);
    keyRef.current = key;

    async function run() {
      setError(null);
      try {
        // Check in-memory cache first (persists while app is running)
        if (!refreshKey && inMemoryCache.has(key)) {
          const cached = inMemoryCache.get(key);
          if (cached && mounted) {
            setData(cached);
            return;
          }
        }
        
        // Check localStorage cache
        if (!refreshKey) {
          const cached = getCache<T>(key);
          if (cached && mounted) {
            setData(cached);
            inMemoryCache.set(key, cached);
            return;
          }
        }
        
        setLoading(true);
        const res = await api.get<T>(endpoint, { params });
        if (!mounted) return;
        setData(res.data);
        setCache(key, res.data, ttlMs);
        inMemoryCache.set(key, res.data);
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
