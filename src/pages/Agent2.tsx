import { useState, useRef, useEffect } from "react";
import axios from "axios";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Code, BarChart3, Sparkles, ChevronDown, ChevronRight, StopCircle, Loader2, BookOpen, Copy, Trash2, ThumbsUp, ThumbsDown, Share2, RefreshCw, MoreHorizontal, Check, Upload, MoveUp, ArrowUp, Mic, MicOff } from "lucide-react";
import Plot from "react-plotly.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AITextLoading from "@/components/motion/AITextLoading";
import VoiceModal from "@/components/VoiceModal";

interface AgentResponse {
  code: string;
  stdout: string;
  error: string;
  result_preview: Array<Record<string, any>>;
  figure?: any;
  mpl_png_base64?: string | null;
  analysis: string;
  answer?: string; // Backend sometimes sends 'answer' instead of 'analysis'
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
    title: 'Incident Overview & Trends',
    dataset: 'incident',
    items: [
      'Which month/year had the highest number of incidents?',
      'Show the total number of incidents by department.',
      'What percentage of incidents are repeated?',
      'What is the most common incident type?',
      'Which location has the highest number of incidents?',
      'Show incident trends over the last 12 months with a line chart.',
      'What are the top 5 incident titles by frequency?',
    ],
  },
  {
    title: 'Incident Risk & Severity Analysis',
    dataset: 'incident',
    items: [
      'Show the top 10 incidents with the highest risk score.',
      'Find the correlation between severity score and estimated cost impact.',
      'What is the distribution of actual consequence vs worst-case consequence?',
      'Which departments have the highest average risk score?',
      'Show incidents with Tier 1 PSE category.',
      'What percentage of incidents resulted in C3 - Severe worst-case consequence?',
    ],
  },
  {
    title: 'Incident Root Cause & Corrective Actions',
    dataset: 'incident',
    items: [
      'How many incidents are missing root cause details?',
      'What are the top 5 most common root causes?',
      'How many incidents have missing corrective actions?',
      'Show the relationship between key factors and contributing factors.',
      'What percentage of incidents involve PSM compliance systems?',
      'Which management system noncompliance category appears most?',
    ],
  },
  {
    title: 'Incident Response & Timeline',
    dataset: 'incident',
    items: [
      'What is the average resolution time (in days) for incidents?',
      'Show the distribution of reporting delay days.',
      'Which incidents had the longest resolution times?',
      'What is the average time from reported date to completion date by department?',
      'How many incidents are still pending closure?',
    ],
  },
  {
    title: 'Incident Cost & Impact',
    dataset: 'incident',
    items: [
      'What is the total estimated cost impact of all incidents?',
      'Show the top 10 incidents by estimated cost impact.',
      'What is the total estimated manhours impact?',
      'Compare estimated cost impact by incident type.',
      'Which materials were most frequently involved in incidents?',
    ],
  },
  {
    title: 'Hazard Identification & Reporting',
    dataset: 'hazard',
    items: [
      'Show the trend of reported hazards by month.',
      'Which violation type occurs most frequently in hazard reports?',
      'What percentage of hazards are repeated events?',
      'Who are the top 5 reporters with the most hazard IDs?',
      'Which sections (Projects, Production, etc.) report the most hazards?',
      'Show hazard reporting by sublocation.',
    ],
  },
  {
    title: 'Hazard Risk Assessment',
    dataset: 'hazard',
    items: [
      'What is the distribution of worst-case consequence potential in hazards?',
      'Which department has the highest average risk score for hazards?',
      'Show the total and average estimated cost impact of all hazards.',
      'What are the most common relevant consequences in hazard IDs?',
      'Show hazards with C2 - Serious or higher worst-case consequences.',
    ],
  },
  {
    title: 'Hazard Actions & Closure',
    dataset: 'hazard',
    items: [
      'How many hazards are missing corrective actions?',
      'What is the average time from reported date to closure?',
      'Which hazards had the longest reporting delays?',
      'Show the status distribution of all hazard IDs.',
      'How many hazards moved from review to closed status?',
    ],
  },
  {
    title: 'Audit Overview & Performance',
    dataset: 'audit',
    items: [
      'Show the total number of audits by audit category.',
      'Plot the distribution of audit ratings.',
      'Which auditor has performed the most audits?',
      'Show the total number of audits done by each inspector.',
      'What is the breakdown of audits by auditing body (Self, 1st Party, 3rd Party)?',
      'Which audit types (Insurance, Internal, etc.) are most common?',
    ],
  },
  {
    title: 'Audit Findings & Locations',
    dataset: 'audit',
    items: [
      'Which finding location is most common in audit findings?',
      'Show the distribution of worst-case consequences (C1, C2, C3, C4) in audits.',
      'Show the top 10 most frequent audit findings.',
      'Which companies have the most audit findings?',
      'What percentage of audit findings involve C3 - Severe consequences?',
    ],
  },
  {
    title: 'Audit Timeline & Closure',
    dataset: 'audit',
    items: [
      'Calculate the average time taken to close an audit.',
      'Show the distribution of time from scheduled to closed status.',
      'Which audits have the longest pending action plans?',
      'How many audits are currently in "In Progress" status?',
      'What is the average time from review to closure?',
    ],
  },
  {
    title: 'Inspection Execution & Coverage',
    dataset: 'inspection',
    items: [
      'Show the total number of inspections per year.',
      'Which location has the highest number of inspections?',
      'Show the total number of inspections done by each inspector.',
      'What is the distribution of inspections by audit type?',
      'Which departments are most frequently inspected?',
    ],
  },
  {
    title: 'Inspection Findings & Consequences',
    dataset: 'inspection',
    items: [
      'What is the most common worst-case consequence in inspection findings?',
      'Show the distribution of violation categories in inspections.',
      'Which finding locations appear most frequently?',
      'How many inspections identified unsafe acts vs unsafe conditions?',
      'What are the most common conversation topics with workforce?',
    ],
  },
  {
    title: 'Inspection Action Items & Follow-up',
    dataset: 'inspection',
    items: [
      'Which action item priority is most common in inspections?',
      'How many action items are overdue (due date < today and status not closed)?',
      'What is the closure rate (%) of inspection action items?',
      'Show action items grouped by responsible person.',
      'How many inspections are missing action item details?',
    ],
  },
  {
    title: 'Cross-Dataset: Department Performance',
    dataset: 'all',
    items: [
      'What are the top 5 departments appearing in both Incidents and Hazards?',
      'Which departments have high incident counts but low hazard reporting?',
      'Show department risk scores across all datasets.',
      'Compare department frequency in Incidents, Hazards, Audits, and Inspections.',
    ],
  },
  {
    title: 'Cross-Dataset: Consequence & Risk',
    dataset: 'all',
    items: [
      'Compare the consequence categories (C1, C2, etc.) between Audit Findings and Incidents.',
      'In departments where hazard risk score > 2, how many incidents have occurred?',
      'What is the correlation between audit findings severity and incident severity?',
      'Show all records with C3 - Severe or C4 - Catastrophic consequences.',
    ],
  },
  {
    title: 'Cross-Dataset: Corrective Actions',
    dataset: 'all',
    items: [
      'What is the combined ratio of missing corrective actions in Hazards and Incidents?',
      'Which locations have the most missing corrective actions across all datasets?',
      'Compare corrective action completion rates between Incidents and Hazards.',
      'Show the total number of action items across Audits and Inspections.',
    ],
  },
  {
    title: 'Cross-Dataset: Location & Equipment',
    dataset: 'all',
    items: [
      'Which locations appear in both Audits and Inspections most frequently?',
      'Show locations with the highest combined risk from Incidents and Hazards.',
      'Which equipment or materials appear most frequently across incidents?',
      'Compare location distribution across all four datasets.',
    ],
  },
  {
    title: 'Cross-Dataset: PSM & Compliance',
    dataset: 'all',
    items: [
      'How many total compliance system violations exist across all datasets?',
      'Show PSM category breakdown for incidents.',
      'Which management systems have the most noncompliance entries?',
      'Compare regulatory compliance across Audits and Inspections.',
    ],
  },
  {
    title: 'Cross-Dataset: Personnel & Accountability',
    dataset: 'all',
    items: [
      'Who are the most frequent reporters across Incidents and Hazards?',
      'Show auditors/inspectors with the highest number of findings.',
      'Which responsible persons appear most frequently in action items?',
      'Compare personnel involved in incidents vs hazards.',
    ],
  },
  {
    title: '📊 Chart & Visualization Queries',
    dataset: 'all',
    items: [
      'Create a bar chart showing incidents by month for 2023.',
      'Plot a line chart of incident trends over time.',
      'Show a pie chart of incident types distribution.',
      'Create a bar chart comparing risk scores across departments.',
      'Generate a scatter plot of severity score vs estimated cost impact.',
      'Show a stacked bar chart of consequence categories by department.',
      'Create a time series chart of hazard reporting trends.',
      'Plot a histogram of resolution time distribution for incidents.',
      'Show a dual-axis chart comparing incident count and average risk score by month.',
      'Create a heatmap showing incidents by department and month.',
    ],
  },
  {
    title: '📅 Date Range & Time-Based Analysis',
    dataset: 'all',
    items: [
      'Show all incidents reported in Q1 2023 (January to March).',
      'Compare incident counts between 2022 and 2023.',
      'Find incidents with occurrence dates in the last 90 days.',
      'Show hazards reported in the last 6 months.',
      'What were the top 5 incidents in 2022 by cost impact?',
      'Show audits completed between January 2023 and June 2023.',
      'Find all overdue action items (due date before today).',
      'Compare monthly incident rates: 2022 vs 2023.',
      'Show incidents with resolution time greater than 30 days.',
      'Find all inspections conducted in the last quarter.',
      'Show year-over-year growth in hazard reporting.',
      'Analyze seasonal patterns in incident occurrence (by quarter).',
    ],
  },
  {
    title: '🔍 Research & Best Practices (Web Search)',
    dataset: 'all',
    items: [
      'What are OSHA requirements for incident reporting and investigation?',
      'Search for best practices in Process Safety Management (PSM).',
      'Find the latest ISO 45001 guidelines for safety management systems.',
      'What are the top 5 root cause analysis methods used in chemical plants?',
      'Research common causes of equipment failure in polymer manufacturing.',
      'Find industry benchmarks for safety incident rates in chemical manufacturing.',
      'What are the recommended corrective actions for catalyst loss in chemical reactors?',
      'Search for best practices in permit-to-work systems.',
      'Find case studies on reducing reporting delays in safety incidents.',
      'What are effective strategies for hazard identification in manufacturing facilities?',
      'Research mechanical integrity best practices for chemical plants.',
      'Find guidelines for emergency response planning in polymer facilities.',
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
  const [reasoningText, setReasoningText] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentDataset, setCurrentDataset] = useState<string>(dataset);
  const websocketRef = useRef<WebSocket | null>(null);
  const [queriesOpen, setQueriesOpen] = useState(false);
  const [debouncedAnalysis, setDebouncedAnalysis] = useState("");
  
  // Action button states
  const [copiedCurrent, setCopiedCurrent] = useState(false);
  const [copiedHistory, setCopiedHistory] = useState<{[key: number]: boolean}>({});
  const [likedCurrent, setLikedCurrent] = useState(false);
  const [dislikedCurrent, setDislikedCurrent] = useState(false);
  const [likedHistory, setLikedHistory] = useState<{[key: number]: boolean}>({});
  const [dislikedHistory, setDislikedHistory] = useState<{[key: number]: boolean}>({});
  const [isListening, setIsListening] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Use ref for immediate tracking (no async state delays)
  const currentMessageIdRef = useRef<string | null>(null);
  const savedMessageIdsRef = useRef<Set<string>>(new Set());
  const isAnswerModeRef = useRef<boolean>(false); // Track if we switched to answer mode
  const bottomRef = useRef<HTMLDivElement | null>(null); // Ref for auto-scroll to bottom
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce markdown rendering during streaming to allow complete tokens
  useEffect(() => {
    const content = currentAnalysis || finalAnswer || response?.analysis || response?.answer;
    
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
      }, 150); // 150ms debounce for smoother rendering
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentAnalysis, finalAnswer, response?.analysis, response?.answer, isStreaming]);

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
        response?.analysis ||
        response?.answer ||
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
          analysis: currentAnalysis || finalAnswer || response?.analysis || response?.answer || "",
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
      response?.analysis ||
      response?.answer ||
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
        analysis: currentAnalysis || finalAnswer || response?.analysis || response?.answer || "",
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
    setDebouncedAnalysis("");
    setToolCalls([]);
    setStreamEvents([]);
    setThinkingText("");
    setReasoningText("");
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
        console.log('📡 WebSocket message:', data);
        
        // Handle token-by-token streaming first (don't add to events)
        if (data.type === 'reasoning_token' && data.token) {
          // Backend sends reasoning_token for the model's thought process
          setReasoningText(prev => prev + data.token!);
          return;
        }
        
        // Ignore thinking_token to avoid duplicate content with reasoning
        
        if (data.type === 'answer_token' && data.token) {
          console.log('📝 Answer token received:', data.token);
          setCurrentAnalysis(prev => {
            const newContent = (prev || "") + data.token!;
            console.log('📊 Current analysis length:', newContent.length, 'Has table:', newContent.includes('|'));
            return newContent;
          });
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
          // Backend sends the complete formatted answer here - replace any accumulated content
          console.log('✅ Received formatted answer, length:', data.content.length);
          setFinalAnswer(data.content);
          setCurrentAnalysis(data.content);
          // Clear thinking and reasoning text since we now have the final formatted answer
          setThinkingText("");
          setReasoningText("");
        }

        // Completion
        if (data.type === 'complete' || data.type === 'stream_end') {
          console.log('🎯 Complete event received:', data);
          if (data.data) {
            console.log('📦 Response data:', data.data);
            setResponse(data.data);
            // Handle both 'analysis' and 'answer' fields from backend
            const responseText = data.data.answer || data.data.analysis;
            console.log('📝 Extracted response text:', responseText ? `${responseText.substring(0, 100)}...` : 'none');
            if (responseText && !currentAnalysis) {
              setCurrentAnalysis(responseText);
              setFinalAnswer(responseText);
            }
          }
          
          // Fallback: if no data.data but we have content in the main data object
          if (!data.data && (data as any).answer) {
              console.log('🔄 Using fallback response handling');
            const fallbackResponse: AgentResponse = {
              code: '',
              stdout: '',
              error: '',
              result_preview: [],
              analysis: (data as any).answer,
              answer: (data as any).answer
            };
            setResponse(fallbackResponse);
            if (!currentAnalysis) {
              setCurrentAnalysis((data as any).answer);
              setFinalAnswer((data as any).answer);
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
            setDebouncedAnalysis("");
            setToolCalls([]);
            setResponse(null);
            setThinkingText("");
            setReasoningText("");
            currentMessageIdRef.current = null;
          }, 100);
          
          // Scroll to bottom only after response is complete and DOM is fully updated
          // Use longer delay to avoid jittery behavior
          setTimeout(() => {
            if (bottomRef.current) {
              bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
          }, 300);
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
          className: "left-4",
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
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
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
    // Query auto-runs, no toast needed
    startWebSocketStreaming(q, d);
    
    // Scroll to bottom after picking query
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  const clearConversation = () => {
    setConversationHistory([]);
    savedMessageIdsRef.current.clear();
    currentMessageIdRef.current = null;
    localStorage.removeItem('safety-copilot-conversation');
    // Conversation cleared, no toast needed
  };

  // Simple helper to download markdown content as a file
  const downloadMarkdown = (filename: string, content: string) => {
    try {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download markdown:', e);
    }
  };

  // Voice input functionality with AssemblyAI (using axios)
  const startVoiceInput = async () => {
    try {
      console.log('🎤 Starting AssemblyAI voice input...');
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      // Open modal
      setVoiceModalOpen(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsListening(true);
      audioChunksRef.current = [];
      
      // Create MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing...');
        
        // Combine audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Send to AssemblyAI for transcription
        try {
          const baseUrl = "https://api.assemblyai.com";
          const headers = {
            authorization: "8768531e10a24e46a03d0d9da6f74095",
          };
          
          console.log('📤 Uploading audio to AssemblyAI...');
          
          // Step 1: Upload audio file
          const uploadResponse = await axios.post(`${baseUrl}/v2/upload`, audioBlob, {
            headers: {
              ...headers,
              'Content-Type': 'application/octet-stream',
            },
          });
          
          const audioUrl = uploadResponse.data.upload_url;
          console.log('✅ Audio uploaded:', audioUrl);
          
          // Step 2: Request transcription
          const transcriptResponse = await axios.post(
            `${baseUrl}/v2/transcript`,
            {
              audio_url: audioUrl,
              speech_model: "universal",
            },
            { headers }
          );
          
          const transcriptId = transcriptResponse.data.id;
          console.log('🔄 Transcription started, ID:', transcriptId);
          
          // Step 3: Poll for completion
          const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
          let attempts = 0;
          const maxAttempts = 60; // 3 minutes max
          
          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
            
            const pollingResponse = await axios.get(pollingEndpoint, { headers });
            const transcriptionResult = pollingResponse.data;
            
            if (transcriptionResult.status === "completed") {
              console.log('✅ Transcript:', transcriptionResult.text);
              setQuestion(transcriptionResult.text);
              setIsListening(false);
              break;
            } else if (transcriptionResult.status === "error") {
              throw new Error(`Transcription failed: ${transcriptionResult.error}`);
            }
            
            attempts++;
            console.log(`⏳ Polling... (${attempts}/${maxAttempts})`);
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('Transcription timeout');
          }
          
        } catch (error: any) {
          console.error('❌ AssemblyAI error:', error);
          setIsListening(false);
          toast({
            title: "Transcription Error",
            description: error.message || "Failed to transcribe audio. Please try again.",
            variant: "destructive",
            className: "left-4",
          });
        }
      };
      
      // Start recording
      mediaRecorder.start();
      console.log('🔴 Recording started... (Click mic again to stop, or it will auto-stop in 10 seconds)');
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('⏰ Auto-stopping recording after 10 seconds...');
          mediaRecorder.stop();
        }
      }, 10000);
      
    } catch (error: any) {
      console.error('❌ Microphone access error:', error);
      setIsListening(false);
      
      let errorMessage = 'Failed to access microphone.';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your device.';
      } else if (error.message === 'getUserMedia is not supported in this browser') {
        errorMessage = 'Voice input is not supported in this browser. Please use a modern browser with microphone support.';
      }
      
      toast({
        title: "Microphone Error",
        description: errorMessage,
        variant: "destructive",
        className: "left-4",
      });
    }
  };

  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('⏹️ Stopping recording...');
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceModalClose = () => {
    setVoiceModalOpen(false);
    stopVoiceInput();
  };

  const handleVoiceSend = () => {
    stopVoiceInput();
    setVoiceModalOpen(false); // Close modal immediately
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
                  {/* Historical Thinking & Planning (tools inside) */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <Collapsible>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors w-full text-left">
                            <ChevronRight className="h-4 w-4" />
                            <AITextLoading compact staticText="Click to view chain of thoughts" className="font-semibold" />
                            <Badge variant="secondary" className="ml-auto text-xs">Tools: {msg.toolCalls.length}</Badge>
                          </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 space-y-2 pl-3">
                              {msg.toolCalls.map((tc, idx) => {
                        const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                        const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                        const isWebSearch = tc.tool === 'search_web' && tc.result && typeof tc.result === 'object' && tc.result.results && Array.isArray(tc.result.results) && tc.result.results.length > 0;
                        const isImageSearch = tc.tool === 'search_images' && tc.result && typeof tc.result === 'object' && tc.result.images && Array.isArray(tc.result.images) && tc.result.images.length > 0;
                        const shouldAutoExpand = hasTableData || hasChartData || isWebSearch || isImageSearch;
                        
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
                                    {isWebSearch && (
                                      <Badge variant="secondary" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">🔍 {tc.result.results.length} sources</Badge>
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
                                                  <div key={idx} className="border rounded-xl p-3 bg-card hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between gap-3">
                                                      <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                          {favicon && (
                                                            <img
                                                              src={favicon}
                                                              alt={host}
                                                              className="w-4 h-4 rounded-full border"
                                                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                          )}
                                                          <span className="font-semibold truncate max-w-[40%]">{host || 'source'}</span>
                                                          {pathShort && <span className="truncate">{pathShort}</span>}
                                                        </div>
                                                        <a
                                                          href={href}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="block text-sm font-semibold text-sky-700 hover:underline mt-1"
                                                        >
                                                          {source.title}
                                                        </a>
                                                        {source.snippet && (
                                                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                                            {source.snippet}
                                                          </p>
                                                        )}
                                                      </div>
                                                      {source.thumbnail && (
                                                        <img
                                                          src={source.thumbnail}
                                                          alt={source.title}
                                                          className="w-20 h-20 rounded-md object-cover border"
                                                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })()
                                            ))}
                                          </div>
                                        )}
                                        
                                        {/* Render Image Search Results */}
                                        {isImageSearch && (
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {tc.result.images.map((img: any, i: number) => (
                                              <a
                                                key={i}
                                                href={img.link || img.imageUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative block overflow-hidden rounded-md border"
                                              >
                                                <img
                                                  src={img.thumbnailUrl || img.imageUrl}
                                                  alt={img.title || 'image'}
                                                  className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                {(img.title || img.source) && (
                                                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-1 truncate">
                                                    {img.title || img.source}
                                                  </div>
                                                )}
                                              </a>
                                            ))}
                                          </div>
                                        )}

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
                                        
                                        {/* Raw JSON (only if no table/chart/web search) */}
                                        {!hasTableData && !hasChartData && !isWebSearch && (
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
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  )}

                  {/* Historical Analysis */}
                  {msg.analysis && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-base dark:prose-invert max-w-none break-words
                          prose-p:leading-7 prose-p:my-4 prose-p:text-[15px] prose-p:break-words
                          prose-headings:font-semibold prose-headings:tracking-tight prose-headings:break-words
                          prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
                          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                          prose-ul:my-4 prose-ul:space-y-2
                          prose-ol:my-4 prose-ol:space-y-2
                          prose-li:leading-7 prose-li:my-1.5 prose-li:text-[15px] prose-li:break-words
                          prose-strong:font-semibold prose-strong:text-foreground prose-strong:break-words
                          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:break-all
                          prose-pre:bg-muted prose-pre:border prose-pre:overflow-x-auto
                          prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                          first:prose-p:mt-0
                          last:prose-p:mb-0
                          [&>*]:break-words">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, children, ...props}) => {
                                // Check if paragraph contains QuickChart URL
                                const text = String(children || '');
                                const quickchartMatch = text.match(/https:\/\/quickchart\.io\/chart\?c=\{[^}]+\}/);
                                if (quickchartMatch) {
                                  const chartUrl = quickchartMatch[0];
                                  return (
                                    <div className="my-4">
                                      <iframe
                                        src={chartUrl}
                                        width="100%"
                                        height="400"
                                        frameBorder="0"
                                        className="rounded-lg border shadow-sm"
                                        title="Chart Visualization"
                                      />
                                    </div>
                                  );
                                }
                                return <p className="mb-3 leading-relaxed break-words whitespace-pre-wrap" {...props}>{children}</p>;
                              },
                              ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="leading-relaxed break-words" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xl font-semibold mt-6 mb-4 first:mt-0 break-words" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0 break-words" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0 break-words" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-foreground break-words" {...props} />,
                              code: ({ inline, children, ...props }: any) => 
                                inline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-all" {...props}>{children}</code>
                                ) : (
                                  <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words" {...props}>{children}</code>
                                ),
                              // Add table renderers so saved messages display tables nicely too
                              table: ({node, children, ...props}) => (
                                <div className="my-4 overflow-x-auto rounded-lg border border-border shadow-sm">
                                  <table className="min-w-full divide-y divide-border" {...props}>
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                              tbody: ({node, ...props}) => <tbody className="bg-card divide-y divide-border" {...props} />,
                              tr: ({node, ...props}) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider" {...props} />,
                              td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-foreground" {...props} />,
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
                          
                          {/* Action Buttons for Historical Messages */}
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.analysis);
                                setCopiedHistory({...copiedHistory, [msgIdx]: true});
                                setTimeout(() => {
                                  setCopiedHistory(prev => {
                                    const newState = {...prev};
                                    delete newState[msgIdx];
                                    return newState;
                                  });
                                }, 2000);
                              }}
                            >
                              {copiedHistory[msgIdx] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${likedHistory[msgIdx] ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                              onClick={() => {
                                setLikedHistory({...likedHistory, [msgIdx]: !likedHistory[msgIdx]});
                                if (!likedHistory[msgIdx]) {
                                  setDislikedHistory(prev => {
                                    const newState = {...prev};
                                    delete newState[msgIdx];
                                    return newState;
                                  });
                                }
                              }}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${dislikedHistory[msgIdx] ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                              onClick={() => {
                                setDislikedHistory({...dislikedHistory, [msgIdx]: !dislikedHistory[msgIdx]});
                                if (!dislikedHistory[msgIdx]) {
                                  setLikedHistory(prev => {
                                    const newState = {...prev};
                                    delete newState[msgIdx];
                                    return newState;
                                  });
                                }
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
                                    text: msg.analysis,
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
                                startWebSocketStreaming(msg.question, msg.dataset);
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const md = msg.analysis || '';
                                      const fname = `response-${msgIdx + 1}.md`;
                                      downloadMarkdown(fname, md);
                                    }}
                                  >
                                    Download as .md
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </Button>
                          </div>
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
                {/* Thinking & Planning (live) - tools + reasoning */}
        {(reasoningText?.trim().length > 0 || toolCalls.length > 0) && (
                  <Collapsible defaultOpen={true}>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <CollapsibleTrigger asChild>
                          <button className="flex items-center gap-2 text-sm hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors w-full text-left">
                            <ChevronRight className="h-4 w-4" />
                            {isStreaming ? (
                              <AITextLoading compact texts={["Deep Reasoning", "Finding Best Tools", "Planning"]} className="font-semibold" />
                            ) : (
                              <AITextLoading compact staticText="Click to view chain of thought" className="font-semibold" />
                            )}
                            {toolCalls.length > 0 && (
                              <Badge variant="secondary" className="ml-auto text-xs">Tools: {toolCalls.length}</Badge>
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 space-y-3 pl-3">
                            
                       
                            {/* Tool Calls */}
                            {toolCalls.length > 0 && (
                              <div className="space-y-2">
                                {toolCalls.map((tc, idx) => {
                      // Check if result has table or chart data
                      const hasTableData = tc.result && typeof tc.result === 'object' && tc.result.table && Array.isArray(tc.result.table);
                      const hasChartData = tc.result && typeof tc.result === 'object' && tc.result.chart_type;
                      const isWebSearch = tc.tool === 'search_web' && tc.result && typeof tc.result === 'object' && tc.result.results && Array.isArray(tc.result.results) && tc.result.results.length > 0;
                      const isImageSearch = tc.tool === 'search_images' && tc.result && typeof tc.result === 'object' && tc.result.images && Array.isArray(tc.result.images) && tc.result.images.length > 0;
                      // Auto-expand if has visual data
                      const shouldAutoExpand = hasTableData || hasChartData || isWebSearch || isImageSearch;
                      
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
                                {isWebSearch && (
                                  <Badge variant="secondary" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    🔍 {tc.result.results.length} sources
                                  </Badge>
                                )}
                                {isImageSearch && (
                                  <Badge variant="secondary" className="ml-2 text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    🖼️ {tc.result.images.length} images
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
                                      <div key={idx} className="border rounded-xl p-3 bg-card hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                              {favicon && (
                                                <img
                                                  src={favicon}
                                                  alt={host}
                                                  className="w-4 h-4 rounded-full border"
                                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                              )}
                                              <span className="font-semibold truncate max-w-[40%]">{host || 'source'}</span>
                                              {pathShort && <span className="truncate">{pathShort}</span>}
                                            </div>
                                            <a
                                              href={href}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block text-sm font-semibold text-sky-700 hover:underline mt-1"
                                            >
                                              {source.title}
                                            </a>
                                            {source.snippet && (
                                              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                                {source.snippet}
                                              </p>
                                            )}
                                          </div>
                                          {source.thumbnail && (
                                            <img
                                              src={source.thumbnail}
                                              alt={source.title}
                                              className="w-20 h-20 rounded-md object-cover border"
                                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                ))}
                              </div>
                            )}
                            
                            {/* Render Image Search Results */}
                            {isImageSearch && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {tc.result.images.map((img: any, i: number) => (
                                  <a
                                    key={i}
                                    href={img.link || img.imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block overflow-hidden rounded-md border"
                                  >
                                    <img
                                      src={img.thumbnailUrl || img.imageUrl}
                                      alt={img.title || 'image'}
                                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    {(img.title || img.source) && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-1 truncate">
                                        {img.title || img.source}
                                      </div>
                                    )}
                                  </a>
                                ))}
                              </div>
                            )}

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
                            
                            {/* Raw JSON (collapsed by default if we have table/chart/web search) */}
                            {!hasTableData && !hasChartData && !isWebSearch && (
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
                            {/* Reasoning text (model's thought process) */}
                            {reasoningText && reasoningText.trim().length > 0 && (
                              <div className="mt-1 pl-1">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" />
                                  <span className="font-medium">Reasoning</span>
                                </div>
                                <div className="rounded-md border bg-muted/30 p-2">
                                  <pre className="m-0 text-xs font-mono leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                    {reasoningText}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </Collapsible>
                )}

                {/* Main Response - Always show during streaming or when we have content */}
                {(isStreaming || currentAnalysis || finalAnswer || response?.analysis || response?.answer || (response && Object.keys(response).length > 0)) && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      {isStreaming && !currentAnalysis && !finalAnswer ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                </div>
                    <div className="flex-1 min-w-0">
                      {currentAnalysis || finalAnswer || response?.analysis || response?.answer ? (
                        <div className="prose prose-base dark:prose-invert max-w-none break-words
                          prose-p:leading-7 prose-p:my-4 prose-p:text-[15px] prose-p:break-words
                          prose-headings:font-semibold prose-headings:tracking-tight prose-headings:break-words
                          prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-4
                          prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                          prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                          prose-ul:my-4 prose-ul:space-y-2
                          prose-ol:my-4 prose-ol:space-y-2
                          prose-li:leading-7 prose-li:my-1.5 prose-li:text-[15px] prose-li:break-words
                          prose-strong:font-semibold prose-strong:text-foreground prose-strong:break-words
                          prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:break-all
                          prose-pre:bg-muted prose-pre:border prose-pre:overflow-x-auto
                          prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1
                          first:prose-p:mt-0
                          last:prose-p:mb-0
                          [&>*]:break-words">
                          <ReactMarkdown 
                            key={`markdown-${isStreaming ? 'streaming' : 'complete'}-${(debouncedAnalysis || response?.analysis || "").length}`}
                            remarkPlugins={[remarkGfm]}
                            skipHtml={false}
                            components={{
                              p: ({node, children, ...props}) => {
                                // Check if paragraph contains QuickChart URL
                                const text = String(children || '');
                                const quickchartMatch = text.match(/https:\/\/quickchart\.io\/chart\?c=\{[^}]+\}/);
                                if (quickchartMatch) {
                                  const chartUrl = quickchartMatch[0];
                                  return (
                                    <div className="my-4">
                                      <iframe
                                        src={chartUrl}
                                        width="100%"
                                        height="400"
                                        frameBorder="0"
                                        className="rounded-lg border shadow-sm"
                                        title="Chart Visualization"
                                      />
                                    </div>
                                  );
                                }
                                return <p className="mb-3 leading-relaxed break-words whitespace-pre-wrap" {...props}>{children}</p>;
                              },
                              ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="leading-relaxed break-words" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-xl font-semibold mt-6 mb-4 first:mt-0 break-words" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-5 mb-3 first:mt-0 break-words" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0 break-words" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-foreground break-words" {...props} />,
                              code: ({ inline, children, ...props }: any) => {
                                // Log code blocks during streaming
                                if (!inline && isStreaming) {
                                  console.log('💻 Rendering code block during streaming:', String(children).substring(0, 50));
                                }
                                return inline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-all" {...props}>{children}</code>
                                ) : (
                                  <code className="block bg-muted p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words" {...props}>{children}</code>
                                );
                              },
                              table: ({node, children, ...props}) => {
                                console.log('📊 Table detected in markdown');
                                return (
                                  <div className="my-4 overflow-x-auto rounded-lg border border-border shadow-sm">
                                    <table className="min-w-full divide-y divide-border">
                                      {children}
                                    </table>
                                  </div>
                                );
                              },
                              thead: ({node, ...props}) => <thead className="bg-muted/50" {...props} />,
                              tbody: ({node, ...props}) => <tbody className="bg-card divide-y divide-border" {...props} />,
                              tr: ({node, ...props}) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
                              th: ({node, ...props}) => <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider" {...props} />,
                              td: ({node, ...props}) => <td className="px-4 py-3 text-sm text-foreground" {...props} />,
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
                                      // Keep as-is; QuickChart expects the encoded config under `c`
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
                            {debouncedAnalysis || response?.analysis || response?.answer || ""}
                          </ReactMarkdown>
                          {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground pt-1">
                          {response ? 'Response received but no text content available' : 'Analyzing Data...'}
                        </div>
                      )}
                      
                      {/* Action Buttons - Show only when response is complete */}
                      {!isStreaming && (currentAnalysis || finalAnswer || response?.analysis || response?.answer) && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const textToCopy = debouncedAnalysis || response?.analysis || response?.answer || finalAnswer || "";
                              navigator.clipboard.writeText(textToCopy);
                              setCopiedCurrent(true);
                              setTimeout(() => setCopiedCurrent(false), 2000);
                            }}
                          >
                            {copiedCurrent ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${likedCurrent ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => {
                              setLikedCurrent(!likedCurrent);
                              if (!likedCurrent) setDislikedCurrent(false);
                            }}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${dislikedCurrent ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => {
                              setDislikedCurrent(!dislikedCurrent);
                              if (!dislikedCurrent) setLikedCurrent(false);
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
                                    text: debouncedAnalysis || response?.analysis || response?.answer || finalAnswer || "",
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
                                startWebSocketStreaming(currentQuestion, currentDataset);
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const md = (debouncedAnalysis || response?.analysis || response?.answer || finalAnswer || '').toString();
                                    const fname = `response-current.md`;
                                    downloadMarkdown(fname, md);
                                  }}
                                >
                                  Download as .md
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </Button>
                        </div>
                      )}
                      
                      {/* Follow-up Questions */}
                      {!isStreaming && (currentAnalysis || finalAnswer || response?.analysis || response?.answer) && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-muted-foreground font-medium mb-2">Follow-up questions:</p>
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
                                }}
                                className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 border hover:border-primary rounded-full text-muted-foreground hover:text-primary transition-all"
                              >
                                {followUp}
                              </button>
                            ))}
                          </div>
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
                      // Code copied silently
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
            
            <div className="flex-1 relative">
              <Input
                placeholder="Ask about your safety data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="pr-24 h-12 rounded-full"
                disabled={isStreaming}
              />
              {/* Voice Input Button */}
              {!isStreaming && (
                <Button
                  type="button"
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  size="icon"
                  variant="ghost"
                  className={`absolute right-12 top-1 rounded-full h-10 w-10 ${isListening ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
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
                  <ArrowUp className="h-10 w-10 font-bold" />
                </Button>
              )}
                  </div>
          </form>
              </div>
      </div>

      {/* Voice Input Modal */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={handleVoiceModalClose}
        onSend={handleVoiceSend}
        isListening={isListening}
      />
    </div>
  );
}
