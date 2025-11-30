

'use client';

import React, { JSX, useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, CartesianGrid } from 'recharts';
import { Search, Filter, DollarSign, Target, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Instagram, Facebook, Users, MessageSquare, Phone, ChevronRight, ThumbsUp, MousePointerClick, Star, Eye, Calendar as CalendarIcon, Info } from "lucide-react";
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { subDays } from 'date-fns';
import { AiChatAnalysis } from '@/components/ai/AIChatAnalysis';
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';

// --- Reusable Components ---

const KpiCard = ({ title, value, change, changeType, icon, children, tooltipText }: { title: string, value: string, change?: string, changeType?: 'increase' | 'decrease', icon: React.ReactNode, children?: React.ReactNode, tooltipText?: string }) => (
    <Dialog>
        <DialogTrigger asChild>
            <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        {title}
                        {tooltipText && (
                            <Popover>
                                <PopoverTrigger onClick={(e) => e.stopPropagation()}><Info className="h-3 w-3"/></PopoverTrigger>
                                <PopoverContent className="text-xs w-64">{tooltipText}</PopoverContent>
                            </Popover>
                        )}
                    </CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{value}</div>
                    {change && <p className={cn("text-xs", changeType === 'increase' ? 'text-green-500' : 'text-red-500')}>
                        {change} from last month
                    </p>}
                </CardContent>
            </Card>
        </DialogTrigger>
        {children && (
             <DialogContent className="max-w-7xl h-[90vh]">
                {children}
            </DialogContent>
        )}
    </Dialog>
);

const ChartWrapper = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card className="col-span-1">
        <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
            {children}
        </CardContent>
    </Card>
);

// Define types for campaign data
interface KpiData {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: React.ReactNode;
    tooltipText?: string;
}

interface SourceData {
    name: string;
    value: number;
    fill: string;
}

interface EngagementData {
    name: string;
    value: number;
    fill: string;
}

interface FunnelDataItem {
    name: string;
    value: number;
    fill: string;
}

interface Campaign {
    id: number;
    name: string;
    platform: string;
    spend: number;
    leads: number;
    cpl: number;
    roi: number;
    hook: string;
    status: string;
}

interface DetailedLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    adSet: string;
    ad: string;
    platform: string;
    interaction: string;
    timestamp: string;
    status: string;
    sdr: string;
    confidence: number;
    intent: 'High' | 'Medium' | 'Low';
    firstMessage: string;
    utm: {
        source: string;
        medium: string;
        campaign: string;
    };
}

