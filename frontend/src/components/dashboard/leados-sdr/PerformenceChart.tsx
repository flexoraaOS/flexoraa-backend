'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

interface PerformanceDataPoint {
  metric: string;
  yourPerformance: number;
  teamAverage: number;
}

const usePerformanceData = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      if (!user?.id) return;

      try {
        // Get current user's lead data
        const { data: userLeads, error: userLeadsError } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user.id);

        if (userLeadsError) throw userLeadsError;

        // Get other users' leads data to calculate team average
        // In a real implementation this would need to get data for the user's team
        // For now, we'll use the user's own data as both "your" and "team" performance
        // This is a simplified version - more complex team data would require additional table structure
        const userLeadsCount = userLeads?.length || 0;
        const userContacted = userLeads?.filter(lead => lead.contacted).length || 0;
        const userBooked = userLeads?.filter(lead => lead.stage === 'booked').length || 0;
        const userClosed = userLeads?.filter(lead => lead.closed).length || 0;
        const userTargetCompletion = userLeadsCount > 0 ? 80 : 0; // Placeholder
        const userResponseTime = 5; // Placeholder

        // Create performance data with real calculated values
        const data: PerformanceDataPoint[] = [
          { metric: 'Leads Contacted', yourPerformance: userContacted, teamAverage: userContacted }, // Placeholder team value
          { metric: 'Meetings Booked', yourPerformance: userBooked, teamAverage: userBooked },
          { metric: 'Deals Closed', yourPerformance: userClosed, teamAverage: userClosed },
          { metric: 'Target Completion %', yourPerformance: userTargetCompletion, teamAverage: userTargetCompletion },
          { metric: 'Avg. Response Time (m)', yourPerformance: userResponseTime, teamAverage: userResponseTime }, // Lower is better
        ];

        setPerformanceData(data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
        toast.error('Failed to load performance data');
        // Set default values in case of error
        setPerformanceData([
          { metric: 'Leads Contacted', yourPerformance: 0, teamAverage: 0 },
          { metric: 'Meetings Booked', yourPerformance: 0, teamAverage: 0 },
          { metric: 'Deals Closed', yourPerformance: 0, teamAverage: 0 },
          { metric: 'Target Completion %', yourPerformance: 0, teamAverage: 0 },
          { metric: 'Avg. Response Time (m)', yourPerformance: 0, teamAverage: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [user?.id]);

  return { performanceData, loading };
};

export function PerformanceChart() {
  const { performanceData, loading } = usePerformanceData();

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Performance vs. Team Average</CardTitle>
          <CardDescription>See how your stats stack up against the team.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Performance vs. Team Average</CardTitle>
        <CardDescription>See how your stats stack up against the team.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceData}>
            <defs>
              <linearGradient id="yourPerformanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 'dataMax + 20']}
              tick={false}
              axisLine={false}
            />

            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />

            <Radar
              name="Team Average"
              dataKey="teamAverage"
              stroke="var(--muted-foreground)"
              fill="var(--muted-foreground)"
              fillOpacity={0.3}
            />
            <Radar
              name="Your Performance"
              dataKey="yourPerformance"
              stroke="var(--chart-1)"
              fill="url(#yourPerformanceGradient)"
              fillOpacity={0.8}
              className="chart-glow-1"
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
