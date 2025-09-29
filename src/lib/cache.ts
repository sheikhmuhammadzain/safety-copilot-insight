// Simple localStorage JSON cache with TTL and namespacing
export type CacheEntry<T> = {
  v: T;
  t: number; // timestamp ms
  ttl: number; // ms
};

const NS = "sc_cache:";

export function makeKey(endpoint: string, params?: Record<string, any>) {
  const p = params ? JSON.stringify(params) : "";
  return `${NS}${endpoint}|${p}`;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  const entry: CacheEntry<T> = { v: value, t: Date.now(), ttl: ttlMs };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.t !== "number" || typeof entry.ttl !== "number") return null;
    if (Date.now() - entry.t > entry.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.v as T;
  } catch {
    return null;
  }
}

export function clearByPrefix(prefix: string) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function clearAllCache() {
  clearByPrefix(NS);
}
