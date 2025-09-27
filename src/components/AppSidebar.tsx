import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Palette,
  FileText,
  Eye,
  Scissors,
  Shirt,
  Sparkles,
  Shield,
  Warehouse,
  BarChart3,
  Settings,
  FolderOpen,
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
import { useIsMobile } from "@/hooks/use-mobile";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Vendors", url: "/vendors", icon: Users },
  { title: "Articles", url: "/articles", icon: Package },
  { title: "Collections", url: "/collections", icon: FolderOpen },
  { title: "Daily Reports", url: "/daily-reports", icon: FileText },
  { title: "Shipping", url: "/shipping", icon: Package },
  { title: "AI Assistant", url: "/ai-assistant", icon: Sparkles },
  { title: "Theme", url: "/theme", icon: Palette },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-active text-sidebar-active-foreground font-medium rounded-md" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground rounded-md transition-colors";

  const handleItemClick = () => {
    // Auto-close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuGroup = (items: typeof mainItems, label: string) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  end={item.url === "/"} 
                  className={getNavCls}
                  onClick={handleItemClick}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {renderMenuGroup(mainItems, "Main")}
      </SidebarContent>
    </Sidebar>
  );
}