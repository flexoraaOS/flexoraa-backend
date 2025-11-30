'use client';

import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchConversations, Conversation } from '@/lib/features/conversationSlice';

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const offset = 10;
  const sx = cx + offset * cos;
  const sy = cy + offset * sin;

  return (
    <g>
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor={fill} floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Highlighted active slice */}
      <Sector
        cx={sx}
        cy={sy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow)"
      />

      {/* Labels inside center */}
      <text
        x={cx}
        y={cy}
        dy={-10}
        textAnchor="middle"
        fill={fill}
        className="text-2xl font-bold font-headline"
      >
        {payload.temperature}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="var(--foreground)" className="text-xl">
        {`${value.toLocaleString()}`}
      </text>
      <text
        x={cx}
        y={cy}
        dy={40}
        textAnchor="middle"
        fill="var(--muted-foreground)"
        className="text-base"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

// Component that reads conversations from the slice and builds funnelData
export const LeadFunnel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list: conversations, loading } = useAppSelector((state) => state.conversations);

  useEffect(() => {
    if (loading === 'idle') dispatch(fetchConversations());
  }, [dispatch, loading]);

  // Build funnel data. Prefer an explicit `temperature` field if present on rows.
  // Fallback: build funnel from channel counts (instagram/whatsapp/facebook/gmail).
  const funnelData = useMemo(() => {
    if (!conversations || conversations.length === 0) return [];

    // If rows already have a `temperature` property use that grouping
    if ('temperature' in (conversations[0] as any)) {
      const grouped: Record<string, number> = {};
      conversations.forEach((c: any) => {
        const t = c.temperature ?? 'Unknown';
        // prefer a numeric `leads` field if present, otherwise count 1 per row
        const val = Number(c.leads ?? 1) || 0;
        grouped[t] = (grouped[t] || 0) + val;
      });

      return Object.entries(grouped).map(([temperature, leads], i) => ({
        temperature,
        leads,
        fill: `var(--chart-${(i % 5) + 1})`,
      }));
    }

    // Fallback: conversations store channel counts (strings like "100"). Sum them.
    const stageCount: Record<string, number> = {
      Instagram: 0,
      WhatsApp: 0,
      Facebook: 0,
      Gmail: 0,
    };

    conversations.forEach((c: Conversation) => {
      stageCount.Instagram += Number((c as any).instagram) || 0;
      stageCount.WhatsApp += Number((c as any).whatsapp) || 0;
      stageCount.Facebook += Number((c as any).facebook) || 0;
      stageCount.Gmail += Number((c as any).gmail) || 0;
    });

    return Object.entries(stageCount).map(([temperature, leads], i) => ({
      temperature,
      leads,
      fill: `var(--chart-${(i % 5) + 1})`,
    }));
  }, [conversations]);

  React.useEffect(() => {
    // helpful debug output while developing
    // eslint-disable-next-line no-console
    console.log('funnelData ->', funnelData);
  }, [funnelData]);

  const [activeIndex, setActiveIndex] = React.useState(0);

  if (loading === 'idle' || loading === 'pending') {
    return (
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
          <CardDescription>Distribution of leads by temp.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-full space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-56 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Lead Funnel</CardTitle>
        <CardDescription>Distribution of leads by temp.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex items-center justify-center">
        <ChartContainer config={{}} className="mx-auto aspect-square h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={funnelData || []}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={100}
                dataKey="leads"
                onMouseEnter={(_, index: number) => setActiveIndex(index)}
              >
                {(funnelData || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill || `var(--chart-${(index % 3) + 1})`}
                    stroke={entry.fill || `var(--chart-${(index % 3) + 1})`}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default LeadFunnel;
