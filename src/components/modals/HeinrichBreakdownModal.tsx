import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useHeinrichBreakdown } from "@/hooks/useHeinrichBreakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, FileText, MapPin, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface HeinrichBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    startDate?: string;
    endDate?: string;
  };
}

export function HeinrichBreakdownModal({ open, onOpenChange, filters }: HeinrichBreakdownModalProps) {
  const { data, isLoading, isError, error } = useHeinrichBreakdown(filters, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Heinrich's Pyramid - Detailed Breakdown
          </DialogTitle>
          <DialogDescription>
            Comprehensive breakdown by department and location with data source authenticity
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {isError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Failed to load breakdown data: {(error as any)?.message || String(error)}
            </p>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-6">
            {/* By Department */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Breakdown by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-center">Fatalities</TableHead>
                        <TableHead className="text-center">Lost Workday</TableHead>
                        <TableHead className="text-center">Recordable Injuries</TableHead>
                        <TableHead className="text-center">Near Misses</TableHead>
                        <TableHead className="text-center">At-Risk Behaviors</TableHead>
                        <TableHead className="text-center">Total Incidents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.by_department && data.by_department.length > 0 ? (
                        data.by_department.map((dept: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{dept.department}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={dept.fatalities > 0 ? "destructive" : "secondary"}>
                                {dept.fatalities}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={dept.lost_workday_cases > 0 ? "destructive" : "secondary"}>
                                {dept.lost_workday_cases}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={dept.recordable_injuries > 0 ? "default" : "secondary"}>
                                {dept.recordable_injuries}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{dept.near_misses}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{dept.at_risk_behaviors}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {dept.total_incidents}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No department data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* By Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  Breakdown by Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Fatalities</TableHead>
                        <TableHead className="text-center">Lost Workday</TableHead>
                        <TableHead className="text-center">Recordable Injuries</TableHead>
                        <TableHead className="text-center">Near Misses</TableHead>
                        <TableHead className="text-center">At-Risk Behaviors</TableHead>
                        <TableHead className="text-center">Total Incidents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.by_location && data.by_location.length > 0 ? (
                        data.by_location.map((loc: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{loc.location}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={loc.fatalities > 0 ? "destructive" : "secondary"}>
                                {loc.fatalities}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={loc.lost_workday_cases > 0 ? "destructive" : "secondary"}>
                                {loc.lost_workday_cases}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={loc.recordable_injuries > 0 ? "default" : "secondary"}>
                                {loc.recordable_injuries}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{loc.near_misses}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{loc.at_risk_behaviors}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {loc.total_incidents}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            No location data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Data Source Authenticity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.data_sources && Object.entries(data.data_sources).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-3 bg-muted/50 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <Badge className="mt-0.5">{key.replace(/_/g, ' ').toUpperCase()}</Badge>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground font-mono">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This breakdown provides authentic data sources for each pyramid layer, 
                enabling verification and drill-down analysis. All data respects the applied date filters.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
