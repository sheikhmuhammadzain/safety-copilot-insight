import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, Search, Filter, Calendar } from "lucide-react";

interface Audit {
  id: string;
  title: string;
  auditor: string;
  department: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
  scheduledDate: string;
  completionDate?: string;
  findings: number;
  score: number;
}

// Mock data - replace with API call
const mockAudits: Audit[] = [
  {
    id: "AUD-001",
    title: "Annual Safety Compliance Audit",
    auditor: "John Smith",
    department: "Operations",
    status: "Completed",
    scheduledDate: "2024-01-10",
    completionDate: "2024-01-15",
    findings: 3,
    score: 92
  },
  {
    id: "AUD-002",
    title: "Equipment Safety Inspection",
    auditor: "Sarah Johnson",
    department: "Maintenance",
    status: "In Progress",
    scheduledDate: "2024-01-14",
    findings: 1,
    score: 0
  },
  {
    id: "AUD-003",
    title: "Environmental Compliance Check",
    auditor: "Mike Davis",
    department: "Environmental",
    status: "Scheduled",
    scheduledDate: "2024-01-20",
    findings: 0,
    score: 0
  }
];

export default function Audits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call - replace with actual endpoint
    const fetchAudits = async () => {
      try {
        // TODO: Replace with actual API call to your backend
        // const response = await fetch('/api/audits');
        // const data = await response.json();
        
        setTimeout(() => {
          setAudits(mockAudits);
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load audits",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchAudits();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-secondary text-secondary-foreground";
      case "In Progress": return "bg-accent text-accent-foreground";
      case "Completed": return "bg-success text-success-foreground";
      case "Overdue": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-accent";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const filteredAudits = audits.filter(audit =>
    audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completionRate = audits.length > 0 
    ? Math.round((audits.filter(a => a.status === "Completed").length / audits.length) * 100)
    : 0;

  const averageScore = audits.filter(a => a.score > 0).length > 0
    ? Math.round(audits.filter(a => a.score > 0).reduce((sum, a) => sum + a.score, 0) / audits.filter(a => a.score > 0).length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <FileCheck className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Audits</h1>
                <p className="text-sm text-muted-foreground">Track audit schedules and compliance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search audits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="default" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Audit
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">
                {audits.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Audits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">
                {completionRate}%
              </div>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore}
              </div>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">
                {audits.filter(a => a.status === "In Progress").length}
              </div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Audits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading audits...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Auditor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="font-mono text-sm">{audit.id}</TableCell>
                      <TableCell className="font-medium">{audit.title}</TableCell>
                      <TableCell>{audit.auditor}</TableCell>
                      <TableCell>{audit.department}</TableCell>
                      <TableCell>{new Date(audit.scheduledDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(audit.status)}>
                          {audit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{audit.findings}</TableCell>
                      <TableCell>
                        {audit.score > 0 ? (
                          <span className={getScoreColor(audit.score)}>
                            {audit.score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}