'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wifi, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  channelIcons: Record<string, React.ReactNode>;
  isAiActive: boolean;
  setIsAiActive: (checked: boolean) => void;
}

const AgentosDashboardHeader: React.FC<DashboardHeaderProps> = ({ channelIcons, isAiActive, setIsAiActive }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">AgentOS SDR Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your unified inbox for AI-powered conversations.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Channels Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto bg-black">
                <Wifi className="mr-2 h-4 w-4" />
                Channels:
                <span className="ml-1 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-black">
              <div className="space-y-4">
                <div className="font-semibold ">Channel Status</div>
                <ul className="space-y-2 text-sm ">
                  {Object.entries(channelIcons).map(([name, icon]) => (
                    <li key={name} className="flex justify-between items-center">
                      <span className="flex items-center gap-2">{icon} {name}</span>
                      <span className="text-green-500 font-medium flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>Operational
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>

          {/* AI Mode Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Power className="mr-2 h-4 w-4" />
                AI Mode:
                <span
                  className={cn(
                    'ml-1 h-2 w-2 rounded-full animate-pulse',
                    isAiActive ? 'bg-green-500' : 'bg-red-500'
                  )}
                ></span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-black ">
              <div className="space-y-3">
                <div className="font-semibold">AI Status</div>
                <div className="flex justify-between items-center text-sm p-3 rounded-md bg-secondary">
                  <Label htmlFor="ai-toggle" className="font-medium">Automation Agent</Label>
                  <Switch id="ai-toggle" checked={isAiActive} onCheckedChange={setIsAiActive} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Last Sync:</span>
                  <span className="text-muted-foreground">Just now</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default AgentosDashboardHeader;
