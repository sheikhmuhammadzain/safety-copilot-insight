import { useState, useRef, useEffect, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, X, Maximize2, Minimize2, BarChart3, ChevronRight, Loader2, Sparkles, StopCircle, Copy, ThumbsUp, ThumbsDown, Share2, RefreshCw, MoreHorizontal, Check, ArrowUp } from "lucide-react";
import Plot from "react-plotly.js";
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

interface StreamEvent {
  type: 'progress' | 'code_chunk' | 'code_generated' | 'analysis_chunk' | 'error' | 'verification' | 'complete' | 'thinking' | 'thinking_token' | 'reasoning_token' | 'reflection' | 'data_ready' | 'chain_of_thought' | 'reflection_chunk' | 'reasoning' | 'tool_call' | 'tool_result' | 'answer' | 'answer_token' | 'answer_complete' | 'final_answer' | 'final' | 'final_answer_complete' | 'start' | 'stream_end';
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
}

interface ConversationMessage {
  id: string;
  question: string;
  dataset: string;
  toolCalls: ToolCall[];
  analysis: string;
  response: AgentResponse | null;
  timestamp: number;
}

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [dataset, setDataset] = useState("all");
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const { toast } = useToast();
  
  // Streaming states
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCode, setCurrentCode] = useState("");
  const [currentAnalysis, setCurrentAnalysis] = useState("");
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [finalAnswer, setFinalAnswer] = useState("");
  const [thinkingText, setThinkingText] = useState("");
  const [reasoningText, setReasoningText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  
  // Action button states
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const [currentDataset, setCurrentDataset] = useState<string>(dataset);
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [debouncedAnalysis, setDebouncedAnalysis] = useState("");
  const websocketRef = useRef<WebSocket | null>(null);
  const deferredAnalysis = useDeferredValue(debouncedAnalysis);
  
  const currentMessageIdRef = useRef<string | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const isAnswerModeRef = useRef<boolean>(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const receivedAnswerTokensRef = useRef<boolean>(false);

  // Debounce markdown rendering during streaming to allow complete tokens
  useEffect(() => {
    const content = currentAnalysis || finalAnswer;
    
    if (!isStreaming) {
      // When not streaming, render immediately
      setDebouncedAnalysis(content);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    } else {
      // During streaming, debounce to allow complete markdown tokens
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedAnalysis(content);
      }, 32); // tighter debounce for smoother, natural token flow
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentAnalysis, finalAnswer, isStreaming]);

  // Debug: Log when conversation history changes
  useEffect(() => {
    console.log('📚 Conversation History Updated:');
    console.log('📚 Total messages:', conversationHistory.length);
    console.log('📚 Message IDs:', conversationHistory.map(m => m.id));
    console.log('📚 Questions:', conversationHistory.map(m => m.question.substring(0, 50)));
  }, [conversationHistory]);

  // Helper function to save message
  const saveMessageToHistory = (
    msgId: string,
    msgQuestion: string,
    msgDataset: string,
    msgToolCalls: ToolCall[],
    msgAnalysis: string,
    msgResponse: AgentResponse | null
  ) => {
    console.log('🔵 saveMessageToHistory called with:', {
      msgId,
      msgQuestion,
      msgDataset,
      toolCallsCount: msgToolCalls.length,
      analysisLength: msgAnalysis?.length || 0,
      hasResponse: !!msgResponse
    });
    
    // Check if already saved
    if (savedMessageIdsRef.current.has(msgId)) {
      console.log('🔴 Message already saved in ref, skipping:', msgId);
      return;
    }
    
    console.log('🟢 Saving message:', msgId, msgQuestion);
    
    // Mark as saved
    savedMessageIdsRef.current.add(msgId);
    console.log('🟡 Marked as saved in ref. Total saved IDs:', savedMessageIdsRef.current.size);
    
    setConversationHistory(prev => {
      console.log('🔵 Current history length:', prev.length);
      console.log('🔵 Current history IDs:', prev.map(m => m.id));
      
      // Double-check not in history
      if (prev.some(msg => msg.id === msgId)) {
        console.log('🔴 Message already in history array, returning prev');
        return prev;
      }
      
      const newHistory = [
        ...prev,
        {
          id: msgId,
          question: msgQuestion,
          dataset: msgDataset,
          toolCalls: msgToolCalls.slice(),
          analysis: msgAnalysis,
          response: msgResponse,
          timestamp: Date.now(),
        },
      ];
      
      console.log('🟢 New history length:', newHistory.length);
      console.log('🟢 New history IDs:', newHistory.map(m => m.id));
      
      return newHistory;
    });
  };

  const startWebSocketStreaming = () => {
    const q = question.trim();
    if (!q) return;

    console.log('🚀 ========== STARTING NEW MESSAGE ==========');
    console.log('🚀 Question:', q);
    console.log('🚀 Current message ID before clear:', currentMessageIdRef.current);
    console.log('🚀 Saved IDs before clear:', Array.from(savedMessageIdsRef.current));

    // Close existing WebSocket if any
    if (websocketRef.current) {
      console.log('🔴 Closing existing WebSocket');
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Clear all previous message data FIRST (before generating new ID)
    console.log('🧹 Clearing all previous message states...');
    setCurrentQuestion("");
    setResponse(null);
    setCurrentAnalysis("");
    setFinalAnswer("");
    setDebouncedAnalysis("");
    setToolCalls([]);
    setThinkingText("");
    setReasoningText("");
    setCurrentCode("");
    isAnswerModeRef.current = false;
    
    // Generate NEW message ID AFTER clearing old data
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentMessageIdRef.current = messageId;
    
    console.log('🆕 Generated NEW message ID:', messageId);
    console.log('🆕 Current message ID ref set to:', currentMessageIdRef.current);
    
    // Set new question and dataset
    setCurrentQuestion(q);
    setCurrentDataset(dataset);
    setQuestion("");
    
    console.log('✅ Message setup complete. Starting WebSocket...');
    setIsStreaming(true);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    const WS_BASE = API_BASE.replace('http', 'ws');
    const params = new URLSearchParams({
      question: q,
      dataset: dataset,
      model: "z-ai/glm-4.6"
    });

    const ws = new WebSocket(`${WS_BASE}/ws/agent/stream?${params}`);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        
        if (data.type === 'reasoning_token' && data.token) {
          // Backend sends reasoning_token for the model's thought process
          setReasoningText(prev => prev + data.token!);
          return;
        }
        
        // Ignore generic thinking tokens to avoid duplicates (reasoning_token already handled)
        if (data.type === 'thinking_token' && data.token) {
          return;
        }
        
        if (data.type === 'answer_token' && data.token) {
          receivedAnswerTokensRef.current = true;
          setCurrentAnalysis(prev => (prev || "") + data.token!);
          setFinalAnswer(prev => (prev || "") + data.token!);
          return;
        }

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

        if (data.type === 'data_ready' && data.data) {
          setResponse(data.data);
        }

        if ((data.type === 'answer' || data.type === 'final_answer' || data.type === 'final') && data.content) {
          if (receivedAnswerTokensRef.current) {
            setFinalAnswer(prev => (prev || "") + data.content);
            setCurrentAnalysis(prev => (prev || "") + data.content);
          } else {
            setFinalAnswer(prev => (prev || "") + data.content);
            setCurrentAnalysis(prev => (prev || "") + data.content);
          }
        }

        if ((data.type === 'answer_complete' || data.type === 'final_answer_complete') && data.content) {
          const combined = (finalAnswer || "");
          const preferred = data.content && data.content.length > combined.length ? data.content : combined;
          setFinalAnswer(preferred);
          setCurrentAnalysis(preferred);
          setThinkingText("");
          setReasoningText("");
        }

        if (data.type === 'complete' || data.type === 'stream_end') {
          console.log('🏁 ========== STREAM COMPLETE/END ==========');
          console.log('🏁 Message ID from ref:', currentMessageIdRef.current);
          
          if (data.data) {
            setResponse(data.data);
            if (data.data.analysis && !currentAnalysis) {
              setCurrentAnalysis(data.data.analysis);
            }
          }
          
          // Save to history using state callbacks to capture latest values
          const messageId = currentMessageIdRef.current;
          console.log('🏁 Attempting to save message ID:', messageId);
          
          if (messageId) {
            console.log('🔄 Using state callbacks to capture latest values...');
            setToolCalls(latestToolCalls => {
              console.log('  📊 Tool calls count:', latestToolCalls.length);
              setCurrentAnalysis(latestAnalysis => {
                console.log('  📝 Analysis length:', latestAnalysis?.length || 0);
                setFinalAnswer(latestFinalAnswer => {
                  console.log('  ✍️ Final answer length:', latestFinalAnswer?.length || 0);
                  setResponse(latestResponse => {
                    console.log('  📦 Has response:', !!latestResponse);
                    setCurrentQuestion(latestQuestion => {
                      console.log('  ❓ Question:', latestQuestion);
                      setCurrentDataset(latestDataset => {
                        console.log('  📁 Dataset:', latestDataset);
                        
                        // Only save if we have a question (not empty from a new message starting)
                        if (latestQuestion && latestQuestion.trim()) {
                          console.log('✅ Question exists, proceeding to save...');
                          saveMessageToHistory(
                            messageId,
                            latestQuestion,
                            latestDataset,
                            latestToolCalls,
                            latestAnalysis || latestFinalAnswer || data.data?.analysis || "",
                            latestResponse || data.data || null
                          );
                        } else {
                          console.log('⚠️ NO QUESTION - Skipping save (likely cleared by new message)');
                        }
                        return latestDataset;
                      });
                      return latestQuestion;
                    });
                    return latestResponse;
                  });
                  return latestFinalAnswer;
                });
                return latestAnalysis;
              });
              return latestToolCalls;
            });
          } else {
            console.log('⚠️ NO MESSAGE ID - Cannot save');
          }
          
          console.log('🏁 Setting isStreaming to false and closing WebSocket');
          setIsStreaming(false);
          ws.close();
          
          // Clear current message states after saving to prevent duplicate rendering
          console.log('🧹 Clearing current message states to prevent duplicate render...');
          setTimeout(() => {
            setCurrentQuestion("");
            setCurrentAnalysis("");
            setFinalAnswer("");
            setDebouncedAnalysis("");
            setToolCalls([]);
            setResponse(null);
            setThinkingText("");
            setReasoningText("");
            currentMessageIdRef.current = null;
            isAnswerModeRef.current = false;
            console.log('✅ Current message states cleared');
          }, 100);
          
          // Do not auto-scroll; keep natural chat position
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsStreaming(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect. Please try again.",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      setIsStreaming(false);
    };
  };

  const stopStreaming = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
      setIsStreaming(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startWebSocketStreaming();
  };

  const clearConversation = () => {
    setConversationHistory([]);
    savedMessageIdsRef.current.clear();
    currentMessageIdRef.current = null;
  };

  // Chat bubble size classes
  const chatSize = isExpanded 
    ? "w-[95vw] h-[90vh] max-w-6xl" 
    : "w-[450px] h-[600px]";

  return (
    <>
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 md:bottom-6 md:right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Safety Copilot"
            className="group inline-flex relative transition-all duration-300 hover:scale-105"
          >
            {/* Animated glow layers */}
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 animate-pulse" />
            
            <img 
              src="/copilot-logo.png" 
              alt="Copilot" 
              className="relative h-[90px] w-[90px] object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(132,204,22,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(132,204,22,0.9)]" 
            />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 ${chatSize} bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col transition-all duration-300 z-50 border border-gray-100`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/copilot-logo.png" 
                  alt="Copilot" 
                  className="h-10 w-10 object-contain" 
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-base text-gray-900">Safety Copilot</h3>
          
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-9 w-9 text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {conversationHistory.length === 0 && !currentQuestion && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <img 
                    src="/copilot-logo.png" 
                    alt="Copilot" 
                    className="h-24 w-24 object-contain" 
                  />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">How can I help you?</h4>
                <p className="text-sm text-gray-500">Ask me anything about your safety data</p>
              </div>
            )}

            {/* Historical Messages */}
            {conversationHistory.map((msg, idx) => (
              <div key={idx} className="space-y-3">
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-primary to-lime-600 text-white rounded-2xl rounded-tr-md px-5 py-3 max-w-[85%] shadow-sm">
                    <p className="text-sm font-medium leading-relaxed">{msg.question}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="space-y-2">
                  {/* Thinking & Planning (historical) - hide tool calls inside */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <Collapsible>
                      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2.5 text-xs hover:bg-gray-50 px-3 py-2 rounded-lg w-full text-left transition-all">
                            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <AITextLoading compact staticText="Click to view chain of thought" className="font-semibold text-gray-800 flex-1" />
                            <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-0">Tools: {msg.toolCalls.length}</Badge>
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-3 space-y-1.5">
                            {msg.toolCalls.map((tc, tcIdx) => {
                        const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                        const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                        const isWebSearch = tc.tool === 'search_web' && tc.result && typeof tc.result === 'object' && tc.result.results && Array.isArray(tc.result.results) && tc.result.results.length > 0;
                        
                        return (
                          <Collapsible key={tcIdx} defaultOpen={hasTableData || hasChartData}>
                            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center gap-2.5 text-xs hover:bg-gray-50 px-3 py-2 rounded-lg w-full text-left transition-all">
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                  </div>
                                  <span className="font-semibold text-gray-800 flex-1">{tc.tool}</span>
                                  {hasTableData && <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-0">Table</Badge>}
                                  {hasChartData && <Badge variant="secondary" className="text-[10px] h-5 bg-purple-50 text-purple-700 border-0">Chart</Badge>}
                                  {isWebSearch && <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-0">🔍 {tc.result.results.length} sources</Badge>}
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-3 space-y-2">
                                  {/* Render Web Search Results */}
                                  {isWebSearch && (
                                    <div className="space-y-2">
                                      {tc.result.results.map((source: any, idx: number) => (
                                        (() => {
                                          const href: string = String(source.link || "");
                                          let host = String(source.source || "");
                                          let path = "";
                                          try {
                                            const u = new URL(href);
                                            host = u.hostname.replace(/^www\./, '') || host;
                                            path = u.pathname || "";
                                          } catch {}
                                          const pathShort = path.length > 60 ? path.slice(0, 60) + '…' : path;
                                          const favicon = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : '';
                                          return (
                                            <div key={idx} className="border rounded-xl p-3 bg-white hover:shadow-md transition-shadow">
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                    {favicon && (
                                                      <img src={favicon} alt={host} className="w-4 h-4 rounded-full border" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                                                    )}
                                                    <span className="font-medium truncate max-w-[40%]">{host || 'source'}</span>
                                                    {pathShort && <span className="truncate">{pathShort}</span>}
                                                  </div>
                                                  <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-sky-700 hover:underline mt-1">
                                                    {source.title}
                                                  </a>
                                                  {source.snippet && (
                                                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{source.snippet}</p>
                                                  )}
                                                </div>
                                                {source.thumbnail && (
                                                  <img src={source.thumbnail} alt={source.title} className="w-16 h-16 rounded-md object-cover border" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })()
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Render Chart */}
                                  {hasChartData && (
                                    <div className="bg-gray-50 rounded p-3">
                                      <Plot
                                        data={(() => {
                                          const chartData = tc.result as ChartData;
                                          const primaryColor = '#10b981';
                                          
                                          if (chartData.chart_type === 'pie') {
                                            return [{
                                              type: 'pie' as const,
                                              labels: chartData.labels || [],
                                              values: chartData.values || [],
                                              hole: 0.3,
                                              marker: {
                                                colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']
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
                                          }
                                          return [];
                                        })()}
                                        layout={{
                                          title: { text: tc.result.title || '', font: { size: 14 } },
                                          height: 250,
                                          autosize: true,
                                          margin: { l: 40, r: 20, t: 40, b: 40 },
                                          paper_bgcolor: 'rgba(0,0,0,0)',
                                          plot_bgcolor: 'rgba(0,0,0,0)',
                                        }}
                                        config={{ responsive: true, displayModeBar: false }}
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Render Table */}
                                  {hasTableData && (
                                    <div className="overflow-x-auto rounded border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            {Object.keys(tc.result.table[0]).map((header) => (
                                              <TableHead key={header} className="text-xs bg-green-50">
                                                {header.replace(/_/g, ' ')}
                                              </TableHead>
                                            ))}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {tc.result.table.slice(0, 5).map((row: any, rowIdx: number) => (
                                            <TableRow key={rowIdx}>
                                              {Object.values(row).map((value: any, cellIdx: number) => (
                                                <TableCell key={cellIdx} className="text-xs">
                                                  {value !== null && value !== undefined 
                                                    ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                                                    : '-'}
                                                </TableCell>
                                              ))}
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                      {tc.result.table.length > 5 && (
                                        <div className="text-xs text-gray-500 p-2 bg-gray-50 text-center">
                                          Showing 5 of {tc.result.table.length} rows
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}

                  {/* Analysis */}
                  {msg.analysis && (
                    <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 max-w-[90%] border border-gray-100 shadow-sm">
                      <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-li:text-gray-700 prose-li:my-1">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="text-gray-700 leading-relaxed" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-900 mb-2 mt-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2" {...props} />,
                            table: ({node, children, ...props}) => (
                              <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200" {...props}>
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-primary/10 to-lime-600/10" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
                            th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
                            td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-900" {...props} />,
                            a: ({node, ...props}: any) => (
                              <a 
                                {...props} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              />
                            ),
                            img: ({node, ...props}: any) => {
                              const src: string = String(props.src || "");
                              const alt: string = String(props.alt || "");
                              
                              // Hide placeholder images
                              if (!src || src === 'chart_placeholder' || src.includes('placeholder')) {
                                return null;
                              }
                              
                              let normalized = src;
                              try {
                                if (src.includes('quickchart.io/chart')) {
                                  const u = new URL(src);
                                  const c = u.searchParams.get('c');
                                  if (c) {
                                    u.searchParams.set('c', c);
                                    normalized = u.toString();
                                  }
                                }
                              } catch {}
                              
                              return (
                                <img 
                                  {...props} 
                                  src={normalized} 
                                  alt={alt}
                                  className="rounded-md border max-w-full h-auto my-4"
                                  onError={(e) => {
                                    // Hide broken images
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              );
                            },
                          }}
                        >
                          {msg.analysis}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Example Queries - Show only when no conversation */}
            {showExamples && conversationHistory.length === 0 && !currentQuestion && !isStreaming && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 font-medium">Try asking:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Show the top 5 incidents with titles",
                    "What are the most common hazard types?",
                    "Create a chart of incidents by department",
                    "Find all audits completed in 2023",
                    "Show incidents with high risk scores",
                    "What is the average resolution time?"
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setQuestion(example);
                        setShowExamples(false);
                      }}
                      className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm text-gray-700 hover:text-primary"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Question */}
            {currentQuestion && (
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-primary to-lime-600 text-white rounded-2xl rounded-tr-md px-5 py-3 max-w-[85%] shadow-sm">
                  <p className="text-sm font-medium leading-relaxed">{currentQuestion}</p>
                </div>
              </div>
            )}

            {/* Thinking Loader */}
            {isStreaming && !currentAnalysis && !finalAnswer && toolCalls.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3 border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-600 font-medium">Thinking...</p>
                </div>
              </div>
            )}

            {/* Current Response */}
            {(isStreaming || currentAnalysis || toolCalls.length > 0) && (
              <div className="space-y-2">
                {/* Thinking & Planning (live) */}
                {(thinkingText?.trim().length > 0 || toolCalls.length > 0) && (
                  <Collapsible>
                    <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 text-xs hover:bg-gray-50 px-2 py-1.5 rounded w-full text-left transition-colors">
                          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {isStreaming ? (
                            <AITextLoading compact texts={["Thinking & Planning", "Reasoning & Tools", "Planning Steps"]} className="font-medium text-gray-700 flex-1" />
                          ) : (
                            <AITextLoading compact staticText="Click to view chain of thought" className="font-medium text-gray-700 flex-1" />
                          )}
                          {toolCalls.length > 0 && <Badge variant="outline" className="text-[10px] h-5">Tools: {toolCalls.length}</Badge>}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-3 space-y-2">
                          {toolCalls.length > 0 && (
                            <div className="space-y-1.5">
                              {toolCalls.map((tc, idx) => {
                      const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                      const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                      const hasSummary = tc.result && typeof tc.result === 'object' && (tc.result.summary || tc.result.description);
                      const isWebSearch = tc.tool === 'search_web' && tc.result && typeof tc.result === 'object' && tc.result.results && Array.isArray(tc.result.results) && tc.result.results.length > 0;
                      
                      return (
                        <Collapsible key={idx} defaultOpen={hasTableData || hasChartData}>
                          <div className="bg-white rounded-lg border border-gray-200 p-2.5">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center gap-2 text-xs hover:bg-gray-50 px-2 py-1.5 rounded w-full text-left transition-colors">
                                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                                <span className="font-medium text-gray-700 flex-1">{tc.tool}</span>
                                {!tc.result && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                                {hasTableData && <Badge variant="outline" className="text-[10px] h-5">Table</Badge>}
                                {hasChartData && <Badge variant="outline" className="text-[10px] h-5">Chart</Badge>}
                                {isWebSearch && <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200">🔍 {tc.result.results.length} sources</Badge>}
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-3 space-y-2">
                                {hasChartData && (
                                  <div className="bg-gray-50 rounded p-3">
                                    <Plot
                                      data={(() => {
                                        const chartData = tc.result as ChartData;
                                        const primaryColor = '#10b981';
                                        
                                        if (chartData.chart_type === 'pie') {
                                          return [{
                                            type: 'pie' as const,
                                            labels: chartData.labels || [],
                                            values: chartData.values || [],
                                            hole: 0.3,
                                            marker: {
                                              colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']
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
                                        }
                                        return [];
                                      })()}
                                      layout={{
                                        title: { text: tc.result.title || '', font: { size: 14 } },
                                        height: 250,
                                        autosize: true,
                                        margin: { l: 40, r: 20, t: 40, b: 40 },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                      }}
                                      config={{ responsive: true, displayModeBar: false }}
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                )}
                                
                                {hasTableData && (
                                  <div className="overflow-x-auto rounded border">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          {Object.keys(tc.result.table[0]).map((header) => (
                                            <TableHead key={header} className="text-xs bg-green-50">
                                              {header.replace(/_/g, ' ')}
                                            </TableHead>
                                          ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {tc.result.table.slice(0, 5).map((row: any, rowIdx: number) => (
                                          <TableRow key={rowIdx}>
                                            {Object.values(row).map((value: any, cellIdx: number) => (
                                              <TableCell key={cellIdx} className="text-xs">
                                                {value !== null && value !== undefined 
                                                  ? (typeof value === 'number' ? value.toLocaleString() : String(value))
                                                  : '-'}
                                              </TableCell>
                                            ))}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    {tc.result.table.length > 5 && (
                                      <div className="text-xs text-gray-500 p-2 bg-gray-50 text-center">
                                        Showing 5 of {tc.result.table.length} rows
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Show Web Search Results */}
                                {isWebSearch && (
                                  <div className="space-y-2">
                                    {tc.result.results.map((source: any, idx: number) => (
                                      (() => {
                                        const href: string = String(source.link || "");
                                        let host = String(source.source || "");
                                        let path = "";
                                        try {
                                          const u = new URL(href);
                                          host = u.hostname.replace(/^www\./, '') || host;
                                          path = u.pathname || "";
                                        } catch {}
                                        const pathShort = path.length > 60 ? path.slice(0, 60) + '…' : path;
                                        const favicon = host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : '';
                                        return (
                                          <div key={idx} className="border rounded-xl p-3 bg-white hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                  {favicon && (
                                                    <img src={favicon} alt={host} className="w-4 h-4 rounded-full border" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                                                  )}
                                                  <span className="font-medium truncate max-w-[40%]">{host || 'source'}</span>
                                                  {pathShort && <span className="truncate">{pathShort}</span>}
                                                </div>
                                                <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm font-semibold text-sky-700 hover:underline mt-1">
                                                  {source.title}
                                                </a>
                                                {source.snippet && (
                                                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{source.snippet}</p>
                                                )}
                                              </div>
                                              {source.thumbnail && (
                                                <img src={source.thumbnail} alt={source.title} className="w-16 h-16 rounded-md object-cover border" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()
                                    ))}
                                  </div>
                                )}
                                
                                {/* Show summary/description if available */}
                                {!isWebSearch && hasSummary && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-xs text-blue-900 font-medium mb-1">Summary</p>
                                    <p className="text-xs text-blue-800">
                                      {tc.result.summary || tc.result.description}
                                    </p>
                                  </div>
                                )}
                                
                                {/* Show other result data (minimal format) */}
                                {!hasTableData && !hasChartData && !hasSummary && !isWebSearch && tc.result && (
                                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="space-y-2">
                                      {typeof tc.result === 'object' ? (
                                        Object.entries(tc.result).map(([key, value]) => {
                                          // Special formatting for different data types
                                          const isArray = Array.isArray(value);
                                          const isObject = typeof value === 'object' && value !== null && !isArray;
                                          
                                          return (
                                            <div key={key} className="flex items-start gap-3 py-1.5">
                                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[100px] flex-shrink-0">
                                                {key.replace(/_/g, ' ')}
                                              </span>
                                              <div className="flex-1 text-xs">
                                                {isArray ? (
                                                  <div className="flex flex-wrap gap-1">
                                                    {(value as any[]).slice(0, 8).map((item, idx) => {
                                                      // Handle objects in array
                                                      const displayValue = typeof item === 'object' 
                                                        ? JSON.stringify(item).substring(0, 30) + '...'
                                                        : String(item);
                                                      return (
                                                        <span key={idx} className="inline-block bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                                          {displayValue}
                                                        </span>
                                                      );
                                                    })}
                                                    {(value as any[]).length > 8 && (
                                                      <span className="text-gray-500 italic">+{(value as any[]).length - 8} more</span>
                                                    )}
                                                  </div>
                                                ) : isObject ? (
                                                  <div className="space-y-1 pl-2 border-l-2 border-gray-300">
                                                    {Object.entries(value as object).slice(0, 5).map(([k, v]) => (
                                                      <div key={k} className="flex gap-2">
                                                        <span className="font-medium text-gray-600">{k}:</span>
                                                        <span className="text-gray-900">{String(v)}</span>
                                                      </div>
                                                    ))}
                                                    {Object.keys(value as object).length > 5 && (
                                                      <span className="text-gray-500 italic text-[10px]">
                                                        +{Object.keys(value as object).length - 5} more fields
                                                      </span>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <span className="font-medium text-gray-900">
                                                    {String(value)}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-sm text-gray-700">{String(tc.result)}</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                            </div>
                          )}
                          {reasoningText && reasoningText.trim().length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <span className="font-medium">Reasoning</span>
                              </div>
                              <div className="rounded-md border bg-gray-50 p-2">
                                <pre className="m-0 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                                  {reasoningText}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Thinking Stream (Collapsible) - Show internal reasoning */}
                {/* Removed separate Thinking Process section; it's inside the Thinking & Planning group above */}

                {/* Analysis */}
                {(currentAnalysis || finalAnswer) && (
                  <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 max-w-[90%] border border-gray-100 shadow-sm">
                    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:list-disc prose-ul:ml-4 prose-ol:list-decimal prose-ol:ml-4 prose-li:text-gray-700 prose-li:my-1">
                      <ReactMarkdown 
                        key={`markdown-${isStreaming ? 'streaming' : 'complete'}-${(deferredAnalysis || "").length}`}
                        remarkPlugins={[remarkGfm]}
                        skipHtml={false}
                        components={{
                          p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="text-gray-700 leading-relaxed" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-gray-900 mb-2 mt-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-gray-900 mb-1 mt-2" {...props} />,
                          table: ({node, children, ...props}) => {
                            console.log('📊 Table component rendered!', { node, children, props });
                            return (
                              <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                  {children}
                                </table>
                              </div>
                            );
                          },
                          thead: ({node, ...props}) => <thead className="bg-gradient-to-r from-primary/10 to-lime-600/10" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                          tr: ({node, ...props}) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
                          th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider" {...props} />,
                          td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-gray-900" {...props} />,
                            a: ({node, ...props}: any) => (
                              <a 
                                {...props} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              />
                            ),
                            img: ({node, ...props}: any) => {
                              const src: string = String(props.src || "");
                              const alt: string = String(props.alt || "");
                              
                              // Hide placeholder images
                              if (!src || src === 'chart_placeholder' || src.includes('placeholder')) {
                                return null;
                              }
                              
                              let normalized = src;
                              try {
                                if (src.includes('quickchart.io/chart')) {
                                  const u = new URL(src);
                                  const c = u.searchParams.get('c');
                                  if (c) {
                                    // Ensure chart config is properly encoded
                                    u.searchParams.set('c', c);
                                    normalized = u.toString();
                                  }
                                }
                              } catch {}
                              
                              return (
                                <img 
                                  {...props} 
                                  src={normalized} 
                                  alt={alt}
                                  className="rounded-md border max-w-full h-auto"
                                  onError={(e) => {
                                    // Hide broken images
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              );
                            },
                        }}
                      >
                        {deferredAnalysis || ""}
                      </ReactMarkdown>
                      {isStreaming && (
                        <span className="inline-block w-2 h-4 bg-gradient-to-r from-primary to-lime-600 animate-pulse ml-1 rounded-full"></span>
                      )}
                    </div>
                    
                    {/* Action Buttons - Show only when response is complete */}
                    {!isStreaming && (currentAnalysis || finalAnswer) && (
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const textToCopy = debouncedAnalysis || currentAnalysis || finalAnswer || "";
                            navigator.clipboard.writeText(textToCopy);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 ${liked ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => {
                            setLiked(!liked);
                            if (!liked) setDisliked(false);
                          }}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-2 ${disliked ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => {
                            setDisliked(!disliked);
                            if (!disliked) setLiked(false);
                          }}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Safety Analysis',
                                text: debouncedAnalysis || currentAnalysis || finalAnswer || "",
                              });
                            }
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (currentQuestion) {
                              handleSubmit(new Event('submit') as any);
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Follow-up Questions */}
                    {!isStreaming && (currentAnalysis || finalAnswer) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-2">Follow-up questions:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Show me more details",
                            "Create a chart for this",
                            "What are the trends?",
                            "Compare with last year"
                          ].map((followUp, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setQuestion(followUp);
                                setShowExamples(false);
                              }}
                              className="px-3 py-1.5 text-xs bg-gray-50 hover:bg-primary/10 border border-gray-200 hover:border-primary rounded-full text-gray-700 hover:text-primary transition-all"
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-5 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your safety data..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1 border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary rounded-xl h-12 shadow-sm bg-white placeholder:text-gray-400"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <Button 
                    type="button" 
                    onClick={stopStreaming}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md rounded-xl h-12 w-12"
                  >
                    <StopCircle className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={!question.trim()}
                    className="bg-gradient-to-r from-primary to-lime-600 hover:from-lime-600 hover:to-primary text-white shadow-md rounded-xl h-12 w-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                   <ArrowUp className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
