import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Plot from "react-plotly.js";

interface TrendChartProps {
  title: string;
  data?: any;
  className?: string;
}

export function TrendChart({ title, data, className }: TrendChartProps) {
  // Mock data for demonstration
  const mockData = data || {
    data: [
      {
        x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        y: [10, 12, 8, 15, 10, 12],
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Incidents',
        line: { color: 'hsl(174, 84%, 35%)', width: 3 },
        marker: { color: 'hsl(174, 84%, 35%)', size: 6 }
      }
    ],
    layout: {
      title: { text: '', font: { size: 16 } },
      xaxis: { 
        title: 'Month',
        showgrid: false,
        zeroline: false
      },
      yaxis: { 
        title: 'Count',
        showgrid: true,
        gridcolor: 'rgba(0,0,0,0.1)',
        zeroline: false
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 12 },
      margin: { l: 40, r: 20, t: 20, b: 40 },
      showlegend: false
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <Plot
            data={mockData.data}
            layout={mockData.layout}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}