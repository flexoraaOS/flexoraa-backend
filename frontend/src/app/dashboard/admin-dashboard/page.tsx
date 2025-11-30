'use client';

import React from 'react';
import '@/styles/admin-dashboard-enhancements.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Settings, 
  AlertTriangle,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

import OverviewTab from '@/components/dashboard/admin/overview-tab';
import ClientDetailDialog from '@/components/dashboard/admin/client-detail-dialog';

import {
  ClientData
} from '@/components/dashboard/admin/data';
import { FinancialsTab } from '@/components/dashboard/admin/financials-tab';
import { ClientsTab } from '@/components/dashboard/admin/clients-tab';
import { SystemOpsTab } from '@/components/dashboard/admin/system-ops-tab';
import { AlertsTab } from '@/components/dashboard/alerts-tab';

const tabConfig = [
  { value: "overview", label: "Overview", icon: LayoutDashboard },
  { value: "financials", label: "Financials", icon: DollarSign },
  { value: "clients", label: "Clients", icon: Users },
  { value: "system-ops", label: "System Ops", icon: Settings },
  { value: "alerts", label: "Alerts", icon: AlertTriangle },
];

export default function AdminDashboardPage() {
  const [selectedClient, setSelectedClient] = React.useState<ClientData | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const contentRef = React.useRef<HTMLDivElement>(null);

  const activeTabConfig = tabConfig.find(tab => tab.value === activeTab);

  // Smooth scroll to top when tab changes
  React.useEffect(() => {
    if (contentRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  return (
    <div ref={contentRef} className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-headline bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
                Owner Dashboard
              </h1>
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground animate-in fade-in duration-700 delay-150">
              Manage and monitor your platform operations
            </p>
          </div>
          
          {/* System Status Badge - Hidden on small mobile */}
          <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-400">All Systems Operational</span>
          </div>
        </div>
        
        {/* Mobile Quick Stats - Visible only on mobile */}
        <div className="sm:hidden grid grid-cols-3 gap-2">
          <div className="glass-card p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">{tabConfig.length}</div>
            <div className="text-xs text-muted-foreground">Sections</div>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <div className="relative inline-flex">
              <div className="text-lg font-bold text-green-600">●</div>
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-foreground">24/7</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <TabsList className={cn(
            "grid w-full gap-2 p-1 h-auto bg-muted/50 backdrop-blur-sm border border-border/50 shadow-sm",
            "md:grid-cols-5 lg:max-w-4xl xl:max-w-5xl",
            "stagger-fade-in"
          )}>
            {tabConfig.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-md transition-all duration-200",
                  "data-[state=active]:shadow-lg data-[state=active]:scale-[1.02]",
                  "hover:bg-accent/50 hover:-translate-y-0.5",
                  "active:scale-[0.98]",
                  "enhanced-focus"
                )}
              >
                <tab.icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  activeTab === tab.value && "scale-110"
                )} />
                <span className="font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Mobile Dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-between h-12 px-4",
                  "bg-card hover:bg-accent/50 border-2 transition-all duration-200",
                  "active:scale-[0.98] ripple shadow-sm hover:shadow-md",
                  "enhanced-focus"
                )}
              >
                <div className="flex items-center gap-3">
                  {activeTabConfig && (
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <activeTabConfig.icon className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium text-base">
                    {activeTabConfig?.label || "Select Tab"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className={cn(
                "w-[calc(100vw-2rem)] sm:w-96",
                "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
                "shadow-lg border-2"
              )}
              align="center"
            >
              {tabConfig.map((tab, index) => (
                <DropdownMenuItem
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent/80 hover:pl-5",
                    "mobile-menu-item",
                    activeTab === tab.value && "bg-accent text-accent-foreground font-semibold"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors duration-200",
                    activeTab === tab.value ? "bg-primary/20" : "bg-muted"
                  )}>
                    <tab.icon className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      activeTab === tab.value && "text-primary scale-110"
                    )} />
                  </div>
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {activeTab === tab.value && (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Content with Animation */}
        <div className="mt-6 min-h-[400px] sm:min-h-[500px]">
          <TabsContent 
            value="overview" 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 data-[state=active]:block"
          >
            <div className="space-y-6">
              <OverviewTab />
            </div>
          </TabsContent>

          <TabsContent 
            value="financials"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 data-[state=active]:block"
          >
            <div className="space-y-6">
              <FinancialsTab />
            </div>
          </TabsContent>

          <TabsContent 
            value="clients"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 data-[state=active]:block"
          >
            <div className="space-y-6">
              <ClientsTab />
            </div>
          </TabsContent>

          <TabsContent 
            value="system-ops"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 data-[state=active]:block"
          >
            <div className="space-y-6">
              <SystemOpsTab />
            </div>
          </TabsContent>

          <TabsContent 
            value="alerts"
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 data-[state=active]:block"
          >
            <div className="space-y-6">
              <AlertsTab />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <ClientDetailDialog
        client={selectedClient}
        open={!!selectedClient}
        onOpenChange={(open) => { if (!open) setSelectedClient(null) }}
      />
    </div>
  );
}
