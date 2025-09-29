import { useEffect, useState } from "react";
import { getCache, setCache } from "@/lib/cache";

const TTL_DEFAULT = 1000 * 60 * 60 * 6; // 6h

function keyFromUrl(url: string) {
  return `sc_cache:image:${url}`;
}

export function useCachedImage(url: string | null | undefined, ttlMs = TTL_DEFAULT, refreshKey?: number) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      if (!url) {
        setDataUrl(null);
        return;
      }
      const key = keyFromUrl(url);
      setLoading(true);
      setError(null);
      try {
        if (!refreshKey) {
          const cached = getCache<string>(key);
          if (cached && mounted) {
            setDataUrl(cached);
            setLoading(false);
            return;
          }
        }
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrlPromise: Promise<string> = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result));
          reader.onerror = (e) => reject(e);
        });
        reader.readAsDataURL(blob);
        const du = await dataUrlPromise;
        if (!mounted) return;
        setDataUrl(du);
        setCache(key, du, ttlMs);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Image fetch failed');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [url ?? '', ttlMs, refreshKey ?? 0]);

  return { dataUrl, loading, error } as const;
}
