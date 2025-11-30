
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Users, DollarSign, UserPlus, TrendingDown, ArrowUpDown, Search, Activity, Target, Trophy, Bot, BarChart2, Shield, AlertTriangle, TrendingUp, BarChart, LineChart, FileText, Settings, PowerOff, Power, HardDrive, Cpu, Percent, CheckCircle, XCircle, Calendar as CalendarIcon, Server, Cloud, Signal, AlertCircle, History, Disc, Laptop, Info, Building, UserCheck, Briefcase, FileClock, BarChart3, Receipt, HeartPulse, List, PieChart as PieChartIcon, GitBranch, MessageSquare, Phone, User, Milestone, Wallet, Hand, Eye } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell, Sector, BarChart as RechartsBarChart, Bar } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AnimatedStat } from '@/components/ui/animated-stat';


const businessKPIs = {
    activeClients: { total: 42, new: 5, churned: 1 },
    mrr: 45231,
    arr: 45231 * 12,
    retention: 97.6,
};

const leadOsAnalytics = {
    executions: 250000,
    accuracy: 96.5,
    costSaved: 28500,
};

const agentOsAnalytics = {
    inboundLeads: 8850,
    persuasionSuccess: 22.3,
    appointmentsBooked: 450,
};

const systemHealth = {
    uptime: 99.98,
    errors24h: 2,
    errors7d: 15,
};

const financialData = {
    revenue: { total: 52130, leados: 35000, agentos: 17130, recurring: 40000, topUp: 12130 },
    costs: { total: 18500, api: 12000, infra: 4500, ops: 2000 },
    profit: { gross: 52130 - 12000, net: 52130 - 18500 },
    cashBalance: 125430.50
};

const topClients = [
    { name: "Innovate Inc.", revenue: 15000 },
    { name: "Solutions Corp.", revenue: 12000 },
    { name: "Data Dynamics", revenue: 8000 },
];


const revenueCostData = [
    { name: 'Revenue', value: financialData.revenue.total, fill: 'hsl(var(--chart-2))' },
    { name: 'API Costs', value: financialData.costs.api, fill: 'hsl(var(--chart-1))' },
    { name: 'Infra Costs', value: financialData.costs.infra, fill: 'hsl(var(--chart-4))' },
    { name: 'Ops Costs', value: financialData.costs.ops, fill: 'hsl(var(--chart-5))' },
]

const revenueByProductData = [
    { name: 'LeadOS', value: financialData.revenue.leados, fill: 'hsl(var(--chart-1))' },
    { name: 'AgentOS', value: financialData.revenue.agentos, fill: 'hsl(var(--chart-2))' },
]

const outstandingInvoices = [
    { client: 'Synergy Systems', amount: 12990, due: '2024-08-01', daysOverdue: -10, status: 'Pending'},
    { client: 'Data Dynamics', amount: 4990, due: '2024-07-20', daysOverdue: 1, status: 'Overdue'},
    { client: 'Future Forward', amount: 7990, due: '2024-07-15', daysOverdue: 6, status: 'Overdue'},
    { client: 'NextGen Solutions', amount: 14990, due: '2024-08-05', daysOverdue: -15, status: 'Pending'},
];


const initialClientManagementData = [
    { client: 'Innovate Inc.', industry: 'Tech Startup', contact: 'Alice Johnson', product: 'LeadOS & AgentOS', status: 'Active', contractStart: '2023-01-15', contractEnd: '2025-01-14', plan: 'Pro', accountManager: 'John Doe', leadOsCredits: 45000, leadOsMax: 50000, agentOsCredits: 8000, agentOsMax: 10000, avatarHint: 'abstract logo' },
    { client: 'Solutions Corp.', industry: 'Consulting', contact: 'Bob Williams', product: 'LeadOS', status: 'Active', contractStart: '2023-06-01', contractEnd: '2024-05-31', plan: 'Growth', accountManager: 'Jane Smith', leadOsCredits: 18000, leadOsMax: 25000, agentOsCredits: 0, agentOsMax: 0, avatarHint: 'geometric logo' },
    { client: 'Data Dynamics', industry: 'Data Analytics', contact: 'Charlie Brown', product: 'AgentOS', status: 'Active', contractStart: '2024-03-20', contractEnd: '2025-03-19', plan: 'Starter', accountManager: 'John Doe', leadOsCredits: 0, leadOsMax: 0, agentOsCredits: 4500, agentOsMax: 5000, avatarHint: 'data logo' },
    { client: 'Market Movers', industry: 'Marketing Agency', contact: 'Diana Prince', product: 'LeadOS', status: 'Inactive', contractStart: '2023-02-10', contractEnd: '2024-02-09', plan: 'Growth', accountManager: 'Jane Smith', leadOsCredits: 0, leadOsMax: 10000, agentOsCredits: 0, agentOsMax: 0, avatarHint: 'marketing logo' },
];

