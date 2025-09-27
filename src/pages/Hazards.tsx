import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Filter } from "lucide-react";

interface Hazard {
  id: string;
  title: string;
  department: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  status: "Identified" | "Under Review" | "Mitigated";
  date: string;
  location: string;
  violationType: string;
}

// Mock data - replace with API call
const mockHazards: Hazard[] = [
  {
    id: "HAZ-001",
    title: "Exposed electrical wiring",
    department: "Maintenance",
    riskLevel: "High",
    status: "Under Review",
    date: "2024-01-15",
    location: "Electrical Room",
    violationType: "Electrical Safety"
  },
  {
    id: "HAZ-002",
    title: "Inadequate ventilation",
    department: "Operations",
    riskLevel: "Medium",
    status: "Identified",
    date: "2024-01-14",
    location: "Production Floor",
    violationType: "Environmental"
  },
  {
    id: "HAZ-003",
    title: "Missing safety signage",
    department: "Safety",
    riskLevel: "Low",
    status: "Mitigated",
    date: "2024-01-13",
    location: "Warehouse",
    violationType: "Regulatory Compliance"
  }
];

export default function Hazards() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call - replace with actual endpoint
    const fetchHazards = async () => {
      try {
        // TODO: Replace with actual API call to your backend
        // const response = await fetch('/api/hazards');
        // const data = await response.json();
        
        setTimeout(() => {
          setHazards(mockHazards);
          setLoading(false);
        }, 1000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load hazards",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchHazards();
  }, [toast]);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "bg-destructive text-destructive-foreground";
      case "High": return "bg-warning text-warning-foreground";
      case "Medium": return "bg-accent text-accent-foreground";
      case "Low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Identified": return "bg-destructive text-destructive-foreground";
      case "Under Review": return "bg-warning text-warning-foreground";
      case "Mitigated": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filteredHazards = hazards.filter(hazard =>
    hazard.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hazard.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hazard.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hazard.violationType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hazards</h1>
                <p className="text-sm text-muted-foreground">Identify and manage safety hazards</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hazards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
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
                {hazards.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Hazards</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-warning">
                {hazards.filter(h => h.riskLevel === "High" || h.riskLevel === "Critical").length}
              </div>
              <p className="text-sm text-muted-foreground">High Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">
                {hazards.filter(h => h.status === "Under Review").length}
              </div>
              <p className="text-sm text-muted-foreground">Under Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-success">
                {hazards.filter(h => h.status === "Mitigated").length}
              </div>
              <p className="text-sm text-muted-foreground">Mitigated</p>
            </CardContent>
          </Card>
        </div>

        {/* Hazards Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Hazards</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading hazards...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Violation Type</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHazards.map((hazard) => (
                    <TableRow key={hazard.id}>
                      <TableCell className="font-mono text-sm">{hazard.id}</TableCell>
                      <TableCell className="font-medium">{hazard.title}</TableCell>
                      <TableCell>{hazard.department}</TableCell>
                      <TableCell>{hazard.location}</TableCell>
                      <TableCell>{hazard.violationType}</TableCell>
                      <TableCell>
                        <Badge className={getRiskLevelColor(hazard.riskLevel)}>
                          {hazard.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(hazard.status)}>
                          {hazard.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(hazard.date).toLocaleDateString()}</TableCell>
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