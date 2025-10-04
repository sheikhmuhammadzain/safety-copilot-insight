import { useState, useRef, useEffect } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Code, BarChart3, Sparkles, ChevronDown, ChevronRight, StopCircle, Loader2, BookOpen, Copy, Trash2 } from "lucide-react";
import Plot from "react-plotly.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AgentResponse {
  code: string;
  stdout: string;
  error: string;
  result_preview: Array<Record<string, any>>;
  figure?: any;
  mpl_png_base64?: string | null;
  analysis: string;
}

interface ToolCall {
  tool: string;
  arguments: Record<string, any>;
  result?: any;
  timestamp?: number;
}

interface ChartData {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
  x_label?: string;
  y_label?: string;
  x_data?: any[];
  y_data?: any[];
  labels?: any[];
  values?: any[];
}

interface TableData {
  table: Array<Record<string, any>>;
  [key: string]: any;
}

interface StreamEvent {
  type: 'progress' | 'code_chunk' | 'code_generated' | 'analysis_chunk' | 'error' | 'verification' | 'complete' | 'thinking' | 'thinking_token' | 'reflection' | 'data_ready' | 'chain_of_thought' | 'reflection_chunk' | 'reasoning' | 'tool_call' | 'tool_result' | 'answer' | 'answer_token' | 'answer_complete' | 'final_answer' | 'final' | 'final_answer_complete' | 'start' | 'stream_end';
  message?: string;
  chunk?: string;
  code?: string;
  stage?: string;
  node?: string;
  attempt?: number;
  attempts?: number;
  data?: AgentResponse;
  thinking?: string[];
  content?: string;
  token?: string;
  is_valid?: boolean;
  confidence?: number;
  tool?: string;
  arguments?: Record<string, any>;
  result?: string;
  verification?: {
    is_valid: boolean;
    confidence: number;
    issues?: string[];
    suggestions?: string;
    explanation?: string;
    corrected_code?: string;
  };
}

const EXAMPLE_PROMPTS = [
  "Top 5 departments with most incidents",
  "Incidents per location with average severity",
  "Top 10 department of hazards",
  "Top 3 department of inspections",
];

// Queries Book: grouped questions by dataset for quick testing
const QUERIES_BOOK: Array<{
  title: string;
  dataset: 'incident' | 'hazard' | 'audit' | 'inspection' | 'all';
  items: string[];
}> = [
  {
    title: 'Incident-related Questions',
    dataset: 'incident',
    items: [
      'Which month/year had the highest number of incidents?',
      'Show the total number of incidents by department.',
      'What percentage of incidents are repeated?',
      'What is the most common incident type?',
      'What is the average resolution time (in days) for incidents?',
      'Show the top 10 incidents with the highest risk score.',
      'Which location has the highest number of incidents?',
      'What percentage of incidents are related to equipment failure?',
      'Find the correlation between severity score and estimated cost impact.',
      'How many incidents are missing root cause details?',
    ],
  },
  {
    title: 'Hazard ID-related Questions',
    dataset: 'hazard',
    items: [
      'Show the trend of reported hazards by month.',
      'Which violation type occurs most frequently in hazard reports?',
      'What is the distribution of worst-case consequence potential in hazards?',
      'Which department has the highest average risk score for hazards?',
      'How many hazards are missing corrective actions?',
      'Show the total and average estimated cost impact of all hazards.',
      'What percentage of hazards are repeated events?',
      'Who are the top 5 reporters with the most hazard IDs?',
    ],
  },
  {
    title: 'Audit & Audit Findings Questions',
    dataset: 'audit',
    items: [
      'Show the total number of audits by audit category.',
      'Plot the distribution of audit ratings.',
      'Which finding location is most common in audit findings?',
      'Show the distribution of worst-case consequences (C1, C2, C3, C4) in audits.',
      'Which auditor has performed the most audits?',
      'Show the top 10 most frequent audit findings.',
      'Calculate the average time taken to close an audit.',
    ],
  },
  {
    title: 'Inspection-related Questions',
    dataset: 'inspection',
    items: [
      'Show the total number of inspections per year.',
      'Which action item priority is most common in inspections?',
      'How many action items are overdue (due date < today and status not closed)?',
      'What is the most common worst-case consequence in inspection findings?',
      'Which location has the highest number of inspections?',
      'What is the closure rate (%) of inspection action items?',
      'Show the total number of inspections done by each inspector.',
    ],
  },
  {
    title: 'Cross-Sheet (Advanced Analysis) Questions',
    dataset: 'all',
    items: [
      'What are the top 5 departments appearing in both Incidents and Hazards?',
      'Compare the consequence categories (C1, C2, etc.) between Audit Findings and Incidents.',
      'In departments where hazard risk score > 2, how many incidents have occurred?',
      'Which locations appear in both Audits and Inspections most frequently?',
      'What is the combined ratio of missing corrective actions in Hazards and Incidents?',
    ],
  },
];

