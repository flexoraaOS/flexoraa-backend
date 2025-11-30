"use client"

import React, { useMemo, useState } from "react"
import { TabsContent } from "@radix-ui/react-tabs"
import { format } from "date-fns"
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

// UI primitives (adjust paths to your project)
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// icons
import {
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  Calendar as CalendarIcon,
  BarChart2,
  Bot,
  Trophy,
} from "lucide-react"


export type OverviewTabData = {
  businessKPIs?: {
    activeClients?: number
    newClients?: number
    churnedClients?: number
    mrr?: number
    arr?: number
    retention?: number
    upcomingRenewals?: number
  }
  totalExecutions?: number
  totalLeadOSExecutions?: number
  totalAgentOSExecutions?: number
  leadOsAnalytics?: {
    processingSpeed?: number
    executions?: number
    accuracy?: number
    costSaved?: number
  }
  agentOsAnalytics?: {
    responseSpeed?: number
    inboundLeads?: number
    persuasionSuccess?: number
    appointmentsBooked?: number
  }
  executionData?: Array<Record<string, any>>
  growthData?: Array<Record<string, any>>
}

export type OverviewTabProps = {
  value?: string // tabs value
  className?: string
  data?: OverviewTabData
}

// default dummy dataset
const DEFAULT_DATA: Required<OverviewTabData> = {
  businessKPIs: {
    activeClients: 120,
    newClients: 15,
    churnedClients: 3,
    mrr: 24000,
    arr: 288000,
    retention: 92,
    upcomingRenewals: 10,
  },
  totalExecutions: 125000,
  totalLeadOSExecutions: 80000,
  totalAgentOSExecutions: 45000,
  leadOsAnalytics: {
    processingSpeed: 2.4,
    executions: 3400,
    accuracy: 89,
    costSaved: 12000,
  },
  agentOsAnalytics: {
    responseSpeed: 1.2,
    inboundLeads: 560,
    persuasionSuccess: 74,
    appointmentsBooked: 180,
  },
  executionData: [
    { date: "Jan", leados: 1200, agentos: 800 },
    { date: "Feb", leados: 1500, agentos: 1000 },
    { date: "Mar", leados: 2000, agentos: 1400 },
  ],
  growthData: [
    { month: "Jan", clients: 40 },
    { month: "Feb", clients: 60 },
    { month: "Mar", clients: 90 },
    { month: "Apr", clients: 120 },
  ],
}

// tiny helper stat renderer (replace with your animated component if you have one)
function AnimatedStat({ target, prefix = "", suffix = "", className = "" }: any) {
  return (
    <span className={className}>
      {prefix}
      {typeof target === "number" ? target.toLocaleString() : target}
      {suffix}
    </span>
  )
}

