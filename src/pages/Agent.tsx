import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Code, BarChart3, FileText, Sparkles } from "lucide-react";
import Plot from "react-plotly.js";

interface AgentResponse {
  code: string;
  stdout: string;
  error: string;
  result_preview: Array<Record<string, any>>;
  figure?: any;
  mpl_png_base64?: string | null;
  analysis: string;
}

const EXAMPLE_PROMPTS = [
  "Top 5 departments with most incidents",
  "Weekly incident trend with average severity and total cost",
  "Incidents per location with average severity",
  "Top 10 violation types",
  "Audit completion rates by month",
  "Consequence matrix for incidents",
  "Create prioritized action list for top 3 locations"
];

export default function Agent() {
  const [question, setQuestion] = useState("");
  const [dataset, setDataset] = useState<"incident" | "hazard" | "audit" | "inspection" | "all">("incident");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{question: string; response: AgentResponse}>>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const url = `http://127.0.0.1:8000/agent/run?question=${encodeURIComponent(question)}&dataset=${dataset}`;
      
      // Simulate API response for now
      setTimeout(() => {
        const mockResponse: AgentResponse = {
          code: `# Analysis for: ${question}
# Dataset: ${dataset}

# Sample analysis code would be generated here
df_filtered = df[df['status'] != 'closed']
result = df_filtered.groupby('department').size().sort_values(ascending=False).head(5)
print("Top departments by incident count:")
print(result)`,
          stdout: "Top departments by incident count:\nOperations    45\nMaintenance   32\nSafety        28\nEngineering   19\nHR            12",
          error: "",
          result_preview: [
            { department: "Operations", count: 45 },
            { department: "Maintenance", count: 32 },
            { department: "Safety", count: 28 },
            { department: "Engineering", count: 19 },
            { department: "HR", count: 12 }
          ],
          figure: {
            data: [{
              type: "bar",
              orientation: "h",
              x: [45, 32, 28, 19, 12],
              y: ["Operations", "Maintenance", "Safety", "Engineering", "HR"],
              marker: { color: "#0EA5A4" }
            }],
            layout: {
              title: { text: "Top 5 Departments by Incident Count" },
              yaxis: { autorange: "reversed" },
              margin: { l: 100, r: 50, t: 50, b: 50 }
            }
          },
          analysis: `**Findings:**
- Operations department has the highest incident count (45), indicating potential process or safety issues
- Maintenance follows with 32 incidents, suggesting equipment-related safety concerns
- Safety department itself has 28 incidents, which may require review of protocols

**Recommendations:**
1. Conduct targeted safety training for Operations team
2. Review maintenance procedures and equipment safety protocols
3. Investigate root causes in top 3 departments

**Next Steps:**
- Schedule department-specific safety meetings
- Implement additional monitoring for high-risk areas
- Create action items for department heads`
        };

        setResponse(mockResponse);
        setHistory(prev => [...prev, { question, response: mockResponse }]);
        setLoading(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Safety Copilot",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setQuestion(prompt);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Safety Copilot</h1>
                <p className="text-sm text-muted-foreground">AI-powered safety analysis assistant</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Assistant</span>
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Query Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Ask Your Safety Question</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., What are the top 5 departments with most incidents?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="text-base"
                  />
                </div>
                <Select value={dataset} onValueChange={(value: any) => setDataset(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incidents</SelectItem>
                    <SelectItem value="hazard">Hazards</SelectItem>
                    <SelectItem value="audit">Audits</SelectItem>
                    <SelectItem value="inspection">Inspections</SelectItem>
                    <SelectItem value="all">All Data</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" disabled={loading || !question.trim()}>
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            {/* Example Prompts */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(prompt)}
                    className="text-xs"
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Display */}
        {response && (
          <div className="space-y-6">
            {/* Code and Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-4 w-4" />
                    <span>Generated Code</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{response.code}</code>
                  </pre>
                  {response.stdout && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Output:</h4>
                      <pre className="bg-secondary/50 p-3 rounded text-sm">
                        {response.stdout}
                      </pre>
                    </div>
                  )}
                  {response.error && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-destructive">Error:</h4>
                      <pre className="bg-destructive/10 p-3 rounded text-sm text-destructive">
                        {response.error}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>AI Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {response.analysis}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Preview */}
            {response.result_preview && response.result_preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(response.result_preview[0]).map((key) => (
                          <TableHead key={key} className="capitalize">
                            {key.replace(/_/g, " ")}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.result_preview.slice(0, 10).map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <TableCell key={cellIndex}>
                              {String(value)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {response.result_preview.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Showing first 10 of {response.result_preview.length} results
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Chart Visualization */}
            {response.figure && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Visualization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Plot
                    data={response.figure.data}
                    layout={{
                      ...response.figure.layout,
                      autosize: true,
                      height: 400
                    }}
                    config={{ responsive: true }}
                    style={{ width: "100%" }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Matplotlib Fallback */}
            {!response.figure && response.mpl_png_base64 && (
              <Card>
                <CardHeader>
                  <CardTitle>Visualization</CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={`data:image/png;base64,${response.mpl_png_base64}`}
                    alt="Analysis Chart"
                    className="max-w-full h-auto"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Query History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.slice(-5).reverse().map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Generated code and analysis • {item.response.result_preview?.length || 0} results
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}