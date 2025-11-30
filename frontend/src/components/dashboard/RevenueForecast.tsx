'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  revenue?: RevenueData;
  loading?: boolean;
};

export const RevenueForecast: React.FC<Props> = ({ revenue, loading }) => {
  if (loading) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Visualize sales performance and future revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const earned = revenue?.earnedRevenue ?? 0;
  const potential = revenue?.potentialRevenue ?? 0;
  const totalGoal = revenue?.totalGoal ?? 1;

  const percent = (earned / totalGoal) * 100;

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Revenue Forecast</CardTitle>
        <CardDescription>Visualize sales performance and future revenue.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground">Earned Revenue</p>
              <p className="text-2xl font-bold font-headline">${earned.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground">Potential Revenue (Pipeline)</p>
              <p className="text-2xl font-bold font-headline">${potential.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <p className="font-medium">Revenue Goal</p>
            </div>
            <p className="text-sm font-semibold">
              ${earned.toLocaleString()} / <span className="text-muted-foreground">${totalGoal.toLocaleString()}</span>
            </p>
          </div>
          <Progress value={percent} />
        </div>
      </CardContent>
    </Card>
  );
};
