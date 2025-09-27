import { useState, useCallback } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, Upload, FileSpreadsheet, RefreshCw, Download } from "lucide-react";
import { uploadWorkbook, reloadWorkbooks, loadExampleWorkbook, getWorkbookSelection } from "@/lib/api";

interface WorkbookSheet {
  name: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, any>[];
}

interface WorkbookInfo {
  fileName: string;
  uploadDate: string;
  sheetCount: number;
  sheets: WorkbookSheet[];
}

interface SheetMapping {
  incident: string;
  hazard: string;
  audit: string;
  inspection: string;
}

export default function Workbooks() {
  const [workbookInfo, setWorkbookInfo] = useState<WorkbookInfo | null>(null);
  const [sheetMapping, setSheetMapping] = useState<SheetMapping>({
    incident: "Incidents",
    hazard: "Hazards",
    audit: "Audits",
    inspection: "Inspections",
  });
  const [uploading, setUploading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx")) {
      toast({
        title: "Invalid File",
        description: "Please upload an Excel (.xlsx) file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const summary = await uploadWorkbook(file);
      const sheets: WorkbookSheet[] = (summary?.sheets || summary?.Sheets || []).map((s: any) => ({
        name: s.name || s.sheet_name || "Sheet",
        columns: s.columns || Object.keys((s.sampleData && s.sampleData[0]) || {}),
        rowCount: s.rowCount || s.row_count || (Array.isArray(s.sampleData) ? s.sampleData.length : 0),
        sampleData: s.sampleData || s.sample_rows || [],
      }));
      const info: WorkbookInfo = {
        fileName: summary?.fileName || summary?.file_name || file.name,
        uploadDate: new Date().toISOString(),
        sheetCount: summary?.sheetCount || summary?.sheet_count || sheets.length,
        sheets,
      };
      setWorkbookInfo(info);
      const mapping = await getWorkbookSelection();
      setSheetMapping((prev) => ({
        incident: mapping.incident || prev.incident,
        hazard: mapping.hazard || prev.hazard,
        audit: mapping.audit || prev.audit,
        inspection: mapping.inspection || prev.inspection,
      }));
      toast({
        title: "Upload Successful",
        description: `Uploaded ${info.fileName} with ${info.sheetCount} sheets`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload workbook",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleReload = async () => {
    setReloading(true);
    try {
      const res = await reloadWorkbooks();
      const mapping = await getWorkbookSelection();
      setSheetMapping((prev) => ({
        incident: mapping.incident || prev.incident,
        hazard: mapping.hazard || prev.hazard,
        audit: mapping.audit || prev.audit,
        inspection: mapping.inspection || prev.inspection,
      }));
      if (workbookInfo) {
        setWorkbookInfo({
          ...workbookInfo,
          sheetCount: res.sheet_count ?? workbookInfo.sheetCount,
          sheets: workbookInfo.sheets,
        });
      }
      toast({
        title: "Reload Successful",
        description: "Workbook data has been refreshed",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Reload Failed",
        description: "Failed to reload workbook data",
        variant: "destructive",
      });
    } finally {
      setReloading(false);
    }
  };

  const handleLoadExample = async () => {
    setUploading(true);
    try {
      const summary = await loadExampleWorkbook();
      const sheets: WorkbookSheet[] = (summary?.sheets || summary?.Sheets || []).map((s: any) => ({
        name: s.name || s.sheet_name || "Sheet",
        columns: s.columns || Object.keys((s.sampleData && s.sampleData[0]) || {}),
        rowCount: s.rowCount || s.row_count || (Array.isArray(s.sampleData) ? s.sampleData.length : 0),
        sampleData: s.sampleData || s.sample_rows || [],
      }));
      const info: WorkbookInfo = {
        fileName: summary?.fileName || summary?.file_name || "EPCL_VEHS_Data_Processed.xlsx",
        uploadDate: new Date().toISOString(),
        sheetCount: summary?.sheetCount || summary?.sheet_count || sheets.length,
        sheets,
      };
      setWorkbookInfo(info);
      const mapping = await getWorkbookSelection();
      setSheetMapping((prev) => ({
        incident: mapping.incident || prev.incident,
        hazard: mapping.hazard || prev.hazard,
        audit: mapping.audit || prev.audit,
        inspection: mapping.inspection || prev.inspection,
      }));
      toast({
        title: "Example Loaded",
        description: `Loaded ${info.fileName}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load example workbook",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Workbooks</h1>
                <p className="text-sm text-muted-foreground">Manage Excel data uploads and schema mapping</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {workbookInfo && (
              <Button variant="outline" size="sm" onClick={handleReload} disabled={reloading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${reloading ? "animate-spin" : ""}`} />
                Reload Data
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Excel Workbook</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-medium">Click to upload</span> your Excel file
                  </p>
                  <p className="text-xs text-muted-foreground">XLSX files only (MAX 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadExample} disabled={uploading}>
                <Download className="h-4 w-4 mr-2" />
                Load Example Data
              </Button>
            </div>

            {uploading && (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Processing workbook...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workbook Information */}
        {workbookInfo && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Workbook Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">File Name</p>
                    <p className="font-medium">{workbookInfo.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Upload Date</p>
                    <p className="font-medium">{new Date(workbookInfo.uploadDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sheet Count</p>
                    <p className="font-medium">{workbookInfo.sheetCount} sheets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sheet Mapping */}
            <Card>
              <CardHeader>
                <CardTitle>Sheet Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sheetMapping).map(([dataset, sheetName]) => (
                    <div key={dataset} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{dataset}s</p>
                        <p className="text-sm text-muted-foreground">Dataset</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{sheetName}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Sheet name</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sheets Overview */}
            <div className="space-y-4">
              {workbookInfo.sheets.map((sheet, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Sheet: {sheet.name}</span>
                      <Badge variant="outline">{sheet.rowCount.toLocaleString()} rows</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Columns */}
                      <div>
                        <p className="text-sm font-medium mb-2">Columns ({sheet.columns.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {sheet.columns.map((column, colIndex) => (
                            <Badge key={colIndex} variant="secondary">
                              {column}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Sample Data */}
                      <div>
                        <p className="text-sm font-medium mb-2">Sample Data:</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {sheet.columns.map((column) => (
                                <TableHead key={column}>{column}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sheet.sampleData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {sheet.columns.map((column) => (
                                  <TableCell key={column}>{String(row[column] || "-")}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
