"use client"

import { AppointmentsDialog } from '@/components/dashboard/AppointmentsDialog'
import { LeadStageDatum, useDashboardData } from '@/lib/hooks/useDashboardData';
import { DashboardStat } from '@/lib/types/dashboard';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import React, { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { getDashboardStats } from '@/components/data/statCardData';
import { fetchLeads } from '@/lib/features/leadsSlice';
import { useAppDispatch } from '@/lib/hooks';
import CampaignSummary from '@/components/dashboard/CampaignSummery';
import { LeadStageChart } from '@/components/dashboard/LeadStage';
import { LeadFunnel } from '@/components/dashboard/LeadFunnel';
import { Avatar, AvatarFallback } from '@radix-ui/react-avatar';
import { Progress } from '@radix-ui/react-progress';
import { AiChatAnalysis } from '@/components/ai/AIChatAnalysis';
import AgentosDashboardHeader from '@/components/dashboard/AgentosDashboardHeader';

function AgentosPage() {
    const defaultFrom = subDays(new Date(), 29);
    const defaultTo = new Date();
    const [statsLoading, setStatsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStat[]>([]);
    const dispatch = useAppDispatch();
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: defaultFrom,
        to: defaultTo,
    });

    const initialRange = {
        from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };
    const { data, loading, error } = useDashboardData(initialRange);

    const dummyLeadStageData: LeadStageDatum[] = [
        { stage: "Facebook", count: 120 },
        { stage: "WhatsApp", count: 200 },
        { stage: "Instagram", count: 150 },
        { stage: "Gmail", count: 300 },
    ];
    const AgentPerformanceItem = ({ name, avatar, conversations, resolutionRate }: { name: string, avatar: string, conversations: number, resolutionRate: number }) => {
        return (
            <div className="flex items-center gap-4 group">
                <Avatar className="h-12 w-12 transition-transform duration-300 group-hover:scale-110">
                    <AvatarFallback className="bg-secondary text-2xl group-hover:bg-background">{avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">{conversations.toLocaleString()} conversations</p>
                </div>
                <div className="text-right w-20">
                    <p className="font-bold text-foreground">{resolutionRate}%</p>
                    <Progress value={resolutionRate} className="h-1.5 mt-1" />
                </div>
            </div>
        )
    }

    useEffect(() => {
        async function loadStats() {
            try {
                const fetchedStats = await getDashboardStats();
                setStats(fetchedStats);
                dispatch(fetchLeads({ limit: 6 }))
            } catch (error) {
                console.error("Failed to load dashboard stats:", error);
            } finally {
                setStatsLoading(false);
            }
        }
        loadStats();
    }, []);
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
                <div>
                    <AgentosDashboardHeader title='AgentOS'>
                        <AppointmentsDialog appointments={(data?.appointments || []) as any} />
                    </AgentosDashboardHeader>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statsLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-[125px] w-full" />
                        ))
                    ) : (
                        stats.map((stat, i) => (
                            <StatsCard key={i} {...stat} />
                        ))
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <CampaignSummary
                        isSelector={false}
                        title="Response Volume"
                        description='Total messages received vs. replied.'
                        campaignData={data?.campaigns || []}
                        loading={loading}
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                    />

                    <LeadStageChart
                        title='Conversation Volume by Channel'
                        description='Total conversations from each source.'
                    />
                </div>
                <div className="grid grid-cols-5 pt-7 gap-7 max-h-[200px]">
                    <div className="col-span-3">
                        <AiChatAnalysis />
                    </div>
                    <div className="col-span-2">
                        <LeadFunnel  />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AgentosPage;