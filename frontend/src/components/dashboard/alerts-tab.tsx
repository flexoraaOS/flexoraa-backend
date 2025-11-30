
"use client";

import React, { useState } from "react";
import { AlertTriangle, Info, XCircle } from "lucide-react";

// --- UI Components (assuming from shadcn/ui) ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // Your utility for merging class names
import { toast } from "sonner";

// --- Type Definition ---
type AlertType = 'Error' | 'Warning' | 'Info';

type Alert = {
  id: number;
  type: AlertType;
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp: string;
  action: string;
};

// --- Dummy Data ---
// This initial data simulates what you would fetch from an API.
const initialAlertsData: Alert[] = [
  {
    id: 1,
    type: 'Error',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    title: 'API Outage: Razorpay',
    description: 'The payment processing API is currently unresponsive. Transactions may fail.',
    timestamp: '5 minutes ago',
    action: 'Check Status',
  },
  {
    id: 2,
    type: 'Warning',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    title: 'Low Credits: QuantumLeap',
    description: 'Client "QuantumLeap" has less than 10% of their LeadOS credits remaining.',
    timestamp: '1 hour ago',
    action: 'View Client',
  },
  {
    id: 3,
    type: 'Info',
    icon: <Info className="h-5 w-5 text-blue-500" />,
    title: 'System Update Scheduled',
    description: 'A maintenance update is scheduled for tomorrow at 2:00 AM IST. Minor downtime is expected.',
    timestamp: '3 hours ago',
    action: 'View Details',
  },
   {
    id: 4,
    type: 'Warning',
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    title: 'High CPU Usage Detected',
    description: 'Server CPU usage has exceeded 85% for the last 15 minutes.',
    timestamp: 'Yesterday',
    action: 'Inspect Logs',
  },
];

// --- Main Reusable Component ---
export const AlertsTab = () => {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlertsData);

  const handleDismiss = (id: number) => {
    setAlerts(currentAlerts => currentAlerts.filter(alert => alert.id !== id));
    toast("Alert dismissed.")
  };

  const handleAction = (alert: Alert) => {
    toast( `Action: ${alert.action}`,{
      description: `Triggered for alert: "${alert.title}"`,
    });
  };

  return (
    <TabsContent value="alerts" className="space-y-8 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Important system and client notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border",
                  alert.type === 'Error' && 'bg-red-500/10 border-red-500/20',
                  alert.type === 'Warning' && 'bg-yellow-500/10 border-yellow-500/20',
                  alert.type === 'Info' && 'bg-blue-500/10 border-blue-500/20'
                )}
              >
                <div className="flex-shrink-0 mt-1">{alert.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.timestamp}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleAction(alert)}>
                    {alert.action}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDismiss(alert.id)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                <Info className="h-10 w-10 text-muted-foreground mb-4"/>
                <p className="font-semibold">All Clear!</p>
                <p className="text-sm text-muted-foreground">You have no new alerts.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};