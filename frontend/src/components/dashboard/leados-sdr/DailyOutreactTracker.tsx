
'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    ResponsiveContainer,
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

// Define the data type for daily outreach
interface DailyOutreachData {
    day: string;
    calls: number;
    messages: number;
    target: number;
}

// Hook to fetch real outreach data from the database
const useDailyOutreachData = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [outreachData, setOutreachData] = useState<DailyOutreachData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOutreachData = async () => {
            if (!user?.id) return;

            try {
                // Get recent contact history to build outreach stats
                const { data: contactHistory, error: contactError } = await supabase
                    .from('contact_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
                    .order('sent_at', { ascending: true });

                if (contactError) throw contactError;

                // Group by day to create the daily metrics
                const dayMap: Record<string, { calls: number, messages: number }> = {};

                // Create an array of the last 7 days
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return date.toLocaleDateString('en-US', { weekday: 'short' }); // 'Mon', 'Tue', etc.
                }).reverse(); // Reverse to have oldest first

                // Initialize all days with zero values
                last7Days.forEach(day => {
                    dayMap[day] = { calls: 0, messages: 0 };
                });

                // Process contact history and group by day of week
                if (contactHistory) {
                    contactHistory.forEach(contact => {
                        const dayOfWeek = new Date(contact.sent_at).toLocaleDateString('en-US', { weekday: 'short' });
                        if (dayMap[dayOfWeek]) {
                            if (contact.message_type === 'call') {
                                dayMap[dayOfWeek].calls += 1;
                            } else {
                                dayMap[dayOfWeek].messages += 1;
                            }
                        }
                    });
                }

                // Convert to chart data format
                const chartData = last7Days.map(day => ({
                    day,
                    calls: dayMap[day]?.calls || 0,
                    messages: dayMap[day]?.messages || 0,
                    target: 100 // Set a default target for now
                }));

                setOutreachData(chartData);
            } catch (error) {
                console.error('Error fetching outreach data:', error);
                toast.error('Failed to load outreach data');
                // Set default data in case of error
                setOutreachData([
                    { day: 'Mon', calls: 0, messages: 0, target: 100 },
                    { day: 'Tue', calls: 0, messages: 0, target: 100 },
                    { day: 'Wed', calls: 0, messages: 0, target: 100 },
                    { day: 'Thu', calls: 0, messages: 0, target: 100 },
                    { day: 'Fri', calls: 0, messages: 0, target: 100 },
                    { day: 'Sat', calls: 0, messages: 0, target: 25 },
                    { day: 'Sun', calls: 0, messages: 0, target: 25 },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchOutreachData();
    }, [user?.id]);

    return { outreachData, loading };
};

export function DailyOutreachTracker() {
    const { outreachData, loading } = useDailyOutreachData();

    if (loading) {
        return (
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Daily Outreach Tracker</CardTitle>
                    <CardDescription>Your call and message activity vs. target.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Loading outreach data...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Daily Outreach Tracker</CardTitle>
                <CardDescription>Your call and message activity vs. target.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={outreachData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: "var(--background)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius)"
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Bar dataKey="calls" stackId="a" fill="var(--chart-1)" name="Calls" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="messages" stackId="a" fill="var(--chart-2)" name="Messages" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
