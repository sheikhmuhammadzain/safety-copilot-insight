import { useState, useEffect } from "react";
import { getCombinedFilterOptions, CombinedFilterOptionsResponse, FilterOption } from "@/lib/api";

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

let cachedOptions: CombinedFilterOptionsResponse | null = null;
let cacheTimestamp: number | null = null;

export function useFilterOptions() {
  const [options, setOptions] = useState<CombinedFilterOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const now = Date.now();
        
        // Use cached data if available and not expired
        if (cachedOptions && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
          setOptions(cachedOptions);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const data = await getCombinedFilterOptions();
        cachedOptions = data;
        cacheTimestamp = now;
        setOptions(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch filter options:", err);
        setError(err instanceof Error ? err.message : "Failed to load filter options");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Helper to get options for specific dataset
  const getDatasetOptions = (dataset: "incident" | "hazard") => {
    return options?.[dataset] || null;
  };

  // Helper to convert FilterOption[] to MultiSelect format
  const toMultiSelectOptions = (filterOptions: FilterOption[]) => {
    return filterOptions.map(opt => ({
      label: `${opt.label} (${opt.count})`,
      value: opt.value,
    }));
  };

  return {
    options,
    loading,
    error,
    getDatasetOptions,
    toMultiSelectOptions,
  };
}