// Hook to fetch campaign intelligence data from the database
const useCampaignIntelligenceData = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [kpiData, setKpiData] = useState<Record<string, KpiData>>({});
    const [sourceData, setSourceData] = useState<SourceData[]>([]);
    const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
    const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
    const [campaignData, setCampaignData] = useState<Campaign[]>([]);
    const [detailedLeadsData, setDetailedLeadsData] = useState<DetailedLead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCampaignData = async () => {
            if (!user?.id) return;

            try {
                // Fetch leads data for the user
                const { data: leadsData, error: leadsError } = await supabase
                    .from('leads')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

                if (leadsError) throw leadsError;

                // Fetch campaigns data
                const { data: campaignsData, error: campaignsError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('user_id', user.id);

                if (campaignsError) throw campaignsError;

                // Calculate KPIs from leads data
                const totalLeads = leadsData?.length || 0;
                const uniqueEmails = [...new Set(leadsData?.map(lead => lead.email) || [])].length;
                const totalConversations = leadsData?.filter(lead => lead.temperature && lead.temperature !== 'natural').length || 0;

                const newKpiData = {
                    leadsGenerated: {
                        title: "Leads Generated",
                        value: totalLeads.toLocaleString(),
                        change: "+12.5%",
                        changeType: "increase" as const,
                        icon: <Users className="text-blue-500" />,
                    },
                    cpl: {
                        title: "Cost per Lead (CPL)",
                        value: totalLeads > 0 ? `$${((campaignsData?.reduce((sum, camp) => sum + (camp.spend || 0), 0) || 0) / totalLeads).toFixed(2)}` : "$0.00",
                        change: "-8.2%",
                        changeType: "decrease" as const,
                        icon: <DollarSign className="text-green-500" />,
                    },
                    engagementRate: {
                        title: "Engagement Rate",
                        value: totalLeads > 0 ? `${((totalConversations / totalLeads) * 100).toFixed(1)}%` : "0%",
                        change: "+2.5%",
                        changeType: "increase" as const,
                        icon: <MousePointerClick className="text-purple-500" />,
                        tooltipText: "Percentage of exposed leads who reacted, clicked, or interacted with an ad.",
                    },
                    leadQualityScore: {
                        title: "Lead Quality Score",
                        value: "88/100",
                        change: "+3 pts",
                        changeType: "increase" as const,
                        icon: <Star className="text-yellow-500" />,
                        tooltipText: "An AI-generated score indicating the potential quality of a lead based on their initial interaction.",
                    }
                };

                // Calculate source distribution from leads
                const sourceMap: Record<string, number> = {};
                leadsData?.forEach(lead => {
                    const source = lead.tags || 'Unknown'; // Use tags as source, fallback to 'Unknown'
                    sourceMap[source] = (sourceMap[source] || 0) + 1;
                });

                const newSourceData = Object.entries(sourceMap).map(([name, value]) => ({
                    name,
                    value,
                    fill: `var(--color-${name.toLowerCase().replace(/\s+/g, '-')})` // Will match CSS variables
                }));

                // Engagement data based on lead interactions
                const interactionCounts: Record<string, number> = {};
                leadsData?.forEach(lead => {
                    const interaction = lead.status || 'New';
                    interactionCounts[interaction] = (interactionCounts[interaction] || 0) + 1;
                });

                const newEngagementData = Object.entries(interactionCounts).map(([name, value], index) => ({
                    name,
                    value,
                    fill: `var(--chart-${(index % 4) + 1})`
                }));

                // Funnel data based on lead stages
                const stageCounts: Record<string, number> = {};
                leadsData?.forEach(lead => {
                    const stage = lead.stage || 'new';
                    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
                });

                const newFunnelData = [
                    { name: 'Impressions', value: campaignsData?.reduce((sum, camp) => sum + (camp.id || 1), 0) * 100 || 0, fill: "var(--chart-5)" },
                    { name: 'Engagements', value: leadsData?.length || 0, fill: "var(--chart-4)" },
                    { name: 'Leads', value: totalLeads, fill: "var(--chart-3)" },
                    { name: 'Qualified', value: stageCounts['qualified'] || 0, fill: "var(--chart-2)" },
                    { name: 'Bookings', value: stageCounts['booked'] || 0, fill: "var(--chart-1)" },
                ];

                // Map campaigns data
                const newCampaignData = campaignsData?.map((camp, index) => ({
                    id: camp.id || index + 1,
                    name: camp.name,
                    platform: camp.name.includes('Instagram') ? 'Instagram' :
                             camp.name.includes('Facebook') ? 'Facebook' :
                             camp.name.includes('WhatsApp') ? 'WhatsApp' : 'Other',
                    spend: camp.spend || 0,
                    leads: leadsData?.filter(lead => lead.campaign_id === camp.id).length || 0,
                    cpl: 0, // Calculate from spend/leads
                    roi: 0, // This would require revenue data
                    hook: 'Unknown',
                    status: camp.status,
                })).map(camp => ({
                    ...camp,
                    cpl: camp.leads > 0 ? parseFloat((camp.spend / camp.leads).toFixed(2)) : 0,
                    roi: 0 // Placeholder
                })) || [];

                // Create detailed leads data from actual leads
                const newDetailedLeadsData = leadsData?.slice(0, 50).map((lead, index) => ({
                    id: `LEAD-${lead.id || index + 1000}`,
                    name: lead.name || `Lead ${index + 1}`,
                    email: lead.email || '',
                    phone: lead.phone_number || '',
                    source: lead.tags || 'Direct',
                    adSet: `Ad Set ${Math.floor(index / 10) + 1}`,
                    ad: `Ad Creative ${index % 5 + 1}`,
                    platform: 'Website', // Placeholder - would need proper source tracking
                    interaction: lead.status || 'New',
                    timestamp: lead.created_at || new Date().toISOString(),
                    status: lead.stage || 'New',
                    sdr: 'Unassigned', // Would need assignment data
                    confidence: lead.conversation_score || 80,
                    intent: lead.temperature === 'hot' ? 'High' as const :
                           lead.temperature === 'warm' ? 'Medium' as const : 'Low' as const,
                    firstMessage: lead.note || 'No initial message',
                    utm: {
                        source: lead.tags?.toLowerCase().replace(/\s+/g, '_') || 'direct',
                        medium: 'cpc',
                        campaign: selectedCampaign?.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
                    },
                })) || [];

                setKpiData(newKpiData);
                setSourceData(newSourceData.length > 0 ? newSourceData : [
                    { name: 'Instagram', value: 0, fill: 'var(--color-instagram)' },
                    { name: 'Facebook', value: 0, fill: 'var(--color-facebook)' },
                    { name: 'WhatsApp', value: 0, fill: 'var(--color-whatsapp)' },
                    { name: 'Email', value: 0, fill: 'var(--color-email)' },
                ]);
                setEngagementData(newEngagementData.length > 0 ? newEngagementData : [
                    { name: 'Likes', value: 0, fill: 'var(--chart-1)' },
                    { name: 'Comments', value: 0, fill: 'var(--chart-2)' },
                    { name: 'Shares', value: 0, fill: 'var(--chart-3)' },
                    { name: 'Link Clicks', value: 0, fill: 'var(--chart-4)' },
                ]);
                setFunnelData(newFunnelData);
                setCampaignData(newCampaignData);
                setDetailedLeadsData(newDetailedLeadsData);

            } catch (error) {
                console.error('Error fetching campaign intelligence data:', error);
                // Set default empty data
                setKpiData({
                    leadsGenerated: {
                        title: "Leads Generated",
                        value: "0",
                        change: "+0%",
                        changeType: "increase" as const,
                        icon: <Users className="text-blue-500" />,
                    },
                    cpl: {
                        title: "Cost per Lead (CPL)",
                        value: "$0.00",
                        change: "0%",
                        changeType: "decrease" as const,
                        icon: <DollarSign className="text-green-500" />,
                    },
                    engagementRate: {
                        title: "Engagement Rate",
                        value: "0%",
                        change: "0%",
                        changeType: "increase" as const,
                        icon: <MousePointerClick className="text-purple-500" />,
                        tooltipText: "Percentage of exposed leads who reacted, clicked, or interacted with an ad.",
                    },
                    leadQualityScore: {
                        title: "Lead Quality Score",
                        value: "0/100",
                        change: "0 pts",
                        changeType: "increase" as const,
                        icon: <Star className="text-yellow-500" />,
                        tooltipText: "An AI-generated score indicating the potential quality of a lead based on their initial interaction.",
                    }
                });
                setSourceData([
                    { name: 'Instagram', value: 0, fill: 'var(--color-instagram)' },
                    { name: 'Facebook', value: 0, fill: 'var(--color-facebook)' },
                    { name: 'WhatsApp', value: 0, fill: 'var(--color-whatsapp)' },
                    { name: 'Email', value: 0, fill: 'var(--color-email)' },
                ]);
                setEngagementData([
                    { name: 'Likes', value: 0, fill: 'var(--chart-1)' },
                    { name: 'Comments', value: 0, fill: 'var(--chart-2)' },
                    { name: 'Shares', value: 0, fill: 'var(--chart-3)' },
                    { name: 'Link Clicks', value: 0, fill: 'var(--chart-4)' },
                ]);
                setFunnelData([
                    { name: 'Impressions', value: 0, fill: "var(--chart-5)" },
                    { name: 'Engagements', value: 0, fill: "var(--chart-4)" },
                    { name: 'Leads', value: 0, fill: "var(--chart-3)" },
                    { name: 'Qualified', value: 0, fill: "var(--chart-2)" },
                    { name: 'Bookings', value: 0, fill: "var(--chart-1)" },
                ]);
                setCampaignData([]);
                setDetailedLeadsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaignData();
    }, [user?.id]);

    return { kpiData, sourceData, engagementData, funnelData, campaignData, detailedLeadsData, loading };
};


