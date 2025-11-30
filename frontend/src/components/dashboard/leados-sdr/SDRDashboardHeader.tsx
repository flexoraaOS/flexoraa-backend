"use client";

import React from "react";
import { Wallet, Bell, Flame, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notification {
  id: string;
  type: "hot-lead" | "completed-task" | "follow-up";
  title: string;
  description?: string;
  lead?: string;
}

interface SDRDashboardProps {
  credits: number;
  showNotifications: boolean; // toggle notifications
  notifications?: Notification[]; // will come from backend
  children?: React.ReactNode;
}

const SDRDashboard: React.FC<SDRDashboardProps> = ({
  credits,
  showNotifications,
  notifications,
  children,
}) => {
  // Use real notifications from props - no fallback to dummy data
  const finalNotifications = notifications || [];


  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-headline">SDR Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Your daily command center for lead engagement.
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
        {children}

        {/* Credits */}
        <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
          <Wallet className="mr-2 h-4 w-4 text-primary" />
          <span>
            Credits: <span className="font-bold">{credits.toLocaleString()}</span>
          </span>
        </div>

        {/* Notifications */}
        {showNotifications && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {finalNotifications.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0"
                  >
                    {finalNotifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Recent updates and assignments.
                  </p>
                </div>

                <ul className="space-y-1">
                  {finalNotifications.map((n) => (
                    <li
                      key={n.id}
                      className="group rounded-md p-2 transition-colors hover:bg-secondary"
                    >
                      <div className="flex items-start gap-3">
                        {n.type === "hot-lead" && (
                          <Flame className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                        )}
                        {n.type === "completed-task" && (
                          <CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                        )}
                        {n.type === "follow-up" && (
                          <Clock className="h-4 w-4 mt-1 text-yellow-500 flex-shrink-0" />
                        )}

                        <div className="flex-1">
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.description && (
                            <p className="text-xs text-muted-foreground">{n.description}</p>
                          )}
                        </div>
                      </div>

                      {n.type === "hot-lead" && (
                        <div className="pl-7 mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                          >
                            View Lead
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
};

export default SDRDashboard;
