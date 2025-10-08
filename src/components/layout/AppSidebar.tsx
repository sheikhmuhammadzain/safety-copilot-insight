import { 
  BarChart3, 
  Shield, 
  Map, 
  Bot, 
  Database, 
  Settings,
  Home,
  Cloud,
  Activity
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Overview", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Agent", url: "/agent", icon: Bot },
  { title: "Maps", url: "/maps", icon: Map },
  { title: "Wordclouds", url: "/wordclouds", icon: Cloud },
  { title: "Data Health", url: "/data-health", icon: Activity },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavClass = (active: boolean) =>
    cn(
      "w-full transition-colors duration-200",
      collapsed ? "justify-center rounded-full p-0 aspect-square" : "justify-start",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    );

  return (
    <Sidebar
      className="border-r border-border"
      collapsible="icon"
    >
      <SidebarContent className="p-8 group-data-[collapsible=icon]:p-2">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-md object-contain" />
            <div className="group-data-[collapsible=icon]:hidden">
              <a href="/" className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-sidebar-foreground">Safety Copilot</h2>
              </a>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-sidebar-foreground/70 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className="h-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:mx-1"
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(isActive(item.url))}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}