import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Plot from "react-plotly.js";

interface DonutChartProps {
  title: string;
  centerText?: string;
  centerValue?: string;
  data?: any;
  className?: string;
}

export function DonutChart({ title, centerText, centerValue, data, className }: DonutChartProps) {
  // Mock data for demonstration
  const mockData = data || {
    data: [
      {
        values: [45, 25, 20, 10],
        labels: ['Operations', 'Maintenance', 'Safety', 'Admin'],
        type: 'pie',
        hole: 0.6,
        marker: {
          colors: [
            'hsl(174, 84%, 35%)',
            'hsl(201, 96%, 32%)', 
            'hsl(38, 92%, 50%)',
            'hsl(0, 84%, 60%)'
          ]
        },
        textinfo: 'none',
        hovertemplate: '<b>%{label}</b><br>%{value}%<br><extra></extra>'
      }
    ],
    layout: {
      showlegend: true,
      legend: {
        orientation: 'v',
        x: 1,
        y: 0.5,
        font: { size: 12 }
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 12 },
      margin: { l: 20, r: 100, t: 20, b: 20 },
      annotations: centerText && centerValue ? [
        {
          text: `<b style="font-size:24px">${centerValue}</b><br><span style="font-size:14px;color:#64748B">${centerText}</span>`,
          x: 0.5,
          y: 0.5,
          xref: 'paper',
          yref: 'paper',
          showarrow: false,
          font: { size: 16 }
        }
      ] : []
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