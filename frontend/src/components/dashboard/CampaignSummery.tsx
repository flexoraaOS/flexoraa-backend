'use client';

import React, { useState, useEffect } from 'react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ReferenceLine,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { CampaignPoint } from '@/lib/types/dashboard';


type ViewMode = 'verified' | 'hotLeads' | 'pendingLeads';

type Props = {
  campaignData?: CampaignPoint[];
  loading?: boolean;
  dateRange?: DateRange | undefined;
  setDateRange?: (dr: DateRange | undefined) => void;
  viewMode?: ViewMode;
  setViewMode?: (v: ViewMode) => void;
  className?: string;
  title?:string;
  description?:string;
  isSelector?:boolean;
};

const viewConfig: Record<ViewMode, { key: keyof CampaignPoint | string; label: string; color: string }> = {
  verified: { key: 'verified', label: 'Verified', color: 'var(--chart-1)' },
  hotLeads: { key: 'hotLeads', label: 'Hot Leads', color: 'var(--chart-3)' },
  pendingLeads: { key: 'pendingLeads', label: 'Pending', color: 'var(--chart-4)' },
};

const InlineTooltip = ({ active, payload, label, yAxisKey, yAxisLabel }: any) => {
  if (active && payload && payload.length) {
    const rate = payload[0] && payload[1] ? ((payload[1].value / payload[0].value) * 100).toFixed(1) : '0.0';
    return (
      <div className="p-2 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow">
        <div className="font-semibold">{label}</div>
        <div className="text-sm text-muted-foreground">Uploaded: {payload[0]?.value?.toLocaleString?.()}</div>
        <div className="text-sm text-muted-foreground">{yAxisLabel}: {payload[1]?.value?.toLocaleString?.()}</div>
        <div className="text-sm text-muted-foreground">Conversion Rate: {rate}%</div>
      </div>
    );
  }
  return null;
};

export default function CampaignSummary({
  campaignData = [],
  loading = false,
  dateRange,
  setDateRange,
  viewMode = 'verified',
  setViewMode,
  className = '',
  title="",
  description="",
  isSelector=true
}: Props) {
  const currentView = viewConfig[viewMode];
  
  // 1. State for controlling the popover visibility
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // 2. State for temporarily holding the selected date range
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);

  // 3. Sync temp state with prop when popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      setTempDateRange(dateRange);
    }
  }, [isPopoverOpen, dateRange]);


  if (loading) {
    return (
      <Card className={`lg:col-span-5 xl:col-span-3 ${className}`}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <div className="w-full space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`lg:col-span-5 xl:col-span-3 ${className}`}>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Date picker popover */}
            {/* 4. Control the Popover state */}
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-[240px] justify-start text-left font-normal h-9">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={tempDateRange} // 5. Use temp state for selection
                  onSelect={setTempDateRange} // 6. Update temp state on select
                  numberOfMonths={2}
                />
                {/* 7. Add action buttons */}
                <div className="p-3 border-t flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsPopoverOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setDateRange?.(tempDateRange); // Commit the change
                      setIsPopoverOpen(false);      // Close the popover
                    }}
                  >
                    OK
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* View selector */}
            {isSelector && (
              <Select value={viewMode} onValueChange={(value) => setViewMode?.(value as ViewMode)}>
                <SelectTrigger className="w-full sm:w-[130px] h-9">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Vs. Verified</SelectItem>
                  <SelectItem value="hotLeads">Vs. Hot Leads</SelectItem>
                  <SelectItem value="pendingLeads">Vs. Pending</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pl-2 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={campaignData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorComparison" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentView.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentView.color} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUploaded" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border) / 0.5)" />
            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--chart-4)" fontSize={12} tickLine={false} axisLine={false} hide />

            <Tooltip content={<InlineTooltip yAxisKey={currentView.key} yAxisLabel={currentView.label} />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <ReferenceLine yAxisId="right" y={40} label={{ value: 'Benchmark', position: 'insideTopLeft', fill: 'var(--muted-foreground)' }} stroke="var(--muted-foreground)" strokeDasharray="3 3" />

            <Area yAxisId="left" type="monotone" name="Uploaded" dataKey="uploaded" stroke="var(--chart-2)" strokeWidth={2} fillOpacity={1} fill="url(#colorUploaded)" className="chart-glow-2" dot={false} />
            <Area yAxisId="left" type="monotone" name={currentView.label} dataKey={currentView.key as string} stroke={String(currentView.color)} strokeWidth={2} fillOpacity={1} fill="url(#colorComparison)" className="chart-glow-1" dot={false} />
            <Line yAxisId="right" type="monotone" name="Verification Rate" dataKey="verificationRate" stroke="var(--chart-4)" strokeWidth={2} dot={false} className="chart-glow-4" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}