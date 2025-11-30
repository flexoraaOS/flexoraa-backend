'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  LabelList,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchConversations } from '@/lib/features/conversationSlice';

type Props = {
  title?: string;
  description?: string;
};

export const LeadStageChart: React.FC<Props> = ({
  title = 'Lead Stage Distribution',
  description = 'Number of leads in each stage',
}) => {
  const dispatch = useAppDispatch();

  const { list: conversations, loading } = useAppSelector(
    (state) => state.conversations
  );

  // Fetch conversations when idle
  useEffect(() => {
    if (loading === 'idle') {
      dispatch(fetchConversations());
    }
  }, [dispatch, loading]);

  // ✅ Sum up numbers from each row
  const leadStageData = useMemo(() => {
    const stageCount: Record<string, number> = {
      instagram: 0,
      whatsapp: 0,
      facebook: 0,
      gmail: 0,
    };

    console.log('All conversations:', conversations);

    conversations.forEach((conv) => {
      stageCount.instagram += Number(conv.instagram) || 0;
      stageCount.whatsapp += Number(conv.whatsapp) || 0;
      stageCount.facebook += Number(conv.facebook) || 0;
      stageCount.gmail += Number(conv.gmail) || 0;
    });

    return Object.entries(stageCount).map(([stage, count]) => ({
      stage,
      count,
    }));
  }, [conversations]);

  // Loading UI
  if (loading === 'idle' || loading === 'pending') {
    return (
      <Card className="lg:col-span-5 xl:col-span-2">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] pl-2 flex items-center justify-center">
          <div className="w-full space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-5 xl:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] pl-2">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={leadStageData}
            margin={{ top: 20, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border) / 0.5"
            />
            <XAxis
              dataKey="stage"
              type="category"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              stroke="var(--muted-foreground)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--secondary)' }}
              contentStyle={{
                backgroundColor: 'var(--background)',
                backdropFilter: 'blur(4px)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="count"
                position="top"
                formatter={(value: number) => value.toLocaleString()}
                style={{ fill: 'var(--foreground)', fontSize: '12px' }}
              />
              {leadStageData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`var(--chart-${(index % 5) + 1})`}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
