// components/dashboard/SDRLeaderboard.tsx
'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sdr } from '@/lib/types/dashboard';
import { cn } from '@/lib/utils';

type Props = {
  sdr?: Sdr[];
  loading?: boolean;
};

export const SDRLeaderboard: React.FC<Props> = ({ sdr, loading }) => {
  if (loading) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>SDR Leaderboard</CardTitle>
          <CardDescription>Gamified performance tracking to motivate your sales team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ranked = (sdr || []).slice().sort((a, b) => (b.revenueAdded || 0) - (a.revenueAdded || 0));

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>SDR Leaderboard</CardTitle>
        <CardDescription>Gamified performance tracking to motivate your sales team.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>SDR</TableHead>
              <TableHead>Revenue Added</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead>Contacted</TableHead>
              <TableHead>Close Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((s, index) => (
              <TableRow key={s.name} className={cn(index < 3 && 'bg-secondary/50')}>
                <TableCell>
                  <div className="flex items-center justify-center font-bold text-lg">
                    {index === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
                    {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Trophy className="h-5 w-5 text-yellow-600" />}
                    {index > 2 && <span>{index + 1}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {s.avatar ? <AvatarImage src={s.avatar} data-ai-hint={s.avatarHint} /> : <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>}
                    </Avatar>
                    <span className="font-medium">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-lg text-primary">${(s.revenueAdded || 0).toLocaleString()}</TableCell>
                <TableCell className="text-green-400 font-semibold">{s.closed ?? '-'}</TableCell>
                <TableCell>{s.contacted ?? '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={s.closeRate ?? 0} className="w-24 h-1.5" />
                    <span className="text-xs text-muted-foreground">{(s.closeRate ?? 0).toFixed(1)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
