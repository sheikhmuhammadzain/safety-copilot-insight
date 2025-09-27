import { useQuery } from "@tanstack/react-query";
import { getPlotly } from "@/lib/api";

export function usePlotly(endpoint: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ["plotly", endpoint, params],
    queryFn: async () => {
      const res = await getPlotly(endpoint, params);
      return res.figure;
    },
  });
}
