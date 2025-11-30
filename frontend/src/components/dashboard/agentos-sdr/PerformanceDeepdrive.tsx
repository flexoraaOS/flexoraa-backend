"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

// --- Types ---
export type Metric = { sdr: number; team: number };
export type PerformanceData = {
  conversionRate: Metric;
  showUpRate: Metric;
  takeoverTime: Metric; // lower is better maybe
  fallbackRate: Metric;
  followUpRate: Metric;
};

export type FunnelItem = { name: string; value: number };
export type FunnelData = { sdr: FunnelItem[]; team: FunnelItem[] };

export type Ranking = { rank: number; total: number };

// --- Reusable: PerformanceMetricCard ---
type PerformanceMetricCardProps = {
  title: string;
  sdrValue: number;
  teamValue: number;
  unit?: string;
  lowerIsBetter?: boolean;
  compact?: boolean; // small vs default
};

export const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  sdrValue,
  teamValue,
  unit = "%",
  lowerIsBetter = false,
  compact = false,
}) => {
  const isAboveAverage = lowerIsBetter ? sdrValue < teamValue : sdrValue > teamValue;
  const diff = sdrValue - teamValue;
  const diffPercentage = teamValue > 0 ? (diff / Math.abs(teamValue)) * 100 : 0;

  return (
    <Card>
      <CardHeader className={cn("pb-2", compact ? "px-3 pt-3 pb-2" : "") }>
        <CardTitle className={cn("text-sm font-medium truncate", compact ? "text-xs" : "")}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={compact ? "p-3" : ""}>
        <div className={cn("text-2xl font-bold", compact ? "text-lg" : "")}>{sdrValue}{unit}</div>
        <p className={cn("text-xs text-muted-foreground", compact ? "text-[10px]" : "")}>Team Avg: {teamValue}{unit}</p>
        <div className={cn("text-xs font-semibold flex items-center mt-1", isAboveAverage ? "text-green-500" : "text-red-500") }>
          {isAboveAverage ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
          {diffPercentage.toFixed(1)}% vs team avg
        </div>
      </CardContent>
    </Card>
  );
};

// --- Reusable: FunnelCard (wraps Recharts vertical bar chart) ---
type FunnelCardProps = {
  title?: string;
  description?: string;
  sdrData: FunnelItem[];
  teamData: FunnelItem[];
  height?: number | string;
};

export const FunnelCard: React.FC<FunnelCardProps> = ({ title = "Funnel", description, sdrData, teamData, height = 250 }) => {
  // align sdr and team by index (assumes same ordering/length)
  const data = sdrData.map((item, idx) => ({ name: item.name, you: item.value, team: teamData?.[idx]?.value ?? 0 }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-[250px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)'}}/>
            <Legend />
            <Bar dataKey="you" name="You" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            <Bar dataKey="team" name="Team Avg" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// --- Reusable: RankingCard ---
type RankingCardProps = {
  rank: number;
  total: number;
  subtitle?: string;
};

export const RankingCard: React.FC<RankingCardProps> = ({ rank, total, subtitle }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Ranking</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[250px] space-y-4">
        <div className="relative">
          <Trophy className="h-20 w-20 text-yellow-400" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-4xl font-bold text-yellow-600 mb-5">{rank}</span>
          </div>
        </div>
        <p className="text-lg font-semibold">You are {rank} out of {total} SDRs</p>
        <p className="text-sm text-muted-foreground">Based on overall performance score.</p>
      </CardContent>
    </Card>
  );
};

// Hook to fetch SDR performance data from the database
const useSDRPerformanceData = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!user?.id) return;

      try {
        // Get current SDR's lead data
        const { data: sdrLeads, error: sdrLeadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (sdrLeadsError) throw sdrLeadsError;

        // Get team average performance data
        // This would require a more complex query to calculate team averages across all team members
        // For now, using placeholder data while we develop the full logic
        const sdrConversionRate = sdrLeads && sdrLeads.length > 0
          ? (sdrLeads.filter(lead => lead.stage === 'converted').length / sdrLeads.length) * 100 : 0;
        const sdrShowUpRate = sdrLeads && sdrLeads.length > 0
          ? (sdrLeads.filter(lead => lead.stage === 'booked' && lead.closed).length / sdrLeads.filter(lead => lead.stage === 'booked').length) * 100 : 0;
        const sdrFollowUpRate = sdrLeads && sdrLeads.length > 0
          ? (sdrLeads.filter(lead => lead.followup_date || lead.followup_time).length / sdrLeads.length) * 100 : 0;

        // Get team data by querying all leads for the current user's team
        // This requires team data structure that may need to be implemented
        // For now, we'll calculate based on all leads in the system for this user
        // In a real implementation, we would need to get average performance across all team members
        const teamAvgConversion = sdrConversionRate; // Placeholder
        const teamAvgShowUp = sdrShowUpRate; // Placeholder
        const teamAvgFollowUp = sdrFollowUpRate; // Placeholder

        // Calculate funnel data
        const sdrFunnelSdr = [
          { name: "Leads", value: sdrLeads?.length || 0 },
          { name: "Contacted", value: sdrLeads?.filter(lead => lead.contacted).length || 0 },
          { name: "Qualified", value: sdrLeads?.filter(lead => lead.stage === 'qualified').length || 0 },
          { name: "Meeting", value: sdrLeads?.filter(lead => lead.stage === 'booked').length || 0 },
          { name: "Closed", value: sdrLeads?.filter(lead => lead.closed).length || 0 },
        ];

        // Placeholder team funnel data
        const sdrFunnelTeam = [
          { name: "Leads", value: sdrLeads?.length || 0 },
          { name: "Contacted", value: Math.round((sdrLeads?.length || 0) * 0.85) },
          { name: "Qualified", value: Math.round((sdrLeads?.filter(lead => lead.contacted).length || 0) * 0.45) },
          { name: "Meeting", value: Math.round((sdrLeads?.filter(lead => lead.stage === 'qualified').length || 0) * 0.35) },
          { name: "Closed", value: Math.round((sdrLeads?.filter(lead => lead.stage === 'qualified').length || 0) * 0.25) },
        ];

        // Calculate ranking (simplified version)
        // In a real implementation, we would need to implement complex queries to calculate rankings
        // This would involve getting performance metrics for all team members and comparing
        const rankingResult: Ranking = { rank: 1, total: 1 }; // Placeholder

        setPerformanceData({
          conversionRate: { sdr: sdrConversionRate, team: teamAvgConversion },
          showUpRate: { sdr: sdrShowUpRate, team: teamAvgShowUp },
          takeoverTime: { sdr: 5, team: 7 }, // Placeholder
          fallbackRate: { sdr: 10, team: 15 }, // Placeholder
          followUpRate: { sdr: sdrFollowUpRate, team: teamAvgFollowUp },
        });

        setFunnelData({
          sdr: sdrFunnelSdr,
          team: sdrFunnelTeam,
        });

        setRanking(rankingResult);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast.error('Failed to load performance data');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user?.id]);

  return { performanceData, funnelData, ranking, loading };
};

// --- Top-level: PerformanceDeepDive (composes smaller containers) ---
type PerformanceDeepDiveProps = {
  compact?: boolean; // pass down to metric cards to save space
};

const PerformanceDeepDive: React.FC<PerformanceDeepDiveProps> = ({ compact = false }) => {
  const { performanceData, funnelData, ranking, loading } = useSDRPerformanceData();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Deep Dive</CardTitle>
          <CardDescription>Loading your performance data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading performance metrics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceData || !funnelData || !ranking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Deep Dive</CardTitle>
          <CardDescription>Your performance benchmarked against the team average.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Deep Dive</CardTitle>
        <CardDescription>Your performance benchmarked against the team average.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Metrics grid - broken into its own container */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <PerformanceMetricCard title="SDR-Driven Conversion" sdrValue={performanceData.conversionRate.sdr} teamValue={performanceData.conversionRate.team} unit="%" lowerIsBetter={false} compact={compact} />

          <PerformanceMetricCard title="AI-Booked Show-up Rate" sdrValue={performanceData.showUpRate.sdr} teamValue={performanceData.showUpRate.team} unit="%" compact={compact} />

          <PerformanceMetricCard title="Avg Takeover Time" sdrValue={performanceData.takeoverTime.sdr} teamValue={performanceData.takeoverTime.team} unit=" mins" lowerIsBetter compact={compact} />

          <PerformanceMetricCard title="AI Fallback Handling Rate" sdrValue={performanceData.fallbackRate.sdr} teamValue={performanceData.fallbackRate.team} unit="%" compact={compact} />

          <PerformanceMetricCard title="Follow-up Completion" sdrValue={performanceData.followUpRate.sdr} teamValue={performanceData.followUpRate.team} unit="%" compact={compact} />
        </div>

        {/* Lower section split into two cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelCard title="Your Funnel vs. Team Average" description="Side-by-side comparison of conversion rates at each stage." sdrData={funnelData.sdr} teamData={funnelData.team} />

          <RankingCard rank={ranking.rank} total={ranking.total} subtitle="Your current position on the team leaderboard." />
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceDeepDive;

// --- Mock data + example component for quick copy/paste usage ---
export const mockPerformanceData: PerformanceData = {
  conversionRate: { sdr: 45, team: 38 },
  showUpRate: { sdr: 78, team: 72 },
  takeoverTime: { sdr: 3, team: 5 },
  fallbackRate: { sdr: 6, team: 9 },
  followUpRate: { sdr: 82, team: 75 },
};

export const mockFunnelData: FunnelData = {
  sdr: [
    { name: "Leads", value: 100 },
    { name: "Contacted", value: 80 },
    { name: "Qualified", value: 45 },
    { name: "Meeting", value: 20 },
    { name: "Closed", value: 9 },
  ],
  team: [
    { name: "Leads", value: 120 },
    { name: "Contacted", value: 90 },
    { name: "Qualified", value: 40 },
    { name: "Meeting", value: 22 },
    { name: "Closed", value: 8 },
  ],
};

export const mockRanking: Ranking = { rank: 3, total: 10 };

export const ExampleUsage: React.FC = () => (
  <div className="p-4">
    <PerformanceDeepDive compact={false} />
  </div>
);