type ClientData = typeof initialClientManagementData[0];

const growthData = [
    { month: 'Jan', clients: 2 },
    { month: 'Feb', clients: 3 },
    { month: 'Mar', clients: 5 },
    { month: 'Apr', clients: 4 },
    { month: 'May', clients: 6 },
    { month: 'Jun', clients: 7 },
    { month: 'Jul', clients: 5 },
];

const ClientDetailDialog = ({ client, open, onOpenChange }: { client: ClientData | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!client) return null;

    const activityData = Array.from({ length: 7 }, (_, i) => ({
      name: format(subDays(new Date(), 6 - i), 'eee'),
      Leads: Math.floor(Math.random() * 50) + 10,
      Conversations: Math.floor(Math.random() * 200) + 50,
    }));
    
    const conversationSplitData = [
      { name: 'Service', value: 400, fill: 'hsl(var(--chart-1))' },
      { name: 'Marketing', value: 300, fill: 'hsl(var(--chart-2))' },
      { name: 'Utility', value: 300, fill: 'hsl(var(--chart-3))' },
    ];

    const invoiceHistory = [
        { id: 'INV-C1-003', date: '2024-07-01', amount: '₹14,999', status: 'Paid' },
        { id: 'INV-C1-002', date: '2024-06-01', amount: '₹14,999', status: 'Paid' },
        { id: 'INV-C1-001', date: '2024-05-01', amount: '₹14,999', status: 'Paid' },
    ];


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh]">
                 <DialogHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://placehold.co/48x48.png?text=${client.client.charAt(0)}`} data-ai-hint={client.avatarHint}/>
                            <AvatarFallback>{client.client.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-2xl font-headline">{client.client}</DialogTitle>
                            <DialogDescription>{client.industry}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="profile" className="flex flex-col h-full">
                        <TabsList className="shrink-0">
                            <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
                            <TabsTrigger value="usage"><PieChartIcon className="mr-2 h-4 w-4"/>Usage</TabsTrigger>
                            <TabsTrigger value="performance"><TrendingUp className="mr-2 h-4 w-4"/>Performance</TabsTrigger>
                            <TabsTrigger value="billing"><Receipt className="mr-2 h-4 w-4"/>Billing</TabsTrigger>
                            <TabsTrigger value="health"><HeartPulse className="mr-2 h-4 w-4"/>Health</TabsTrigger>
                            <TabsTrigger value="logs"><History className="mr-2 h-4 w-4"/>Logs</TabsTrigger>
                        </TabsList>
                        <div className="flex-1 overflow-y-auto pt-4 pr-2">
                            <TabsContent value="profile" className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Client Profile</CardTitle></CardHeader>
                                    <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2"><Building className="h-4 w-4 text-primary"/><strong>Company:</strong> {client.client}</div>
                                        <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary"/><strong>Industry:</strong> {client.industry}</div>
                                        <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary"/><strong>Contact:</strong> {client.contact}</div>
                                        <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary"/><strong>Plan:</strong><Badge variant="secondary">{client.plan}</Badge></div>
                                        <div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-primary"/><strong>Contract:</strong> {client.contractStart} to {client.contractEnd}</div>
                                        <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary"/><strong>Account Manager:</strong> {client.accountManager}</div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="usage" className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Quota Consumption</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        {client.leadOsMax > 0 && <div><Label>LeadOS Credits</Label><Progress value={(client.leadOsCredits / client.leadOsMax) * 100} /><p className="text-xs text-right text-muted-foreground mt-1">{client.leadOsCredits}/{client.leadOsMax}</p></div>}
                                        {client.agentOsMax > 0 && <div><Label>AgentOS Credits</Label><Progress value={(client.agentOsCredits / client.agentOsMax) * 100} /><p className="text-xs text-right text-muted-foreground mt-1">{client.agentOsCredits}/{client.agentOsMax}</p></div>}
                                    </CardContent>
                                </Card>
                                <div className="grid md:grid-cols-2 gap-6">
                                     <Card>
                                        <CardHeader><CardTitle>Activity Trend (Last 7 Days)</CardTitle></CardHeader>
                                        <CardContent className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsBarChart data={activityData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                                                    <Bar dataKey="Leads" fill="hsl(var(--chart-1))" />
                                                    <Bar dataKey="Conversations" fill="hsl(var(--chart-2))" />
                                                </RechartsBarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle>WhatsApp Conversation Split</CardTitle></CardHeader>
                                        <CardContent className="h-[200px]">
                                             <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={conversationSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="var(--color)" label>
                                                         {conversationSplitData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                            <TabsContent value="performance" className="grid md:grid-cols-3 gap-6">
                                <Card><CardHeader><CardTitle>Leads Generated</CardTitle></CardHeader><CardContent className="text-3xl font-bold">1,204</CardContent></Card>
                                <Card><CardHeader><CardTitle>Leads Converted</CardTitle></CardHeader><CardContent className="text-3xl font-bold">88</CardContent></Card>
                                <Card><CardHeader><CardTitle>Conversion %</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-green-400">7.3%</CardContent></Card>
                                <Card><CardHeader><CardTitle>Avg. API Latency</CardTitle></CardHeader><CardContent className="text-3xl font-bold">112ms</CardContent></Card>
                                <Card><CardHeader><CardTitle>Error Rate</CardTitle></CardHeader><CardContent className="text-3xl font-bold text-red-400">0.4%</CardContent></Card>
                            </TabsContent>
                             <TabsContent value="billing" className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Billing & Financials</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                            <div><strong>Current Cycle:</strong> Jul 1 - Aug 1, 2024</div>
                                            <div><strong>Outstanding Invoices:</strong> <span className="text-red-400">None</span></div>
                                            <div><strong>LTV:</strong> ₹44,997</div>
                                        </div>
                                         <Separator className="my-4"/>
                                         <h4 className="font-semibold text-md mb-2">Invoice History</h4>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {invoiceHistory.map(inv => (
                                                    <TableRow key={inv.id}><TableCell>{inv.id}</TableCell><TableCell>{inv.date}</TableCell><TableCell>{inv.amount}</TableCell><TableCell><Badge className="text-green-400 border-green-400/50 bg-green-500/10">{inv.status}</Badge></TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="health" className="space-y-6">
                                 <Card>
                                    <CardHeader><CardTitle>Health & Alerts</CardTitle></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary"><span className="font-medium">API Status</span><Badge className="bg-green-500/20 text-green-400">Operational</Badge></div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary"><span className="font-medium">SLA Compliance (30d)</span><span className="font-bold text-green-400">99.98%</span></div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary"><span className="font-medium">Active Alerts</span><span className="text-muted-foreground">None</span></div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="logs" className="space-y-6">
                                <Card>
                                    <CardHeader><CardTitle>Logs & History</CardTitle></CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground">Detailed logs and history will be available in a future update.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default function AdminDashboardPage() {
  const [clientData, setClientData] = React.useState(initialClientManagementData);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [selectedClient, setSelectedClient] = React.useState<ClientData | null>(null);
  const [pieActiveIndex, setPieActiveIndex] = React.useState(0);

  React.useEffect(() => {
    setDateRange({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
  }, []);
  
  const onPieEnter = React.useCallback((_: any, index: number) => {
    setPieActiveIndex(index);
  }, []);
  
  const renderActiveShape = (props: any) => {
      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
      return (
        <g>
          <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">{payload.name}</text>
          <text x={cx} y={cy + 10} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="font-semibold">${value.toLocaleString()}</text>
          <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={outerRadius + 5}
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            className="chart-glow"
            style={{ filter: `drop-shadow(0 0 8px ${fill})` }}
          />
        </g>
      );
  };


  const handleWorkspaceToggle = (clientName: string, checked: boolean) => {
    setClientData(prevData =>
      prevData.map(client =>
        client.client === clientName ? { ...client, status: checked ? 'Active' : 'Inactive' } : client
      )
    );
    toast({
        title: "Client Workspace Updated",
        description: `${clientName}'s workspace has been ${checked ? 'activated' : 'deactivated'}.`
    })
  };

  const handleFinancialAction = (action: string, clientName: string) => {
    toast({
        title: "Action Triggered",
        description: `${action} for ${clientName} has been initiated.`
    })
  }
  
  const handleViewDetails = (client: ClientData) => {
      setSelectedClient(client);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Owner Dashboard</h1>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="system-ops">System Ops</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
            {/* Business KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{businessKPIs.activeClients.total}</div>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-green-500">+{businessKPIs.activeClients.new}</span> new, <span className="text-red-500">-{businessKPIs.activeClients.churned}</span> churned this month
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
                <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
                        <Shield className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{businessKPIs.retention}%</div>
                        <p className="text-xs text-muted-foreground">Last 90 days</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Product Analytics</CardTitle>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full sm:w-[300px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                        ) : (
                                        format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    />
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
                </Card>
                <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader>
                        <CardTitle>Growth &amp; Forecast</CardTitle>
                        <CardDescription>Client acquisition trendline.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} 
                                />
                                <Area type="monotone" dataKey="clients" name="New Clients" stroke="hsl(var(--primary))" fill="url(#colorClients)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Financial Control</CardTitle>
                    <CardDescription>Owner-level financial intelligence hub.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Top Row KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">${financialData.revenue.total.toLocaleString()}</div><p className="text-xs text-muted-foreground">MTD</p></CardContent>
                            <CardFooter><Button size="xs" variant="outline"><Eye className="mr-1 h-3 w-3"/>View Breakdown</Button></CardFooter>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Costs</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">${financialData.costs.total.toLocaleString()}</div><p className="text-xs text-muted-foreground">API, Infra, Ops</p></CardContent>
                            <CardFooter><Button size="xs" variant="outline"><Eye className="mr-1 h-3 w-3"/>View Breakdown</Button></CardFooter>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Gross Profit</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-green-400">${financialData.profit.gross.toLocaleString()}</div><p className="text-xs text-muted-foreground">Revenue - API Costs</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold text-green-400">${financialData.profit.net.toLocaleString()}</div><p className="text-xs text-muted-foreground">After all costs</p></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cash Balance</CardTitle></CardHeader>
                            <CardContent><div className="text-2xl font-bold">${financialData.cashBalance.toLocaleString()}</div><p className="text-xs text-muted-foreground">In Bank</p></CardContent>
                        </Card>
                    </div>

                    {/* Second Row Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card>
                             <CardHeader>
                                <CardTitle>Revenue Breakdown</CardTitle>
                                <div className="pt-2"><Tabs defaultValue="product"><TabsList className="h-8"><TabsTrigger value="product" className="text-xs">By Product</TabsTrigger><TabsTrigger value="client" className="text-xs">By Client</TabsTrigger><TabsTrigger value="type" className="text-xs">By Type</TabsTrigger></TabsList></Tabs></div>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background) / 0.8)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                                        <Pie data={revenueByProductData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {revenueByProductData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                        </Pie>
                                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Costs Breakdown</CardTitle>
                                <div className="pt-2"><Tabs defaultValue="api"><TabsList className="h-8"><TabsTrigger value="api" className="text-xs">API</TabsTrigger><TabsTrigger value="infra" className="text-xs">Infra</TabsTrigger><TabsTrigger value="ops" className="text-xs">Ops</TabsTrigger></TabsList></Tabs></div>
                            </CardHeader>
                            <CardContent className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={[{name: 'Costs', ...financialData.costs}]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" hide />
                                        <YAxis />
                                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background) / 0.8)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                                        <Bar dataKey="api" stackId="a" fill="hsl(var(--chart-1))" name="API"/>
                                        <Bar dataKey="infra" stackId="a" fill="hsl(var(--chart-2))" name="Infrastructure" />
                                        <Bar dataKey="ops" stackId="a" fill="hsl(var(--chart-3))" name="Operations"/>
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Third Row Panels */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <Card>
                            <CardHeader><CardTitle>Cash Flow Snapshot</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between"><span>Cash In (MTD):</span> <span className="font-semibold text-green-400">$60,000</span></div>
                                <div className="flex justify-between"><span>Cash Out (MTD):</span> <span className="font-semibold text-red-400">$25,000</span></div>
                                <div className="flex justify-between border-t pt-2"><span>Net Flow:</span> <span className="font-semibold text-green-400">$35,000</span></div>
                                <Button variant="secondary" className="w-full">View Upcoming Liabilities</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Forecast & Trends</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between"><span>Projected Revenue (30d):</span> <span className="font-semibold">$55,000</span></div>
                                <div className="flex justify-between"><span>Projected Costs (30d):</span> <span className="font-semibold">$20,000</span></div>
                                <div className="flex justify-between border-t pt-2"><span>Break-even Forecast:</span> <span className="font-semibold">N/A</span></div>
                                <Button variant="secondary" className="w-full">Simulate Scenarios</Button>
                            </CardContent>
                        </Card>
                     </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-8">
            <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                    <CardTitle>Client Management</CardTitle>
                    <CardDescription>Oversee all client accounts and their configurations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {clientData.map(client => (
                        <Card key={client.client} className="p-4 transition-shadow hover:shadow-md">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={`https://placehold.co/48x48.png?text=${client.client.charAt(0)}`} data-ai-hint={client.avatarHint}/>
                                        <AvatarFallback>{client.client.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{client.client}</p>
                                        <p className="text-sm text-muted-foreground">{client.product}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={client.status === 'Active' ? 'default' : 'secondary'} className={cn(client.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                                        {client.status}
                                    </Badge>
                                    <Switch
                                        checked={client.status === 'Active'}
                                        onCheckedChange={(checked) => handleWorkspaceToggle(client.client, checked)}
                                    />
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                                            <Info className="mr-2 h-4 w-4" />View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem><Laptop className="mr-2 h-4 w-4"/>Login as Client</DropdownMenuItem>
                                    </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <Separator className="my-4"/>
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">Contract: {client.contractStart} to {client.contractEnd}</div>
                                {client.leadOsMax > 0 && <div><Label>LeadOS Credits</Label><Progress value={(client.leadOsCredits / client.leadOsMax) * 100} /><p className="text-xs text-right text-muted-foreground mt-1">{client.leadOsCredits.toLocaleString()}/{client.leadOsMax.toLocaleString()}</p></div>}
                                {client.agentOsMax > 0 && <div><Label>AgentOS Credits</Label><Progress value={(client.agentOsCredits / client.agentOsMax) * 100} /><p className="text-xs text-right text-muted-foreground mt-1">{client.agentOsCredits.toLocaleString()}/{client.agentOsMax.toLocaleString()}</p></div>}
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="system-ops" className="space-y-8">
             <Card className="transition-all duration-300 ease-in-out hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>A real-time overview of system and API performance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Server className="h-4 w-4"/>Server Resources (Hetzner VPS)</h4>
                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <Label className="flex items-center gap-2"><Cpu className="h-4 w-4"/> CPU Usage</Label>
                            <span className='font-semibold'>45%</span>
                            </div>
                            <Progress value={45} />
                        </div>
                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <Label className="flex items-center gap-2"><HardDrive className="h-4 w-4"/> Memory Usage</Label>
                                <span className='font-semibold'>62%</span>
                            </div>
                            <Progress value={62} />
                        </div>
                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <Label className="flex items-center gap-2"><Disc className="h-4 w-4"/> Disk Usage</Label>
                                <span className='font-semibold'>78%</span>
                            </div>
                            <Progress value={78} />
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><Cloud className="h-4 w-4" />API Usage &amp; Status</h4>
                        <div className="space-y-4 text-sm">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Meta WhatsApp Cloud API</span>
                                    <div className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-500" /> Operational</div>
                                </div>
                                <p className="text-xs text-muted-foreground">Usage this month: 245,789 conversations</p>
                                <Progress value={(245789 / 500000) * 100} />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">Facebook/Instagram API</span>
                                    <div className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4 text-yellow-500" /> Degraded Performance</div>
                                </div>
                                <p className="text-xs text-muted-foreground">Usage this month: 12,345 lookups</p>
                                <Progress value={(12345 / 25000) * 100} />
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><Signal className="h-4 w-4"/>Reliability &amp; Business Impact</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">API Error Rate (24h)</span>
                                <span className="font-bold text-red-400">0.8%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Avg. API Latency</span>
                                <span className="font-bold">120ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Leads Handled (WhatsApp)</span>
                                <span className="font-bold">6,230</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Leads Handled (IG/FB)</span>
                                <span className="font-bold">2,620</span>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => toast({title: "Coming Soon!", description: "Detailed logs will be available here."})}>
                            <History className="mr-2 h-4 w-4"/> View &amp; Export Detailed Logs
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="alerts" className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Alerts</CardTitle>
                    <CardDescription>Important system and client notifications.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Alerts will be displayed here.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
       
       <ClientDetailDialog 
            client={selectedClient} 
            open={!!selectedClient} 
            onOpenChange={(open) => { if(!open) setSelectedClient(null) }}
       />
      
    </div>
  );
}

    