interface ConversationMessage {
  id: string;
  question: string;
  dataset: string;
  toolCalls: ToolCall[];
  analysis: string;
  response: AgentResponse | null;
  timestamp: number;
}

export default function Agent2() {
  const [question, setQuestion] = useState("");
  const [dataset, setDataset] = useState("all");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const { toast } = useToast();
  
  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [currentCode, setCurrentCode] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [currentStage, setCurrentStage] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentDataset, setCurrentDataset] = useState<string>(dataset);
  const websocketRef = useRef<WebSocket | null>(null);
  const [queriesOpen, setQueriesOpen] = useState(false);
  
  // Use ref for immediate tracking (no async state delays)
  const currentMessageIdRef = useRef<string | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const isAnswerModeRef = useRef<boolean>(false); // Track if we switched to answer mode
  const bottomRef = useRef<HTMLDivElement | null>(null); // Ref for auto-scroll to bottom

  // Auto-scroll to bottom only when response completes (not during streaming)
  // Removed auto-scroll during streaming to prevent jittery behavior

  // Save message to history when streaming completes
  useEffect(() => {
    // Only save when streaming stops and we have a message ID
    if (!isStreaming && currentMessageIdRef.current && currentQuestion) {
      const messageId = currentMessageIdRef.current;
      
      // Check if already saved
      if (savedMessageIdsRef.current.has(messageId)) {
        return;
      }
      
      // Check if we have content to save
      const hasContent = Boolean(
        currentQuestion ||
        currentAnalysis ||
        finalAnswer ||
        toolCalls.length > 0 ||
        response
      );
      
      if (!hasContent) {
        return;
      }
      
      console.log('💾 Saving message to history:', messageId, currentQuestion);
      
      // Mark as saved
      savedMessageIdsRef.current.add(messageId);
      
      // Save to history
      setConversationHistory(prev => [
        ...prev,
        {
          id: messageId,
          question: currentQuestion,
          dataset: currentDataset,
          toolCalls: toolCalls.slice(),
          analysis: currentAnalysis || finalAnswer || response?.analysis || "",
          response: response || null,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isStreaming, currentQuestion, currentAnalysis, finalAnswer, toolCalls, response, currentDataset]);

  // Load conversation from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('safety-copilot-conversation');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrate old messages without IDs
        const migrated = parsed.map((m: any) => ({
          ...m,
          id: m.id || `msg_${m.timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        }));
        setConversationHistory(migrated);
        // Rebuild savedMessageIds set
        savedMessageIdsRef.current = new Set(migrated.map((m: ConversationMessage) => m.id));
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (conversationHistory.length > 0) {
      try {
        localStorage.setItem('safety-copilot-conversation', JSON.stringify(conversationHistory));
      } catch (err) {
        console.error('Failed to save conversation:', err);
      }
    }
  }, [conversationHistory]);

  // Save current message to history (with duplicate prevention)
  const saveCurrentMessageToHistory = () => {
    const messageId = currentMessageIdRef.current;
    if (!messageId) return; // No active message
    
    // Check if already saved
    if (savedMessageIdsRef.current.has(messageId)) {
      console.log('Message already saved, skipping:', messageId);
      return;
    }

    const hasContent = Boolean(
      currentQuestion ||
      currentAnalysis ||
      finalAnswer ||
      toolCalls.length > 0 ||
      response
    );
    
    if (!hasContent) {
      console.log('No content to save');
      return;
    }

    console.log('Saving message to history:', messageId, currentQuestion);
    
    // Mark as saved immediately
    savedMessageIdsRef.current.add(messageId);
    
    setConversationHistory(prev => [
      ...prev,
      {
        id: messageId,
        question: currentQuestion,
        dataset: currentDataset,
        toolCalls: toolCalls.slice(),
        analysis: currentAnalysis || finalAnswer || response?.analysis || "",
        response: response || null,
        timestamp: Date.now(),
      },
    ]);
  };

  const startWebSocketStreaming = (overrideQuestion?: string, overrideDataset?: string) => {
    const q = (overrideQuestion ?? question).trim();
    const d = overrideDataset ?? dataset;
    if (!q) return;

    // Generate unique message ID FIRST
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentMessageIdRef.current = messageId;
    
    // Clear previous message states before starting new one
    setResponse(null);
    setCurrentAnalysis("");
    setFinalAnswer("");
    setToolCalls([]);
    setStreamEvents([]);
    setThinkingText("");
    setCurrentCode("");
    setCurrentStage("");
    isAnswerModeRef.current = false; // Reset answer mode
    
    // Set new question and dataset AFTER clearing
    setCurrentQuestion(q);
    setCurrentDataset(d);
    
    // Clear input field for next message
    setQuestion("");
    
    setIsStreaming(true);
    setLoading(true);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const WS_BASE = API_BASE.replace('http', 'ws');
    const params = new URLSearchParams({
      question: q,
      dataset: d,
      model: "z-ai/glm-4.5-air:free"
    });

    const ws = new WebSocket(`${WS_BASE}/ws/agent/stream?${params}`);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    
    };

    ws.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        console.log('📡 WebSocket message:', data);
        
        // Handle token-by-token streaming first (don't add to events)
        if (data.type === 'thinking_token' && data.token) {
          // Detect if we've switched to final answer mode (markdown headers indicate formatted response)
          if (!isAnswerModeRef.current && (data.token.includes('###') || data.token.includes('##') || data.token.includes('**'))) {
            isAnswerModeRef.current = true;
            console.log('🔄 Switched to answer mode - routing to final answer display');
          }
          
          if (isAnswerModeRef.current) {
            // Route to final answer display
            setCurrentAnalysis(prev => (prev || "") + data.token!);
            setFinalAnswer(prev => (prev || "") + data.token!);
          } else {
            // Keep in thinking box for actual reasoning
            setThinkingText(prev => prev + data.token!);
          }
          return;
        }
        
        if (data.type === 'answer_token' && data.token) {
          setCurrentAnalysis(prev => (prev || "") + data.token!);
          setFinalAnswer(prev => (prev || "") + data.token!);
          return;
        }
        
        setStreamEvents(prev => [...prev, data]);

        // Start/progress
        if (data.type === 'start' && data.message) {
          setCurrentStage(data.message);
        }
        if (data.type === 'progress' && data.message) {
          setCurrentStage(data.message);
        }

        // Thinking & reflections - handled via streamEvents display

        // Tool calling
        if (data.type === 'tool_call' && data.tool && data.arguments) {
          setToolCalls(prev => [
            ...prev,
            {
              tool: data.tool!,
              arguments: data.arguments!,
              timestamp: Date.now(),
            },
          ]);
        }
        if (data.type === 'tool_result' && data.tool && data.result) {
          setToolCalls(prev =>
            prev.map(tc =>
              !tc.result && tc.tool === data.tool
                ? { ...tc, result: (() => { try { return JSON.parse(data.result!); } catch { return data.result; } })() }
                : tc
            )
          );
        }

        // Code streaming
        if (data.type === 'code_chunk' && data.chunk) {
          setCurrentCode(prev => prev + data.chunk);
        }
        if (data.type === 'code_generated' && data.code) {
          setCurrentCode(data.code);
        }

        // Data & analysis
        if (data.type === 'data_ready' && data.data) {
          setResponse(data.data);
        }
        if (data.type === 'analysis_chunk' && data.chunk) {
          setCurrentAnalysis(prev => (prev || "") + data.chunk);
        }
        // Final answer streaming support (robust to backend variations)
        if ((data.type === 'answer' || data.type === 'final_answer' || data.type === 'final') && data.content) {
          setFinalAnswer(prev => (prev || "") + data.content);
          setCurrentAnalysis(prev => (prev || "") + data.content);
        }
        if ((data.type === 'answer_complete' || data.type === 'final_answer_complete') && data.content) {
          // Some backends send the whole content here; ensure we end with full answer
          setFinalAnswer(prev => (data.content && data.content.length > (prev?.length || 0) ? data.content : (prev || "")));
          setCurrentAnalysis(prev => (data.content && data.content.length > (prev?.length || 0) ? data.content : (prev || "")));
        }

        // Completion
        if (data.type === 'complete' || data.type === 'stream_end') {
          if (data.data) {
            setResponse(data.data);
            if (data.data.analysis && !currentAnalysis) {
              setCurrentAnalysis(data.data.analysis);
            }
          }
          
          setIsStreaming(false);
          setLoading(false);
          ws.close();
          
          // Clear current message states after saving to prevent duplicate rendering
          setTimeout(() => {
            setCurrentQuestion("");
            setCurrentAnalysis("");
            setFinalAnswer("");
            setToolCalls([]);
            setResponse(null);
            setThinkingText("");
            currentMessageIdRef.current = null;
          }, 100);
          
          // Scroll to bottom only after response is complete and DOM is fully updated
          // Use longer delay to avoid jittery behavior
          setTimeout(() => {
            if (bottomRef.current) {
              bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          }, 300);
          
          toast({
            title: "Analysis Complete",
            description: "Your safety analysis is ready!",
          });
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      const hasResponse = currentAnalysis.length > 0 || currentCode.length > 0;
      setIsStreaming(false);
      setLoading(false);
      if (!hasResponse) {
        toast({
          title: "WebSocket Error",
          description: "Connection failed. Please try again.",
          variant: "destructive",
        });
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsStreaming(false);
      setLoading(false);
      if (event.code !== 1000 && event.code !== 1001) {
        // Abnormal closure
        console.error('WebSocket closed abnormally:', event.code);
      }
    };
  };

  const stopStreaming = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startWebSocketStreaming();
  };

  const handleExampleClick = (prompt: string) => {
    setQuestion(prompt);
  };

  const handlePickQuery = async (q: string, d: 'incident' | 'hazard' | 'audit' | 'inspection' | 'all') => {
    try {
      await navigator.clipboard.writeText(q);
    } catch (err) {
      // Non-fatal
    }
    setQuestion(q);
    setDataset(d);
    setQueriesOpen(false);
    toast({ title: 'Copied', description: 'Query copied and running with the model...' });
    startWebSocketStreaming(q, d);
  };

  const clearConversation = () => {
    setConversationHistory([]);
    savedMessageIdsRef.current.clear();
    currentMessageIdRef.current = null;
    localStorage.removeItem('safety-copilot-conversation');
    toast({ title: 'Cleared', description: 'Conversation history cleared.' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <img src="/copilot-logo.png" alt="Copilot" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">Safety Copilot</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConversation}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
            <Badge variant="secondary" className="flex items-center space-x-1 text-xs">
              <Sparkles className="h-3 w-3" />
              <span>AI</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Query Input */}
        {!currentQuestion && conversationHistory.length === 0 && (
          <div className="space-y-4 mt-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-semibold">How can I help you today?</h2>
              <p className="text-muted-foreground">Ask me about your safety data</p>
                </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleExampleClick(prompt)}
                  className="h-auto py-3 px-4 text-left justify-start hover:bg-muted"
                  >
                  <span className="text-sm">{prompt}</span>
                  </Button>
                ))}
              </div>
            </div>
        )}

        {/* Conversation Thread */}
        {(currentQuestion || conversationHistory.length > 0) && (
          <div className="space-y-8">
            
            {/* Render Previous Conversation History */}
            {conversationHistory.map((msg, msgIdx) => (
              <div key={msgIdx} className="space-y-4">
                {/* Historical User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3 max-w-2xl">
                    <p className="text-sm">{msg.question}</p>
                        </div>
                      </div>

                {/* Historical Assistant Response */}
                <div className="space-y-4">
                  {/* Historical Tool Calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-2">
                      {msg.toolCalls.map((tc, idx) => {
                        const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                        const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                        const shouldAutoExpand = hasTableData || hasChartData;
                        
                        return (
                          <Collapsible key={idx} defaultOpen={shouldAutoExpand}>
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                <CollapsibleTrigger asChild>
                                  <button className="flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors w-full text-left">
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="font-semibold">{tc.tool}</span>
                                    {hasTableData && (
                                      <Badge variant="secondary" className="ml-2 text-xs">📊 Table</Badge>
                                    )}
                                    {hasChartData && (
                                      <Badge variant="secondary" className="ml-2 text-xs">📈 Chart</Badge>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                                  <div className="mt-2 space-y-3 pl-3">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Arguments</div>
                                      <div className="bg-muted rounded-lg p-3">
                                        <pre className="text-xs font-mono overflow-x-auto">
{JSON.stringify(tc.arguments, null, 2)}
                            </pre>
                          </div>
                                    </div>
                                    {tc.result && (
                                      <div className="space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Result</div>
                                        
                                        {/* Render Table if available */}
                                        {hasTableData && (
                                          <div className="overflow-x-auto rounded-lg border">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  {Object.keys(tc.result.table[0]).map((header) => (
                                                    <TableHead key={header} className="capitalize">
                                                      {header.replace(/_/g, ' ')}
                                                    </TableHead>
                                                  ))}
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {tc.result.table.slice(0, 10).map((row: any, rowIdx: number) => (
                                                  <TableRow key={rowIdx}>
                                                    {Object.values(row).map((value: any, cellIdx: number) => (
                                                      <TableCell key={cellIdx}>
                                                        {value !== null && value !== undefined 
                                                          ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                                                          : '-'}
                                                      </TableCell>
                                                    ))}
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                            {tc.result.table.length > 10 && (
                                              <div className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                                                Showing first 10 of {tc.result.table.length} rows
                                              </div>
                            )}
                          </div>
                                        )}
                                        
                                        {/* Render Chart if available */}
                                        {hasChartData && (
                                          <div className="bg-card rounded-lg p-4 border">
                                            <div className="flex items-center justify-between mb-3">
                                              <Badge variant="outline" className="text-xs">
                                                {tc.result.chart_type.toUpperCase()} Chart
                                              </Badge>
                        </div>
                                            <Plot
                                              data={(() => {
                                                const chartData = tc.result as ChartData;
                                                const primaryColor = '#667eea';
                                                
                                                if (chartData.chart_type === 'pie') {
                                                  return [{
                                                    type: 'pie' as const,
                                                    labels: chartData.labels || [],
                                                    values: chartData.values || [],
                                                    hole: 0.3,
                                                    marker: {
                                                      colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea']
                                                    }
                                                  }];
                                                } else if (chartData.chart_type === 'bar') {
                                                  return [{
                                                    type: 'bar' as const,
                                                    x: chartData.x_data || [],
                                                    y: chartData.y_data || [],
                                                    marker: { color: primaryColor },
                                                  }];
                                                } else if (chartData.chart_type === 'line') {
                                                  return [{
                                                    type: 'scatter' as const,
                                                    mode: 'lines+markers' as const,
                                                    x: chartData.x_data || [],
                                                    y: chartData.y_data || [],
                                                    line: { color: primaryColor, width: 2 },
                                                    marker: { color: primaryColor, size: 6 }
                                                  }];
                                                } else if (chartData.chart_type === 'scatter') {
                                                  return [{
                                                    type: 'scatter' as const,
                                                    mode: 'markers' as const,
                                                    x: chartData.x_data || [],
                                                    y: chartData.y_data || [],
                                                    marker: { color: primaryColor, size: 8 },
                                                  }];
                                                }
                                                return [];
                                              })()}
                                              layout={{
                                                title: {
                                                  text: tc.result.title || '',
                                                  font: { size: 16, weight: 600 }
                                                },
                                                xaxis: { 
                                                  title: tc.result.x_label || '',
                                                  gridcolor: '#e2e8f0'
                                                },
                                                yaxis: { 
                                                  title: tc.result.y_label || '',
                                                  gridcolor: '#e2e8f0'
                                                },
                                                height: 350,
                                                autosize: true,
                                                margin: { l: 60, r: 30, t: 50, b: 60 },
                                                paper_bgcolor: 'rgba(0,0,0,0)',
                                                plot_bgcolor: 'rgba(0,0,0,0)',
                                                font: { family: 'system-ui, sans-serif' }
                                              }}
                                              config={{ 
                                                responsive: true,
                                                displayModeBar: true,
                                                displaylogo: false,
                                                modeBarButtonsToRemove: ['lasso2d', 'select2d']
                                              }}
                                              style={{ width: '100%' }}
                                            />
                      </div>
                                        )}
                                        
                                        {/* Raw JSON (only if no table/chart) */}
                                        {!hasTableData && !hasChartData && (
                                          <div className="bg-muted rounded-lg p-3">
                                            <pre className="text-xs font-mono overflow-x-auto max-h-48">
{typeof tc.result === 'object' ? JSON.stringify(tc.result, null, 2) : tc.result}
                                            </pre>
              </div>
                                        )}
              </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}

                  {/* Historical Analysis */}
                  {msg.analysis && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="prose prose-base dark:prose-invert max-w-none
                          prose-p:leading-7 prose-p:my-4 prose-p:text-[15px]
                          prose-headings:font-semibold prose-headings:tracking-tight
                          prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
                          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                          prose-ul:my-4 prose-ul:space-y-2
                          prose-ol:my-4 prose-ol:space-y-2
                          prose-li:leading-7 prose-li:my-1.5 prose-li:text-[15px]
                          prose-strong:font-semibold prose-strong:text-foreground
                          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-muted prose-pre:border
                          prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                          first:prose-p:mt-0
                          last:prose-p:mb-0">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-2 my-4">{children}</ul>,
                              ol: ({ children }) => <ol className="space-y-2 my-4">{children}</ol>,
                              li: ({ children }) => <li className="leading-7">{children}</li>,
                              h1: ({ children }) => <h1 className="text-xl font-semibold mt-6 mb-4 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              code: ({ inline, children }: any) => 
                                inline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                ) : (
                                  <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto">{children}</code>
                                )
                            }}
                          >
                            {msg.analysis}
                          </ReactMarkdown>
              </div>
                </div>
              </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Current User Question */}
            {currentQuestion && (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl px-5 py-3 max-w-2xl">
                  <p className="text-sm">{currentQuestion}</p>
                </div>
              </div>
            )}

            {/* Current Assistant Response Container */}
            {(isStreaming || response || currentAnalysis || finalAnswer || toolCalls.length > 0 || thinkingText) && (
              <div className="space-y-4">
                {/* Thinking Stream (Collapsible) - Only show if there's actual reasoning content */}
                {thinkingText && thinkingText.trim().length > 0 && (
                  <Collapsible defaultOpen={false}>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors w-full text-left">
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-semibold">Thinking Process</span>
                            <Badge variant="secondary" className="ml-2 text-xs">Internal Reasoning</Badge>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 pl-3">
                            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
                              {thinkingText}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </Collapsible>
                )}

                {/* Tool Calls */}
        {toolCalls.length > 0 && (
                  <div className="space-y-2">
                    {toolCalls.map((tc, idx) => {
                      // Check if result has table or chart data
                      const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                      const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                      // Auto-expand if has visual data
                      const shouldAutoExpand = hasTableData || hasChartData;
                      
                      return (
                      <Collapsible key={idx} defaultOpen={shouldAutoExpand}>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors w-full text-left">
                                <ChevronRight className="h-4 w-4" />
                                <span className="font-semibold">{tc.tool}</span>
                                {hasTableData && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    📊 Table
                                  </Badge>
                                )}
                                {hasChartData && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    📈 Chart
                                  </Badge>
                                )}
                                {!tc.result && (
                                  <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                              <div className="mt-2 space-y-3 pl-3">
                      <div>
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Arguments</div>
                                  <div className="bg-muted rounded-lg p-3">
                                    <pre className="text-xs font-mono overflow-x-auto">
{JSON.stringify(tc.arguments, null, 2)}
                        </pre>
                      </div>
                                </div>
                                {tc.result && (
                          <div className="space-y-3">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">Result</div>
                            
                            {/* Render Table if available */}
                            {hasTableData && (
                              <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(tc.result.table[0]).map((header) => (
                                        <TableHead key={header} className="capitalize">
                                          {header.replace(/_/g, ' ')}
                                        </TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {tc.result.table.slice(0, 10).map((row: any, rowIdx: number) => (
                                      <TableRow key={rowIdx}>
                                        {Object.values(row).map((value: any, cellIdx: number) => (
                                          <TableCell key={cellIdx}>
                                            {value !== null && value !== undefined 
                                              ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                                              : '-'}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {tc.result.table.length > 10 && (
                                  <div className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                                    Showing first 10 of {tc.result.table.length} rows
                      </div>
                    )}
                      </div>
                    )}
                    
                            {/* Render Chart if available */}
                            {hasChartData && (
                              <div className="bg-card rounded-lg p-4 border">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant="outline" className="text-xs">
                                    {tc.result.chart_type.toUpperCase()} Chart
                                  </Badge>
                                </div>
                                <Plot
                                  data={(() => {
                                    const chartData = tc.result as ChartData;
                                    const primaryColor = '#667eea'; // Default primary color
                                    
                                    if (chartData.chart_type === 'pie') {
                                      return [{
                                        type: 'pie' as const,
                                        labels: chartData.labels || [],
                                        values: chartData.values || [],
                                        hole: 0.3,
                                        marker: {
                                          colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#a8edea']
                                        }
                                      }];
                                    } else if (chartData.chart_type === 'bar') {
                                      return [{
                                        type: 'bar' as const,
                                        x: chartData.x_data || [],
                                        y: chartData.y_data || [],
                                        marker: { color: primaryColor },
                                      }];
                                    } else if (chartData.chart_type === 'line') {
                                      return [{
                                        type: 'scatter' as const,
                                        mode: 'lines+markers' as const,
                                        x: chartData.x_data || [],
                                        y: chartData.y_data || [],
                                        line: { color: primaryColor, width: 2 },
                                        marker: { color: primaryColor, size: 6 }
                                      }];
                                    } else if (chartData.chart_type === 'scatter') {
                                      return [{
                                        type: 'scatter' as const,
                                        mode: 'markers' as const,
                                        x: chartData.x_data || [],
                                        y: chartData.y_data || [],
                                        marker: { color: primaryColor, size: 8 },
                                      }];
                                    }
                                    return [];
                                  })()}
                                  layout={{
                                    title: {
                                      text: tc.result.title || '',
                                      font: { size: 16, weight: 600 }
                                    },
                                    xaxis: { 
                                      title: tc.result.x_label || '',
                                      gridcolor: '#e2e8f0'
                                    },
                                    yaxis: { 
                                      title: tc.result.y_label || '',
                                      gridcolor: '#e2e8f0'
                                    },
                                    height: 350,
                                    autosize: true,
                                    margin: { l: 60, r: 30, t: 50, b: 60 },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    font: { family: 'system-ui, sans-serif' }
                                  }}
                                  config={{ 
                                    responsive: true,
                                    displayModeBar: true,
                                    displaylogo: false,
                                    modeBarButtonsToRemove: ['lasso2d', 'select2d']
                                  }}
                                  style={{ width: '100%' }}
                                />
                              </div>
                            )}
                            
                            {/* Raw JSON (collapsed by default if we have table/chart) */}
                            {!hasTableData && !hasChartData && (
                                    <div className="bg-muted rounded-lg p-3">
                                      <pre className="text-xs font-mono overflow-x-auto max-h-48">
{typeof tc.result === 'object' ? JSON.stringify(tc.result, null, 2) : tc.result}
                              </pre>
                                    </div>
                    )}
                  </div>
                            )}
                </div>
                            </CollapsibleContent>
                        </div>
                      </div>
                      </Collapsible>
                      );
                    })}
                  </div>
                )}

                {/* Main Response - Always show during streaming or when we have content */}
                {(isStreaming || currentAnalysis || finalAnswer || response?.analysis) && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      {isStreaming && !currentAnalysis && !finalAnswer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                </div>
                    <div className="flex-1">
                      {currentAnalysis || finalAnswer || response?.analysis ? (
                        <div className="prose prose-base dark:prose-invert max-w-none
                          prose-p:leading-7 prose-p:my-4 prose-p:text-[15px]
                          prose-headings:font-semibold prose-headings:tracking-tight
                          prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
                          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                          prose-ul:my-4 prose-ul:space-y-2
                          prose-ol:my-4 prose-ol:space-y-2
                          prose-li:leading-7 prose-li:my-1.5 prose-li:text-[15px]
                          prose-strong:font-semibold prose-strong:text-foreground
                          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                          prose-pre:bg-muted prose-pre:border
                          prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                          first:prose-p:mt-0
                          last:prose-p:mb-0">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-2 my-4">{children}</ul>,
                              ol: ({ children }) => <ol className="space-y-2 my-4">{children}</ol>,
                              li: ({ children }) => <li className="leading-7">{children}</li>,
                              h1: ({ children }) => <h1 className="text-xl font-semibold mt-6 mb-4 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0">{children}</h3>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              code: ({ inline, children }: any) => 
                                inline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                ) : (
                                  <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto">{children}</code>
                                )
                            }}
                          >
                            {currentAnalysis || finalAnswer || response?.analysis || ""}
                          </ReactMarkdown>
                          {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground pt-1">
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
            )}
                </div>
              )}


        {/* Data Visualization */}
        {response && (response.figure || response.mpl_png_base64) && (
          <div className="border rounded-lg p-4 bg-card">
            {response.figure && (
              <Plot
                data={response.figure.data}
                layout={{ ...response.figure.layout, autosize: true, height: 400 }}
                config={{ responsive: true }}
                style={{ width: "100%" }}
              />
            )}
            {!response.figure && response.mpl_png_base64 && (
              <img
                src={`data:image/png;base64,${response.mpl_png_base64}`}
                alt="Analysis Chart"
                className="max-w-full h-auto rounded-lg"
              />
            )}
                      </div>
                    )}
                    
        {/* Data Table */}
        {response && response.result_preview && response.result_preview.length > 0 && (
          <Collapsible>
            <div className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors bg-card">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ChevronDown className="h-4 w-4" />
                    View Data Table
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {response.result_preview.length} rows
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-card border-t">
                  {(() => {
                    // Check if result_preview has valid data
                    const firstRow = response.result_preview[0];
                    
                    // Skip if first row is {"result": null}
                    if (firstRow && Object.keys(firstRow).length === 1 && firstRow.result === null) {
                      return (
                        <div className="text-sm text-muted-foreground py-4">
                          No data preview available. Check the analysis above for insights.
                        </div>
                      );
                    }

                    const keys = Object.keys(firstRow);
                    const isNested = keys.length === 1 && typeof firstRow[keys[0]] === 'object' && firstRow[keys[0]] !== null;

                    return (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {isNested ? (
                                // Nested structure headers
                                Object.keys(firstRow[keys[0]]).map((key) => (
                                  <TableHead key={key} className="capitalize">
                                    {key.replace(/_/g, " ")}
                                  </TableHead>
                                ))
                              ) : (
                                // Flat structure headers
                                keys.map((key) => (
                                  <TableHead key={key} className="capitalize">
                                    {key.replace(/_/g, " ")}
                                  </TableHead>
                                ))
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {response.result_preview.slice(0, 10).map((row, index) => {
                              const rowKeys = Object.keys(row);
                              const rowIsNested = rowKeys.length === 1 && typeof row[rowKeys[0]] === 'object' && row[rowKeys[0]] !== null;
                              
                              if (rowIsNested) {
                                // Display nested object as key-value pairs
                                const nestedObj = row[rowKeys[0]];
                                return Object.entries(nestedObj).map(([key, value], idx) => (
                                  <TableRow key={`${index}-${idx}`}>
                                    <TableCell className="font-medium">{key}</TableCell>
                                    <TableCell>{typeof value === 'number' ? value.toLocaleString() : String(value)}</TableCell>
                                  </TableRow>
                                ));
                              } else {
                                // Display flat structure
                                return (
                                  <TableRow key={index}>
                                    {Object.entries(row).map(([key, value], cellIndex) => (
                                      <TableCell key={cellIndex}>
                                        {value === null ? (
                                          <span className="text-muted-foreground italic">null</span>
                                        ) : typeof value === 'number' ? (
                                          value.toLocaleString()
                                        ) : typeof value === 'object' ? (
                                          JSON.stringify(value)
                                        ) : (
                                          String(value)
                                        )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                );
                              }
                            })}
                          </TableBody>
                        </Table>
                        {response.result_preview.length > 10 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Showing first 10 of {response.result_preview.length} results
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* Generated Code */}
        {response && response.code && (
          <Collapsible>
            <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger asChild>
                <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors bg-card">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <ChevronDown className="h-4 w-4" />
                    <Code className="h-4 w-4" />
                    View Generated Code
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(response.code);
                      toast({
                        title: "Code Copied",
                        description: "Python code copied to clipboard",
                      });
                    }}
                  >
                    Copy
                      </Button>
                </button>
                    </CollapsibleTrigger>
                  <CollapsibleContent>
                <div className="p-4 bg-card border-t">
                  <SyntaxHighlighter
                    language="python"
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      padding: '1rem',
                    }}
                    showLineNumbers={false}
                  >
                    {response.code}
                  </SyntaxHighlighter>
                      </div>
                  </CollapsibleContent>
          </div>
          </Collapsible>
        )}

        {/* Bottom padding for fixed input */}
        <div className="h-32"></div>
        
        {/* Scroll anchor - invisible element at the bottom */}
        <div ref={bottomRef} className="h-1" />
      </main>

      {/* Fixed Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <Dialog open={queriesOpen} onOpenChange={setQueriesOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="whitespace-nowrap">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Queries Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden max-h-[85vh]">
                <DialogHeader className="px-6 pt-6 pb-4">
                  <DialogTitle>Queries Book</DialogTitle>
                  <DialogDescription>
                    Choose a ready-made question. It will copy to your clipboard and run with the appropriate dataset.
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 pb-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                  <div className="space-y-8">
                    {QUERIES_BOOK.map((group, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold">{group.title}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">{group.dataset}</Badge>
                        </div>
              <div className="space-y-2">
                          {group.items.map((q, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 border rounded-lg bg-card/50 px-3 py-2">
                              <div className="text-sm text-foreground/90 leading-6">{q}</div>
                              <div className="shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => handlePickQuery(q, group.dataset)}>
                                  <Copy className="h-4 w-4 mr-1.5" />
                                  Copy & Run
                                </Button>
                              </div>
                  </div>
                ))}
              </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Select value={dataset} onValueChange={(value: any) => setDataset(value)}>
              <SelectTrigger className="w-40">
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
            
            <div className="flex-1 relative">
              <Input
                placeholder="Ask about your safety data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="pr-12 h-12 rounded-full"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button 
                  type="button" 
                  onClick={stopStreaming} 
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 rounded-full h-10 w-10"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={!question.trim()}
                  size="icon"
                  className="absolute right-1 top-1 rounded-full h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
                  </div>
          </form>
              </div>
      </div>
    </div>
  );
}
