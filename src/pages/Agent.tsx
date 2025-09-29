import { useState } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Send, Code, BarChart3, FileText, Sparkles, ChevronDown } from "lucide-react";
import Plot from "react-plotly.js";
import { runAgent } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AITextLoading from "@/components/motion/AITextLoading";
 
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
  "Create prioritized action list for top 3 locations",
];

export default function Agent() {
  const [question, setQuestion] = useState("");
  const [dataset, setDataset] = useState<"incident" | "hazard" | "audit" | "inspection" | "all">("incident");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ question: string; response: AgentResponse }>>([]);
  const { toast } = useToast();
  const [codeOpen, setCodeOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    const started = Date.now();
    try {
      const data = await runAgent({ question, dataset });
      setResponse(data);
      setHistory((prev) => [...prev, { question, response: data }]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from Safety Copilot",
        variant: "destructive",
      });
    } finally {
      const elapsed = Date.now() - started;
      const minVisible = 800; // ms
      const remaining = Math.max(0, minVisible - elapsed);
      setTimeout(() => setLoading(false), remaining);
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

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-4">
              <AITextLoading
                texts={[
                  "Thinking...",
                  "Analyzing data...",
                  "Cross-checking KPIs...",
                  "Summarizing insights...",
                  "Almost there...",
                ]}
                interval={1100}
                className="text-xl md:text-2xl"
              />
            </CardContent>
          </Card>
        )}

        {/* Response Display */}
        {response && (
          <div className="space-y-6">
            {/* Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>AI Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {response.analysis || ""}
                    </ReactMarkdown>
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
                            <TableCell key={cellIndex}>{String(value)}</TableCell>
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
                    layout={{ ...response.figure.layout, autosize: true, height: 400 }}
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

            {/* Generated Code (Collapsible) */}
            <Card>
              <Collapsible open={codeOpen} onOpenChange={setCodeOpen}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Generated Code
                    </CardTitle>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                        {codeOpen ? "Hide" : "Show"} code
                        <ChevronDown className={`h-4 w-4 transition-transform ${codeOpen ? "rotate-180" : ""}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CardContent>
                  <CollapsibleContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{response.code}</code>
                    </pre>
                    {response.stdout && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Output:</h4>
                        <pre className="bg-secondary/50 p-3 rounded text-sm">{response.stdout}</pre>
                      </div>
                    )}
                    {response.error && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2 text-destructive">Error:</h4>
                        <pre className="bg-destructive/10 p-3 rounded text-sm text-destructive">{response.error}</pre>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
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