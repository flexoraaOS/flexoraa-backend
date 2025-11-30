'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

interface SdrData {
  user_id: string;
  name: string;
  avatar: string | null;
  assigned: number;
  contacted: number;
  closed: number;
}

export default function SdrLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<SdrData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndProcessLeaderboard() {
      try {
        // Fetch SDR profiles (role = sdr)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'sdr');
        if (profilesError) throw profilesError;

        // Fetch all users (admin route – requires server/service role)
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) throw usersError;

        // Fetch leads
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('user_id, contacted, closed');
        if (leadsError) throw leadsError;

        const users = usersData?.users || [];

        const aggregatedData = profiles.map((profile) => {
          const user = users.find((u) => u.id === profile.id);
          const sdrLeads = leads.filter((lead) => lead.user_id === profile.id);

          return {
            user_id: profile.id,
            name: (user?.user_metadata?.full_name as string) || user?.email || 'Unknown',
            avatar: (user?.user_metadata?.avatar_url as string) || null,
            assigned: sdrLeads.length,
            contacted: sdrLeads.filter((l) => l.contacted).length,
            closed: sdrLeads.filter((l) => l.closed).length,
          };
        });

        aggregatedData.sort((a, b) => b.closed - a.closed || b.contacted - a.contacted);

        setLeaderboardData(aggregatedData);
      } catch (error) {
        console.error('Failed to load SDR leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndProcessLeaderboard();
  }, []);

  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>SDR Leaderboard</CardTitle>
          <CardDescription>
            Gamified performance tracking to motivate your sales team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>SDR Leaderboard</CardTitle>
        <CardDescription>
          Gamified performance tracking to motivate your sales team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboardData.map((sdr, index) => (
            <div
              key={sdr.user_id}
              className={cn(
                'flex flex-col gap-4 p-4 rounded-lg transition-all border',
                index === 0 && 'bg-yellow-400/10 border-yellow-400/20 shadow-lg shadow-yellow-500/10',
                index === 1 && 'bg-gray-400/10 border-gray-400/20',
                index === 2 && 'bg-yellow-600/10 border-yellow-600/20'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold text-lg">
                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
                  {index === 1 && <Trophy className="h-5 w-5 text-gray-400 fill-gray-400" />}
                  {index === 2 && <Trophy className="h-5 w-5 text-yellow-600 fill-yellow-600" />}
                  {index > 2 && <span className="text-sm">{index + 1}</span>}
                </div>
                <Avatar>
                  <AvatarImage src={sdr.avatar || ''} />
                  <AvatarFallback>{sdr.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{sdr.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-border">
                <div>
                  <p className="text-muted-foreground">Assigned</p>
                  <p className="font-semibold text-lg">{sdr.assigned}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contacted</p>
                  <p className="font-semibold text-lg">{sdr.contacted}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closed</p>
                  <p className="font-semibold text-lg">{sdr.closed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
