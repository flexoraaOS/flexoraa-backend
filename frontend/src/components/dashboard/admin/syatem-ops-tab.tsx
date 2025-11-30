// src/components/SystemOpsTab.tsx

"use client";

import React, { useState } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Disc3,
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  Signal,
  History,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

// --- UI Components (assuming from shadcn/ui) ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

// --- Type Definitions ---
type ApiStatus = "Operational" | "Degraded" | "Outage";
type ApiHealth = {
  name: string;
  status: ApiStatus;
};

// --- Dummy Data (Ready to be replaced by API calls) ---
const serverResourcesData = {
  cpu: 45,
  memory: 62,
  disk: 78,
};

const apiHealthData: ApiHealth[] = [
  { name: "Meta WhatsApp Cloud API", status: "Operational" },
  { name: "Google AI API", status: "Operational" },
  { name: "Razorpay API", status: "Outage" },
  { name: "Supabase", status: "Operational" },
  { name: "ChatGPT API", status: "Degraded" },
];

const apiUsageData = {
  google: { tokensIn: 1250000, tokensOut: 3450000, cost: 450.75 },
  meta: { messagesSent: 22450, apiCalls: 89800 },
};

const apiUsageChartData = [
  { name: "Google AI", value: 4700000, fill: "var(--chart-1" },
  { name: "Meta WA", value: 89800, fill: "var(--chart-2" },
];

// --- Helper Component for API Status ---
const ApiStatusIndicator = ({ status }: { status: ApiStatus }) => {
  const statusConfig = {
    Operational: {
      Icon: CheckCircle,
      text: "Operational",
      className: "text-green-500",
    },
    Degraded: {
      Icon: AlertCircle,
      text: "Degraded",
      className: "text-yellow-500",
    },
    Outage: {
      Icon: XCircle,
      text: "Outage",
      className: "text-red-500",
    },
  };
  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1.5 ${config.className}`}>
      <config.Icon className="h-4 w-4" />
      <span className="text-xs font-medium">{config.text}</span>
    </div>
  );
};


// --- Main Reusable Component ---
export const SystemOpsTab = () => {
  const [apiView, setApiView] = useState<'health' | 'usage'>('health');

  return (
    <TabsContent value="system-ops" className="space-y-8 pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Server Resources Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="h-5 w-5 text-primary" />Server Resources</CardTitle>
            <CardDescription>Hetzner VPS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <Label className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU Usage</Label>
                <span className='font-semibold'>{serverResourcesData.cpu}%</span>
              </div>
              <Progress value={serverResourcesData.cpu} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <Label className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Memory Usage</Label>
                <span className='font-semibold'>{serverResourcesData.memory}%</span>
              </div>
              <Progress value={serverResourcesData.memory} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <Label className="flex items-center gap-2"><Disc3 className="h-4 w-4" /> Disk Usage</Label>
                <span className='font-semibold'>{serverResourcesData.disk}%</span>
              </div>
              <Progress value={serverResourcesData.disk} />
            </div>
          </CardContent>
        </Card>

        {/* API Usage & Status Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5 text-primary" />API Usage & Status</CardTitle>
              <Select value={apiView} onValueChange={(value) => setApiView(value as 'health' | 'usage')}>
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">API Health</SelectItem>
                  <SelectItem value="usage">Token/Call Usage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>Real-time API health & usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {apiView === 'health' ? (
              <div className="space-y-3">
                {apiHealthData.map((api, index) => (
                  <React.Fragment key={api.name}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{api.name}</span>
                      <ApiStatusIndicator status={api.status} />
                    </div>
                    {index < apiHealthData.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Google AI (Gemini)</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Tokens In: {apiUsageData.google.tokensIn.toLocaleString()}</p>
                    <p>Tokens Out: {apiUsageData.google.tokensOut.toLocaleString()}</p>
                    <p>Est. Cost: ${apiUsageData.google.cost.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2">Meta (WhatsApp)</h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Messages Sent: {apiUsageData.meta.messagesSent.toLocaleString()}</p>
                    <p>API Calls: {apiUsageData.meta.apiCalls.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-[100px] w-full">
                  <ResponsiveContainer>
                    <RechartsBarChart data={apiUsageChartData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" hide />
                      <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        <LabelList dataKey="name" position="insideLeft" style={{ fill: 'var(--primary-foreground)' }} />
                        {apiUsageChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reliability Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Signal className="h-5 w-5 text-primary" />Reliability</CardTitle>
            <CardDescription>Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">API Error Rate (24h)</span>
              <span className="font-bold text-red-400">0.8%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Avg. API Latency</span>
              <span className="font-bold">120ms</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Leads Handled (WhatsApp)</span>
              <span className="font-bold">6,230</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Leads Handled (IG/FB)</span>
              <span className="font-bold">2,620</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast("Coming Soon!", {description: "Detailed logs will be available here." })}>
              <History className="mr-2 h-4 w-4" /> View & Export Detailed Logs
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TabsContent>
  );
};