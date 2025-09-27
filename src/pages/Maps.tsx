import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Map, MapPin, Layers, RotateCcw } from "lucide-react";
import { getHtml } from "@/lib/api";

export default function Maps() {
  const [mapData, setMapData] = useState<string>("");
  const [selectedView, setSelectedView] = useState<"combined" | "incident" | "hazard">("combined");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMapData = async (mapType: "combined" | "incident" | "hazard") => {
    setLoading(true);
    try {
      if (mapType === "combined") {
        const res = await getHtml("/maps/combined");
        setMapData(res.html);
      } else {
        const res = await getHtml("/maps/single", { dataset: mapType });
        setMapData(res.html);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData(selectedView);
  }, [selectedView]);

  const handleViewChange = (value: "combined" | "incident" | "hazard") => {
    setSelectedView(value);
  };

  const handleRefresh = () => {
    fetchMapData(selectedView);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <Map className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Facility Maps</h1>
                <p className="text-sm text-muted-foreground">Interactive safety and facility mapping</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedView} onValueChange={handleViewChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select map view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">
                  <div className="flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Combined View
                  </div>
                </SelectItem>
                <SelectItem value="incident">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-warning" />
                    Incidents Only
                  </div>
                </SelectItem>
                <SelectItem value="hazard">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-destructive" />
                    Hazards Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Map Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold text-foreground">24</div>
                  <p className="text-sm text-muted-foreground">Critical Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-warning" />
                <div>
                  <div className="text-2xl font-bold text-foreground">47</div>
                  <p className="text-sm text-muted-foreground">Medium Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-success" />
                <div>
                  <div className="text-2xl font-bold text-foreground">156</div>
                  <p className="text-sm text-muted-foreground">Safe Areas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <p className="text-sm text-muted-foreground">Facility Zones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="h-5 w-5" />
              <span>Interactive Facility Map</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({selectedView === "combined" ? "All Data" : 
                  selectedView === "incident" ? "Incidents" : "Hazards"})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-96 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-muted-foreground mb-2">Loading map...</div>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            ) : (
              <div className="h-96 w-full rounded-lg overflow-hidden border">
                <iframe
                  srcDoc={mapData}
                  className="w-full h-full border-none"
                  title="Interactive Safety Map"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Map Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>3D Facility Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                View facility risk levels in an interactive 3D environment
              </p>
              <Button variant="outline" className="w-full">
                Launch 3D View
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export & Share</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Export maps as images or share interactive links
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Export PNG
                </Button>
                <Button variant="outline" size="sm">
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  Share Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}