import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import AITextLoading from "@/components/motion/AITextLoading";

const suggestedQueries = [
  "Top 5 departments with most incidents",
  "Weekly incident trend with avg severity & total cost",
  "Incidents per location with average severity",
];

export function SafetyCopilot() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    // TODO: Implement actual API call to /agent/run
    setTimeout(() => {
      setIsLoading(false);
      setQuery("");
    }, 2000);
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-accent" />
          <span>Safety Copilot</span>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Assistant
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask: top 5 departments with most incidents"
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !query.trim()}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestedQuery(suggestion)}
                className="text-xs h-7"
                disabled={isLoading}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && (
          <AITextLoading
            texts={[
              "Thinking...",
              "Analyzing data...",
              "Cross-checking KPIs...",
              "Summarizing insights...",
              "Almost there...",
            ]}
            className="text-xl md:text-2xl"
            interval={1200}
          />
        )}
      </CardContent>
    </Card>
  );
}