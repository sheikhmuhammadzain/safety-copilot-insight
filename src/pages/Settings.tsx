import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, User, Bell, Shield, Database, Palette } from "lucide-react";

interface SettingsConfig {
  notifications: {
    emailAlerts: boolean;
    pushNotifications: boolean;
    criticalIncidentsOnly: boolean;
  };
  display: {
    theme: "light" | "dark" | "system";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    timezone: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  security: {
    sessionTimeout: number;
    requireMfa: boolean;
    passwordExpiry: number;
  };
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsConfig>({
    notifications: {
      emailAlerts: true,
      pushNotifications: false,
      criticalIncidentsOnly: true
    },
    display: {
      theme: "system",
      dateFormat: "MM/DD/YYYY",
      timezone: "UTC"
    },
    api: {
      baseUrl: "http://103.18.20.205:8087",
      timeout: 30,
      retryAttempts: 3
    },
    security: {
      sessionTimeout: 60,
      requireMfa: false,
      passwordExpiry: 90
    }
  });

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save settings to backend/localStorage
      setTimeout(() => {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully",
          variant: "default"
        });
        setSaving(false);
      }, 1000);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive"
      });
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof SettingsConfig, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Configure your Safety Copilot preferences</p>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 max-w-4xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@company.com" />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Safety & Compliance" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="Safety Manager" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Alerts</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications for incidents</p>
              </div>
              <Switch
                checked={settings.notifications.emailAlerts}
                onCheckedChange={(checked) => updateSettings("notifications", "emailAlerts", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.notifications.pushNotifications}
                onCheckedChange={(checked) => updateSettings("notifications", "pushNotifications", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Critical Incidents Only</Label>
                <p className="text-sm text-muted-foreground">Only notify for high and critical severity incidents</p>
              </div>
              <Switch
                checked={settings.notifications.criticalIncidentsOnly}
                onCheckedChange={(checked) => updateSettings("notifications", "criticalIncidentsOnly", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Display</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Theme</Label>
                <Select value={settings.display.theme} onValueChange={(value: any) => updateSettings("display", "theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date Format</Label>
                <Select value={settings.display.dateFormat} onValueChange={(value: any) => updateSettings("display", "dateFormat", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={settings.display.timezone} onValueChange={(value) => updateSettings("display", "timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time</SelectItem>
                    <SelectItem value="PST">Pacific Time</SelectItem>
                    <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>API Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiBaseUrl">Base URL</Label>
              <Input
                id="apiBaseUrl"
                value={settings.api.baseUrl}
                onChange={(e) => updateSettings("api", "baseUrl", e.target.value)}
                placeholder="http://103.18.20.205:8087"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="apiTimeout">Timeout (seconds)</Label>
                <Input
                  id="apiTimeout"
                  type="number"
                  value={settings.api.timeout}
                  onChange={(e) => updateSettings("api", "timeout", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="apiRetries">Retry Attempts</Label>
                <Input
                  id="apiRetries"
                  type="number"
                  value={settings.api.retryAttempts}
                  onChange={(e) => updateSettings("api", "retryAttempts", parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Multi-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Enable MFA for enhanced security</p>
              </div>
              <Switch
                checked={settings.security.requireMfa}
                onCheckedChange={(checked) => updateSettings("security", "requireMfa", checked)}
              />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSettings("security", "sessionTimeout", parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  type="number"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => updateSettings("security", "passwordExpiry", parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Reset All Settings</Label>
                <p className="text-sm text-muted-foreground">This will reset all settings to default values</p>
              </div>
              <Button variant="destructive" size="sm">
                Reset Settings
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Clear Cache</Label>
                <p className="text-sm text-muted-foreground">Clear all cached data and refresh from API</p>
              </div>
              <Button variant="outline" size="sm">
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}