export default function OverviewTab({ value = "overview", className = "", data }: OverviewTabProps) {
  // local UI state
  const [prodDateRange, setProdDateRange] = useState<any>(undefined)
  const [dateRange, setDateRange] = useState<any>(undefined)
  const [productFilter, setProductFilter] = useState<string>("all")

  // merge incoming data with defaults
  const merged = useMemo(() => {
    return {
      ...DEFAULT_DATA,
      ...(data || {}),
      businessKPIs: { ...DEFAULT_DATA.businessKPIs, ...(data?.businessKPIs || {}) },
      leadOsAnalytics: { ...DEFAULT_DATA.leadOsAnalytics, ...(data?.leadOsAnalytics || {}) },
      agentOsAnalytics: { ...DEFAULT_DATA.agentOsAnalytics, ...(data?.agentOsAnalytics || {}) },
    }
  }, [data])

  const {
    businessKPIs,
    totalExecutions,
    totalLeadOSExecutions,
    totalAgentOSExecutions,
    leadOsAnalytics,
    agentOsAnalytics,
    executionData,
    growthData,
  } = merged

  return (
    <TabsContent value={value} className={cn("space-y-8 pt-4", className)}>
      {/* Business KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessKPIs.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+{businessKPIs.newClients}</span> new, <span className="text-red-500">-{businessKPIs.churnedClients}</span> churned this month
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${businessKPIs.mrr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${businessKPIs.arr.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Annual Run Rate</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessKPIs.retention}%</div>
            <p className="text-xs text-muted-foreground">{businessKPIs.upcomingRenewals} upcoming renewals</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Analysis */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Product Analysis</CardTitle>
            <CardDescription>Performance metrics for your AI engines.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="prod-date"
                  variant={"outline"}
                  className={cn("w-full sm:w-[240px] justify-start text-left font-normal", !prodDateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {prodDateRange?.from ? (
                    prodDateRange.to ? (
                      <>
                        {format(prodDateRange.from, "LLL dd, y")} - {format(prodDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(prodDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={prodDateRange?.from} selected={prodDateRange} onSelect={setProdDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="leados">LeadOS</SelectItem>
                <SelectItem value="agentos">AgentOS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across all products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">LeadOS Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeadOSExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Workflows completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">AgentOS Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAgentOSExecutions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Messages, etc.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">0.2%</div>
                <p className="text-xs text-muted-foreground">Failed executions</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Execution Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={executionData}>
                    <defs>
                      <linearGradient id="colorLeadOS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--chart-1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAgentOS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-2" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--chart-2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--background) / 0.8)", backdropFilter: "blur(4px)", border: "1px solid var(--border", borderRadius: "var(--radius)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {(productFilter === "all" || productFilter === "leados") && <Area type="monotone" dataKey="leados" name="LeadOS" stroke="var(--chart-1" fill="url(#colorLeadOS)" stackId="1" />}
                    {(productFilter === "all" || productFilter === "agentos") && <Area type="monotone" dataKey="agentos" name="AgentOS" stroke="var(--chart-2" fill="url(#colorAgentOS)" stackId="1" />}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">LeadOS Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leadOsAnalytics.processingSpeed}s</div>
                  <p className="text-xs text-muted-foreground">Avg. qualify time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">AgentOS Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{agentOsAnalytics.responseSpeed}s</div>
                  <p className="text-xs text-muted-foreground">Avg. response time</p>
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">AgentOS Handoff Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8%</div>
                  <p className="text-xs text-muted-foreground">Escalated to human</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-4">
          <div className="flex items-center gap-3 w-full">
            <Trophy className="h-6 w-6 text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Top Performing Agent</p>
              <p className="text-xs text-muted-foreground">AgentOS is leading with {agentOsAnalytics.appointmentsBooked} appointments booked.</p>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Growth & Forecast + smaller product analytics block */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Product Analytics</CardTitle>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button id="overview-date" variant="outline" className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>LeadOS</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span>Executions (month):</span> <AnimatedStat target={leadOsAnalytics.executions} className="font-bold"/></div>
                <div className="flex justify-between"><span>Avg. Accuracy:</span> <AnimatedStat target={leadOsAnalytics.accuracy} suffix="%" className="font-bold"/></div>
                <div className="flex justify-between"><span>Est. Cost Saved:</span> <AnimatedStat target={leadOsAnalytics.costSaved} prefix="$" className="font-bold"/></div>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <h3 className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/>AgentOS</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span>Inbound Leads Handled:</span> <AnimatedStat target={agentOsAnalytics.inboundLeads} className="font-bold"/></div>
                <div className="flex justify-between"><span>Persuasion Success:</span> <AnimatedStat target={agentOsAnalytics.persuasionSuccess} suffix="%" className="font-bold"/></div>
                <div className="flex justify-between"><span>Appointments Booked:</span> <AnimatedStat target={agentOsAnalytics.appointmentsBooked} className="font-bold"/></div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4">
            <div className="flex items-center gap-3 w-full">
              <Trophy className="h-6 w-6 text-yellow-400"/>
              <div className="flex-1">
                <p className="text-sm font-semibold">Top Performing Agent</p>
                <p className="text-xs text-muted-foreground">AgentOS is leading with {agentOsAnalytics.appointmentsBooked} appointments booked.</p>
              </div>
            </div>
          </CardFooter>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Growth &amp; Forecast</CardTitle>
              <CardDescription>Client acquisition trendline.</CardDescription>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button id="growth-date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border) / 0.5)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border', borderRadius: 'var(--radius)' }} />
                <Area type="monotone" dataKey="clients" stroke="var(--primary" fill="url(#colorClients)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  )
}

/*
  Example usage (outside this file):

  import OverviewTab from '@/components/OverviewTab'

  function Dashboard() {
    const myData = { businessKPIs: { activeClients: 300, mrr: 50000 }, ... }

    return (
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <OverviewTab value="overview" data={myData} />
      </Tabs>
    )
  }
*/
