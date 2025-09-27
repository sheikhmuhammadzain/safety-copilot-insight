import { useMemo } from "react";
import { usePlotly } from "@/hooks/usePlotly";

export function useKpi(
  endpoint: string,
  params: Record<string, any> | undefined,
  derive: (figure: any | undefined) => number | null
) {
  const { data: figure, isLoading, isError, error } = usePlotly(endpoint, params);

  const value = useMemo(() => {
    try {
      return derive?.(figure);
    } catch (e) {
      return null;
    }
  }, [figure, derive]);

  return { value, isLoading, isError, error };
}