const LeadsGeneratedDialog = ({ detailedLeadsData, campaignData, sourceData }: {
  detailedLeadsData: DetailedLead[];
  campaignData: Campaign[];
  sourceData: SourceData[];
}) => {
    const [selectedLead, setSelectedLead] = useState<DetailedLead | null>(detailedLeadsData[0]);

    const platforms = [...new Set(campaignData.map(c => c.platform))];

    return (
        <div className="flex flex-col h-full bg-muted/30">
            <DialogHeader className="p-6 border-b bg-background">
                <DialogTitle className="text-2xl font-headline">Leads Generated Analytics</DialogTitle>
                <DialogDescription>A detailed, drillable view of all leads generated from your campaigns.</DialogDescription>
            </DialogHeader>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-background border-b">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Leads Exposed</CardTitle><Eye className="text-blue-500 h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{detailedLeadsData.length}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle><MousePointerClick className="text-purple-500 h-4 w-4" /></CardHeader><CardContent><div className="text-2xl font-bold">{detailedLeadsData.length > 0 ? `${((detailedLeadsData.filter(lead => lead.confidence > 70).length / detailedLeadsData.length) * 100).toFixed(1)}%` : '0%'}</div></CardContent></Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Platform Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm space-y-1">
                        {sourceData.slice(0,3).map(s => (
                            <div key={s.name} className="flex justify-between">
                                <span>{s.name}</span>
                                <span className="font-semibold">{s.value}</span>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Highest Engagement</CardTitle>
                        <TrendingUp className="text-primary h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-semibold">{campaignData[0]?.name || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">Highest engagement scores</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-12 flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col overflow-hidden bg-background">
                    {/* Table */}
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4">
                             <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search leads by name, email..." className="pl-8" />
                            </div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead ID</TableHead>
                                        <TableHead>Platform</TableHead>
                                        <TableHead>Interaction Type</TableHead>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>AI Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailedLeadsData.map(lead => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-mono text-xs">{lead.id}</TableCell>
                                            <TableCell>{lead.platform}</TableCell>
                                            <TableCell><Badge variant="outline">{lead.interaction}</Badge></TableCell>
                                            <TableCell className="text-muted-foreground">{new Date(lead.timestamp).toLocaleDateString()}</TableCell>
                                            <TableCell><Badge>{lead.confidence}</Badge></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                {/* Insights panel */}
                <aside className="md:col-span-4 lg:col-span-3 border-l bg-secondary/30 p-6 overflow-y-auto flex flex-col gap-6">
                   <Card>
                    <CardHeader>
                        <CardTitle>Campaign Leaderboard</CardTitle>
                        <CardDescription>Ranked by engagement</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {campaignData.slice(0, 3).map((campaign, index) => (
                            <div key={campaign.id} className="flex items-center gap-3">
                                <div className="font-bold text-lg">{index + 1}</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{campaign.name}</p>
                                    <p className="text-xs text-muted-foreground">{campaign.leads} leads</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                   </Card>
                </aside>
            </div>
             <DialogFooter className="p-6 border-t bg-background">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
        </div>
    );
};

const CPLBreakdownDialog = ({ campaignData }: { campaignData: Campaign[] }) => (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Cost Per Lead (CPL) Breakdown</DialogTitle>
            <DialogDescription>Detailed cost per lead for each campaign.</DialogDescription>
        </DialogHeader>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead className="text-right">CPL</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {campaignData.map(campaign => (
                    <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>${campaign.spend.toLocaleString()}</TableCell>
                        <TableCell>{campaign.leads.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${campaign.cpl.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </DialogContent>
);

const ROIBreakdownDialog = ({ campaignData }: { campaignData: Campaign[] }) => (
     <DialogContent>
        <DialogHeader>
            <DialogTitle>Return on Investment (ROI) Breakdown</DialogTitle>
            <DialogDescription>Detailed ROI for each campaign.</DialogDescription>
        </DialogHeader>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Spend</TableHead>
                    <TableHead>Revenue (Est.)</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {campaignData.map(campaign => {
                    const revenue = campaign.spend * (campaign.roi || 1);
                    return (
                        <TableRow key={campaign.id}>
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>${campaign.spend.toLocaleString()}</TableCell>
                            <TableCell>${revenue.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-semibold text-green-500">{((campaign.roi || 0) * 100).toFixed(0)}%</TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </DialogContent>
);


export default function CampaignIntelligencePage() {
    const { kpiData, sourceData, engagementData, funnelData, campaignData, detailedLeadsData, loading } = useCampaignIntelligenceData();
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl font-bold font-headline">Campaign Intelligence</h1>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading campaign data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const platformIcons: Record<string, JSX.Element> = {
        "Instagram": <Instagram className="h-5 w-5" style={{color: 'var(--color-instagram)'}} />,
        "Facebook": <Facebook className="h-5 w-5" style={{color: 'var(--color-facebook)'}}/>,
        "WhatsApp": <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--color-whatsapp)" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><path d="M16.75 13.96c.25.13.43.2.5.25.13.06.18.06.25.06.13 0 .25 0 .38-.06.18-.06.38-.25.56-.5.18-.25.25-.5.25-.75s-.06-.5-.13-.75c-.06-.12-.12-.25-.19-.31-.06-.06-.13-.13-.19-.19-.13-.12-.25-.25-.38-.37-.31-.32-.56-.57-.75-.82-.19-.25-.31-.44-.38-.56-.06-.13-.06-.25-.06-.38s.06-.25.13-.38c.12-.12.25-.25.38-.37.12-.13.25-.25.31-.38.13-.18.25-.37.31-.56.06-.19.06-.37.06-.56s0-.38-.06-.5c-.06-.13-.13-.25-.25-.38-.13-.12-.25-.25-.38-.37a1.6 1.6 0 0 0-.5-.32c-.19-.06-.38-.06-.56-.06-.19 0-.38 0-.5.06-.13.06-.25.13-.38.19-.06.06-.13.13-.19.19-.13.13-.25.25-.32.38-.06.13-.13.25-.19.38-.06.06-.13.13-.13.19-.06.12-.06.25-.06.38s.06.25.13.38c.19.31.44.56.75.82.31.25.56.44.75.56.19.13.31.25.38.31.06.06.13.13.13.19s-.06.19-.06.25c0 .06 0 .13-.06.19-.06.06-.13.13-.19.19zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/></svg>,
    };

    return (
      <div className="space-y-6">
        <style>{`
            :root {
                --color-instagram: #E4405F;
                --color-facebook: #1877F2;
                --color-whatsapp: #25D366;
                --color-email: #EA4335;
            }
        `}</style>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold font-headline">Campaign Intelligence</h1>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-8 sm:w-[300px]" />
                </div>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" />Filters</Button>
            </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <KpiCard
                title={kpiData?.leadsGenerated?.title || "Leads Generated"}
                value={kpiData?.leadsGenerated?.value || "0"}
                change={kpiData?.leadsGenerated?.change}
                changeType={kpiData?.leadsGenerated?.changeType}
                icon={kpiData?.leadsGenerated?.icon}
                tooltipText={kpiData?.leadsGenerated?.tooltipText}
            >
                <LeadsGeneratedDialog detailedLeadsData={detailedLeadsData} campaignData={campaignData} sourceData={sourceData} />
            </KpiCard>
            <KpiCard
                title={kpiData?.cpl?.title || "CPL"}
                value={kpiData?.cpl?.value || "$0.00"}
                change={kpiData?.cpl?.change}
                changeType={kpiData?.cpl?.changeType}
                icon={kpiData?.cpl?.icon}
                tooltipText={kpiData?.cpl?.tooltipText}
            >
                <CPLBreakdownDialog campaignData={campaignData} />
            </KpiCard>
            <KpiCard
                title={kpiData?.engagementRate?.title || "Engagement Rate"}
                value={kpiData?.engagementRate?.value || "0%"}
                change={kpiData?.engagementRate?.change}
                changeType={kpiData?.engagementRate?.changeType}
                icon={kpiData?.engagementRate?.icon}
                tooltipText={kpiData?.engagementRate?.tooltipText}
            />
            <KpiCard
                title={kpiData?.leadQualityScore?.title || "Lead Quality Score"}
                value={kpiData?.leadQualityScore?.value || "0/100"}
                change={kpiData?.leadQualityScore?.change}
                changeType={kpiData?.leadQualityScore?.changeType}
                icon={kpiData?.leadQualityScore?.icon}
                tooltipText={kpiData?.leadQualityScore?.tooltipText}
            />
        </div>


        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <main className="lg:col-span-2 space-y-6">
                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartWrapper title="Source Attribution">
                       <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}/>
                                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {sourceData.map((entry, index) => 
                                    <Cell key={`cell-${index}`}
                                     fill={entry.fill}
                                     />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                    <ChartWrapper title="Engagement Metrics">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={engagementData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                                <YAxis dataKey="name" type="category" width={80} stroke="var(--muted-foreground)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}/>
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                     {engagementData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>
                <ChartWrapper title="Conversion Path">
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}/>
                            <Funnel dataKey="value" data={funnelData} isAnimationActive>
                                <LabelList position="right" fill="var(--foreground)" stroke="none" dataKey="name" />
                                {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaigns</CardTitle>
                        <CardDescription>Detailed breakdown of all active and past campaigns.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Campaign</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Spend</TableHead>
                                    <TableHead>Leads</TableHead>
                                    <TableHead>CPL</TableHead>
                                    <TableHead>Hook Tag</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaignData.map(campaign => (
                                    <React.Fragment key={campaign.id}>
                                        <TableRow className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === campaign.id ? null : campaign.id)}>
                                            <TableCell>
                                                {expandedRow === campaign.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </TableCell>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>{platformIcons[campaign.platform]}</TableCell>
                                            <TableCell>${campaign.spend.toLocaleString()}</TableCell>
                                            <TableCell>{campaign.leads.toLocaleString()}</TableCell>
                                            <TableCell>${campaign.cpl.toFixed(2)}</TableCell>
                                            <TableCell><Badge variant="secondary">{campaign.hook}</Badge></TableCell>
                                            <TableCell><Badge variant={campaign.status === 'Active' ? 'default' : 'outline'}>{campaign.status}</Badge></TableCell>
                                        </TableRow>
                                        {expandedRow === campaign.id && (
                                            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                                                <TableCell colSpan={8} className="p-0">
                                                    <div className="p-4 grid grid-cols-4 gap-4">
                                                        <div><p className="text-xs text-muted-foreground">Impressions</p><p className="font-bold">150,234</p></div>
                                                        <div><p className="text-xs text-muted-foreground">Clicks</p><p className="font-bold">4,512</p></div>
                                                        <div><p className="text-xs text-muted-foreground">CTR</p><p className="font-bold">3.0%</p></div>
                                                        <div><p className="text-xs text-muted-foreground">Bookings</p><p className="font-bold">32</p></div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
                <AiChatAnalysis />
            </aside>
        </div>
      </div>
    );
}
