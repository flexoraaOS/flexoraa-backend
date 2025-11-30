'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Lead, LeadStages } from '@/lib/types/leadTypes';
import { LEAD_STAGES } from '@/lib/types/constants';

// Defines the order and names for the funnel stages to be displayed
const FUNNEL_STAGES_ORDER: FunnelStageName[] = ['new', 'contacted', 'qualified', 'booked', 'converted'];

type FunnelStageName = typeof LEAD_STAGES[number];

const STAGE_DISPLAY_NAMES: Record<FunnelStageName, string> = {
  new: 'New Leads',
  contacted: 'Contacted',
  qualified: 'Qualified',
  booked: 'Booked',
  converted: 'Closed',
  unqualified: 'Unqualified'
};

const STAGE_COLORS: Record<FunnelStageName, string> = {
  new: 'url(#gradient-leads)',
  contacted: 'url(#gradient-contacted)',
  qualified: 'url(#gradient-qualified)',
  booked: 'url(#gradient-booked)',
  converted: 'url(#gradient-closed)',
  unqualified: 'url(#gradient-unqualified)'
};

const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-xl">
        <p className="font-bold text-lg">{`${data.displayName}: ${data.value.toLocaleString()}`}</p>
        {data.dropOff > 0 && (
          <p className="text-sm text-red-400 flex items-center mt-1">
            <TrendingDown className="mr-1 h-4 w-4" />
            {`${data.dropOff.toFixed(1)}% drop-off from previous stage`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface DropOffAnalysisProps {
  leads: Lead[];
}

export function DropOffAnalysis({ leads }: DropOffAnalysisProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date()
  });

  const { funnelDataWithDropOff, overallConversion } = React.useMemo(() => {
    // 1. Filter leads based on the selected date range
    const filteredLeads = leads.filter((lead) => {
      if (!dateRange?.from || !dateRange?.to) return true;
      // Assuming lead.created_at exists and is the primary date for filtering
      const leadDate = new Date(lead.created_at);
      return leadDate >= dateRange.from && leadDate <= dateRange.to;
    });

    // 2. Group all filtered leads by their stage
    const leadsByStage = LEAD_STAGES.reduce((acc, stage) => {
      acc[stage] = [];
      return acc;
    }, {} as Record<LeadStages, Lead[]>);

    filteredLeads.forEach((lead) => {
      const stage = (lead.stage as FunnelStageName) || 'new';
      if (stage in leadsByStage) {
        (leadsByStage as any)[stage].push(lead);
      }
    });
    
    // 3. Create funnel data, ensuring cumulative counts are correct
    const funnelData = FUNNEL_STAGES_ORDER.map((stageName) => {
      const stageIndexInAllStages = LEAD_STAGES.indexOf(stageName);
      const subsequentStages = LEAD_STAGES.slice(stageIndexInAllStages);

      const value = subsequentStages.reduce(
        (sum, s) => sum + (leadsByStage[s]?.length || 0),
        0
      );

      return {
        name: stageName,
        displayName: STAGE_DISPLAY_NAMES[stageName],
        value,
        fill: STAGE_COLORS[stageName]
      };
    });

    // 4. Calculate drop-off percentages between stages
    const funnelDataWithDropOff = funnelData.map((item, index) => {
      if (index === 0) return { ...item, dropOff: 0 };
      const previousStageValue = funnelData[index - 1].value;
      if (previousStageValue === 0) return { ...item, dropOff: 0 };
      const dropOff = ((previousStageValue - item.value) / previousStageValue) * 100;
      return { ...item, dropOff };
    });

    // 5. Calculate overall conversion rate based on filtered leads
    const totalLeads = filteredLeads.length;
    const convertedLeads = leadsByStage['converted']?.length || 0;
    const overallConversion = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

    return { funnelDataWithDropOff, overallConversion };
  }, [leads, dateRange]); // Re-calculate when leads or dateRange change

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Lead Journey Drop-off</CardTitle>
            <CardDescription>From initial lead to closed deal.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[300px] justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
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
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <defs>
              <linearGradient id="gradient-leads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradient-contacted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradient-qualified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradient-booked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradient-closed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradient-unqualified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-6)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-6)" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltipContent />} />
            <Funnel
              dataKey="value"
              data={funnelDataWithDropOff}
              isAnimationActive
              lastShapeType="triangle"
              orientation="vertical"
            >
              <LabelList
                position="center" // <-- Text is now centered
                fill="var(--foreground)"
                stroke="none"
                dataKey="displayName"
                className="font-semibold"
              />
              {funnelDataWithDropOff.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  // onClick and interactive classes removed
                />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 text-sm pt-4 border-t">
        <div className="flex gap-2 font-medium leading-none">
          Overall Conversion Rate:{' '}
          <span className="text-primary font-bold">{overallConversion}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}