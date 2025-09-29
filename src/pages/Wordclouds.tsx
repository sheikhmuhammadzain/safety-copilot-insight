import { useState, useMemo } from "react";
import { getWordcloudImageUrl, getDepartmentsWordcloudImageUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Cloud, RefreshCw } from "lucide-react";
import { useCachedImage } from "@/hooks/useCachedImage";

export default function Wordclouds() {
  // PNG controls
  const [width, setWidth] = useState<number>(1200);
  const [height, setHeight] = useState<number>(520);
  const [background, setBackground] = useState<string>("white");
  const [extraStopwords, setExtraStopwords] = useState<string>("");
  const [cacheBust, setCacheBust] = useState<number>(Date.now());
  const [department, setDepartment] = useState<string>("");

  // Loading/error flags for images
  const [loadingIncident, setLoadingIncident] = useState<boolean>(false);
  const [loadingHazard, setLoadingHazard] = useState<boolean>(false);
  const [errorIncident, setErrorIncident] = useState<string | null>(null);
  const [errorHazard, setErrorHazard] = useState<string | null>(null);

  // Departments wordcloud controls
  const [depDataset, setDepDataset] = useState<"incident" | "hazard" | "both">("both");
  const [depTopN, setDepTopN] = useState<number>(100);
  const [depMinCount, setDepMinCount] = useState<number>(1);
  const [depExcludeOther, setDepExcludeOther] = useState<boolean>(true);
  const [depCacheBust, setDepCacheBust] = useState<number>(Date.now());
  const [loadingDept, setLoadingDept] = useState<boolean>(false);
  const [errorDept, setErrorDept] = useState<string | null>(null);

  // Build URLs (without cache-busting param; we control refresh via refresh keys)
  const incidentUrl = useMemo(() =>
    getWordcloudImageUrl({ dataset: "incident", width, height, background_color: background, extra_stopwords: extraStopwords, department: department || undefined }),
    [width, height, background, extraStopwords, department]
  );
  const hazardUrl = useMemo(() =>
    getWordcloudImageUrl({ dataset: "hazard", width, height, background_color: background, extra_stopwords: extraStopwords, department: department || undefined }),
    [width, height, background, extraStopwords, department]
  );
  const deptUrl = useMemo(() =>
    getDepartmentsWordcloudImageUrl({ dataset: depDataset, width, height, background_color: background, top_n: depTopN, min_count: depMinCount, exclude_other: depExcludeOther }),
    [depDataset, width, height, background, depTopN, depMinCount, depExcludeOther]
  );

  // Cached images: use cacheBust and depCacheBust as refresh keys
  const incidentImg = useCachedImage(incidentUrl, undefined, cacheBust);
  const hazardImg = useCachedImage(hazardUrl, undefined, cacheBust);
  const deptImg = useCachedImage(deptUrl, undefined, depCacheBust);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Department Wordclouds</h1>
                <p className="text-sm text-muted-foreground">Incidents and Hazards</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="width">Width</label>
              <Input id="width" type="number" min={200} max={4096} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-28" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="height">Height</label>
              <Input id="height" type="number" min={200} max={4096} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-28" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="bg">Background</label>
              <Input id="bg" type="text" value={background} onChange={(e) => setBackground(e.target.value)} className="w-32" placeholder="white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="stop">Stopwords</label>
              <Input id="stop" type="text" value={extraStopwords} onChange={(e) => setExtraStopwords(e.target.value)} className="w-56" placeholder="audit,procedure,ok" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="dept">Department</label>
              <Input id="dept" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-44" placeholder="optional" />
            </div>
            <Button
              onClick={() => {
                setCacheBust(Date.now());
              }}
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Incidents Wordcloud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto rounded-md border bg-background">
                {(incidentImg.loading) && (
                  <div className="h-[320px] grid place-items-center text-muted-foreground">Generating image…</div>
                )}
                {incidentImg.error && (
                  <div className="h-[320px] grid place-items-center text-destructive">
                    <div>
                      <div className="font-medium mb-2">Failed to load incidents wordcloud</div>
                      <pre className="text-xs opacity-80 max-w-full overflow-auto">{incidentImg.error}</pre>
                    </div>
                  </div>
                )}
                {incidentImg.dataUrl && (
                  <img src={incidentImg.dataUrl} alt="Incidents wordcloud" className="w-full h-auto" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Hazards Wordcloud</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-auto rounded-md border bg-background">
                {hazardImg.loading && (
                  <div className="h-[320px] grid place-items-center text-muted-foreground">Generating image…</div>
                )}
                {hazardImg.error && (
                  <div className="h-[320px] grid place-items-center text-destructive">
                    <div>
                      <div className="font-medium mb-2">Failed to load hazards wordcloud</div>
                      <pre className="text-xs opacity-80 max-w-full overflow-auto">{hazardImg.error}</pre>
                    </div>
                  </div>
                )}
                {hazardImg.dataUrl && (
                  <img src={hazardImg.dataUrl} alt="Hazards wordcloud" className="w-full h-auto" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Departments wordcloud (frequency-based) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Departments Wordcloud (Incidents + Hazards)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground" htmlFor="depDataset">Dataset</label>
                  <select
                    id="depDataset"
                    value={depDataset}
                    onChange={(e) => setDepDataset(e.target.value as any)}
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                  >
                    <option value="both">both</option>
                    <option value="incident">incident</option>
                    <option value="hazard">hazard</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground" htmlFor="depTopN">Top N</label>
                  <Input id="depTopN" type="number" min={1} value={depTopN} onChange={(e) => setDepTopN(Number(e.target.value))} className="w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground" htmlFor="depMinCount">Min Count</label>
                  <Input id="depMinCount" type="number" min={1} value={depMinCount} onChange={(e) => setDepMinCount(Number(e.target.value))} className="w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <input id="depExcludeOther" type="checkbox" checked={depExcludeOther} onChange={(e) => setDepExcludeOther(e.target.checked)} />
                  <label className="text-sm text-muted-foreground" htmlFor="depExcludeOther">Exclude Other/NA</label>
                </div>
                <Button
                  onClick={() => {
                    setDepCacheBust(Date.now());
                  }}
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
              <div className="w-full overflow-auto rounded-md border bg-background">
                {deptImg.loading && (
                  <div className="h-[320px] grid place-items-center text-muted-foreground">Generating image…</div>
                )}
                {deptImg.error && (
                  <div className="h-[320px] grid place-items-center text-destructive">
                    <div>
                      <div className="font-medium mb-2">Failed to load departments wordcloud</div>
                      <pre className="text-xs opacity-80 max-w-full overflow-auto">{deptImg.error}</pre>
                    </div>
                  </div>
                )}
                {deptImg.dataUrl && (
                  <img src={deptImg.dataUrl} alt="Departments wordcloud" className="w-full h-auto" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
