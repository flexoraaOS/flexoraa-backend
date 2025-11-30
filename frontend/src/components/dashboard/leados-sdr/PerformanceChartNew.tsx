
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Clock, MessageSquare, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

interface PerformanceMetric {
  metric: string;
  sdrValue: number;
  teamAvg: number;
  icon: React.ReactNode;
  unit: string;
  lowerIsBetter?: boolean;
}

const usePerformanceMetrics = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceMetrics = async () => {
      if (!user?.id) return;

      try {
        // Get current user's lead data
        const { data: userLeads, error: userLeadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (userLeadsError) throw userLeadsError;

        // Calculate metrics from user's leads
        const totalLeads = userLeads?.length || 0;
        const contactedLeads = userLeads?.filter(lead => lead.contacted).length || 0;
        const contactedPercentage = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

        const closedDeals = userLeads?.filter(lead => lead.closed).length || 0;

        // Calculate reply rate from contact history
        const { data: contactHistory, error: contactHistoryError } = await supabase
          .from('contact_history')
          .select('*')
          .eq('user_id', user.id);

        if (contactHistoryError) throw contactHistoryError;

        const totalSent = contactHistory?.length || 0;
        const repliesReceived = contactHistory?.filter(contact => contact.direction === 'inbound').length || 0;
        const replyRate = totalSent > 0 ? (repliesReceived / totalSent) * 100 : 0;

        // Calculate first response time (in minutes) - this would require actual timing data
        // Using placeholder for now
        const firstResponseTime = 7; // Placeholder value in minutes

        // Set up performance data with real calculations
        const data: PerformanceMetric[] = [
          {
            metric: 'Leads Contacted',
            sdrValue: contactedPercentage,
            teamAvg: contactedPercentage, // Placeholder - would need team data
            icon: <Users className="h-5 w-5 text-primary" />,
            unit: '%',
          },
          {
            metric: 'Avg. First Response Time',
            sdrValue: firstResponseTime,
            teamAvg: firstResponseTime, // Placeholder - would need team data
            icon: <Clock className="h-5 w-5 text-primary" />,
            unit: ' min',
            lowerIsBetter: true,
          },
          {
            metric: 'Reply Rate',
            sdrValue: replyRate,
            teamAvg: replyRate, // Placeholder - would need team data
            icon: <MessageSquare className="h-5 w-5 text-primary" />,
            unit: '%',
          },
          {
            metric: 'Closed Deals',
            sdrValue: closedDeals,
            teamAvg: closedDeals, // Placeholder - would need team data
            icon: <CheckSquare className="h-5 w-5 text-primary" />,
            unit: '',
          },
        ];

        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
        toast.error('Failed to load performance data');
        // Set default values in case of error
        setPerformanceData([
          {
            metric: 'Leads Contacted',
            sdrValue: 0,
            teamAvg: 0,
            icon: <Users className="h-5 w-5 text-primary" />,
            unit: '%',
          },
          {
            metric: 'Avg. First Response Time',
            sdrValue: 0,
            teamAvg: 0,
            icon: <Clock className="h-5 w-5 text-primary" />,
            unit: ' min',
            lowerIsBetter: true,
          },
          {
            metric: 'Reply Rate',
            sdrValue: 0,
            teamAvg: 0,
            icon: <MessageSquare className="h-5 w-5 text-primary" />,
            unit: '%',
          },
          {
            metric: 'Closed Deals',
            sdrValue: 0,
            teamAvg: 0,
            icon: <CheckSquare className="h-5 w-5 text-primary" />,
            unit: '',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceMetrics();
  }, [user?.id]);

  return { performanceData, loading };
};

export function PerformanceChartNew() {
  const { performanceData, loading } = usePerformanceMetrics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
          <CardDescription>Your metrics compared to the team average.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading performance metrics...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Snapshot</CardTitle>
        <CardDescription>Your metrics compared to the team average.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {performanceData.map((item) => (
          <div key={item.metric} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 font-medium">
                    {item.icon}
                    <span>{item.metric}</span>
                </div>
                <div className="font-semibold">
                    <span>{item.sdrValue}{item.unit}</span>
                    <span className="text-muted-foreground text-xs"> / {item.teamAvg}{item.unit} avg</span>
                </div>
            </div>
            <Progress value={(item.sdrValue / Math.max(item.teamAvg, 1)) * 50} className="h-2" />
             <p className={cn("text-xs flex items-center", item.lowerIsBetter ? (item.sdrValue < item.teamAvg ? 'text-green-500' : 'text-red-500') : (item.sdrValue > item.teamAvg ? 'text-green-500' : 'text-red-500'))}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {item.teamAvg > 0 ? ((item.sdrValue - item.teamAvg) / item.teamAvg * 100).toFixed(1) : '0.0'}% vs team average
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
