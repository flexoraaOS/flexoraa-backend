'use client';
import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { LeadStageChart } from '@/components/dashboard/LeadStage';
import { LeadFunnel } from '@/components/dashboard/LeadFunnel';
import { RevenueForecast } from '@/components/dashboard/RevenueForecast';
import { AppointmentsDialog } from '@/components/dashboard/AppointmentsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import CampaignSummary from '@/components/dashboard/CampaignSummery';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import SdrLeaderboard from '@/components/dashboard/leados-sdr/SdrLeaderboard';
import { DashboardStat } from '@/lib/types/dashboard';
import { DollarSign, Inbox, Users, Zap } from 'lucide-react';

export default function LeadOSDashboardPage() {
  const defaultFrom = subDays(new Date(), 29);
  const defaultTo = new Date();
  const leads = useAppSelector(selectLeads)
  const leadsLoading = useAppSelector(selectLeadsLoading)
  const leadsError = useAppSelector(selectLeadsError)
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(fetchLeads({ limit: 6 }))
  }, [dispatch]);

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: defaultFrom,
    to: defaultTo,
  });

  const [viewMode, setViewMode] = React.useState<'verified' | 'hotLeads' | 'pendingLeads'>('verified');

  const initialRange = {
    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };
  const { data, loading, error } = useDashboardData(initialRange);

  const stats: DashboardStat[] = React.useMemo(() => {
    if (!data) return [];
    const totals = {
      uploaded: 0,
      verified: 0,
      hotLeads: 0,
      appointments: 0,
    };
    for (const p of data.campaigns) {
      totals.uploaded += p.uploaded;
      totals.verified += p.verified;
      totals.hotLeads += p.hotLeads;
    }
    totals.appointments = data.appointments.length;
    return [
      { title: "Leads Uploaded", value: totals.uploaded.toString(), href: '/dashboard/uploaded-leads', icon: Inbox, description: "Total leads uploaded in the period" },
      { title: "Leads Verified", value: totals.verified.toString(), href: '/dashboard/verified-leads', icon: Zap, description: "Total leads successfully verified" },
      { title: "Hot Leads", value: totals.hotLeads.toString(), href: '/dashboard/hot-leads', icon: Users, description: "Number of leads marked as 'hot'" },
      { title: "Appointments", value: totals.appointments.toString(), href: '/dashboard/appointments', icon: DollarSign, description: "Total appointments booked" },
    ];
  }, [data]);

  const funnelData = (data?.stages ?? [])
    .filter(s => ["Hot", "Warm", "Cold"].includes(s.stage))
    .map(s => ({
      temperature: s.stage,
      leads: s.count,
      fill:
        s.stage === "Hot"
          ? "var(--chart-1)"
          : s.stage === "Warm"
            ? "var(--chart-2)"
            : "var(--chart-3)",
    }));


  return (
    <div className="space-y-8">
      <div>
        <DashboardHeader title='LeadOS'>
          <AppointmentsDialog appointments={data?.appointments.map(a => ({ date: new Date(a.start_time), time: new Date(a.start_time).toLocaleTimeString(), leadId: a.lead_id, with: '', conversation: '' })) || []} />
        </DashboardHeader>
      </div>
      <div className='flex items-center justify-center'>

      </div>

      {/* leads stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
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
          title='Campaign Summary'
          description='Uploaded leads vs. outcomes.'

          campaignData={data?.campaigns.map(c => ({...c, date: c.name, qualifiedLeads: 0, start_date: '', end_date: ''})) || []}
          loading={loading}
          dateRange={dateRange}
          setDateRange={setDateRange}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <LeadStageChart
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LeadFunnel />

        <SdrLeaderboard />

      </div>

      <div className="w-full ">
        <RevenueForecast />
      </div>
    </div>
  );
}