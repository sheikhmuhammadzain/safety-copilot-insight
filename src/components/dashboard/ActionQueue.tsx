import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  date: string;
  assignee: string;
  type: "corrective" | "investigation" | "attention";
}

const mockActions: Action[] = [
  {
    id: "1",
    severity: "critical",
    title: "Corrective Action Required",
    date: "2024-04-10",
    assignee: "Amanda Miller",
    type: "corrective"
  },
  {
    id: "2",
    severity: "high",
    title: "Immediate Attention",
    date: "2024-04-09",
    assignee: "Jeremy Holmes",
    type: "attention"
  },
  {
    id: "3",
    severity: "medium",
    title: "Investigation",
    date: "2024-04-09",
    assignee: "Sarah Lee",
    type: "investigation"
  }
];

export function ActionQueue() {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-safety-danger text-white";
      case "high":
        return "bg-safety-warning text-white";
      case "medium":
        return "bg-safety-info text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "corrective":
        return <AlertTriangle className="h-4 w-4" />;
      case "attention":
        return <Clock className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Outgoing Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockActions.map((action) => (
            <div 
              key={action.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getTypeIcon(action.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={cn("text-xs", getSeverityStyles(action.severity))}>
                      {action.severity}
                    </Badge>
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{action.date}</span>
                    <span>{action.assignee}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}