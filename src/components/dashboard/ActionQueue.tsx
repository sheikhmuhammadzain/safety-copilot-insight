import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getActionsOutgoing } from "@/lib/api";

interface Action {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  date: string;
  assignee: string;
  type: "corrective" | "investigation" | "attention";
}

export function ActionQueue() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["actions-outgoing"],
    queryFn: getActionsOutgoing,
  });

  const toAction = (item: any, idx: number): Action => {
    const sevRaw = (item?.severity || item?.priority || "medium").toString().toLowerCase();
    const severity: Action["severity"] = ["critical", "high", "medium", "low"].includes(sevRaw)
      ? (sevRaw as any)
      : "medium";

    const typeRaw = (item?.type || item?.category || "corrective").toString().toLowerCase();
    const type: Action["type"] = ["corrective", "investigation", "attention"].includes(typeRaw)
      ? (typeRaw as any)
      : "corrective";

    const title = (item?.title || item?.summary || item?.name || "Action").toString();
    const date = (item?.due_date || item?.created_at || item?.date || "").toString();
    const assignee = (item?.assignee || item?.owner || item?.responsible || "Unassigned").toString();
    const id = (item?.id ?? item?._id ?? String(idx)).toString();

    return { id, severity, title, date, assignee, type };
  };

  const actions: Action[] = Array.isArray(data) ? data.slice(0, 6).map(toAction) : [];

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
        <CardTitle className="text-lg font-semibold">
          Outgoing Actions {isFetching && <span className="text-xs text-muted-foreground">(refreshing)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[180px] grid place-items-center text-muted-foreground">Loading actions…</div>
        ) : isError ? (
          <div className="h-[180px] grid place-items-center text-destructive">
            <div className="text-center">
              <div className="font-medium mb-2">Failed to load actions</div>
              <pre className="text-xs opacity-80 max-w-full overflow-auto">{(error as any)?.message || String(error)}</pre>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </div>
          </div>
        ) : actions.length === 0 ? (
          <div className="h-[120px] grid place-items-center text-muted-foreground">No outgoing actions</div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
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
        )}
      </CardContent>
    </Card>
  );
}