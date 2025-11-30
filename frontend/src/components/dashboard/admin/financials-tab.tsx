
"use client";

import React, { useState } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// --- UI Components (assuming these are from your library, e.g., shadcn/ui) ---
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // Your utility for merging class names

// --- Dummy Data ---
const financialData = {
  revenue: { total: 45231.89 },
  costs: { total: 12540.12 },
  profit: { net: 32691.77 },
  cashBalance: 250120.55,
  creditsBought: 15000,
  creditsUsed: 11245,
};

const cashFlowData = [
  { month: "Jan", cashIn: 40000, cashOut: 24000, netFlow: 16000 },
  { month: "Feb", cashIn: 30000, cashOut: 13980, netFlow: 16020 },
  { month: "Mar", cashIn: 42000, cashOut: 19800, netFlow: 22200 },
  { month: "Apr", cashIn: 27800, cashOut: 13900, netFlow: 13900 },
  { month: "May", cashIn: 48900, cashOut: 18000, netFlow: 30900 },
  { month: "Jun", cashIn: 33900, cashOut: 17000, netFlow: 16900 },
];

// --- Placeholder Components for Dialogs ---
// Replace these with your actual dialog components
const LogNewCostDialog = () => <Button>Log New Cost</Button>;
const RevenueBreakdownDialog = () => <Button variant="link" className="p-0 h-auto">View Breakdown</Button>;
const CostsBreakdownDialog = () => <Button variant="link" className="p-0 h-auto">View Breakdown</Button>;
const ForecastSimulatorDialog = () => <Button className="w-full">Run Forecast Simulation</Button>;


// --- Main Reusable Component ---
export const FinancialsTab = () => {
  const [finDateRange, setFinDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  return (
    <TabsContent value="financials" className="space-y-8 pt-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Financial Control</CardTitle>
            <CardDescription>Owner-level financial intelligence hub.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="fin-date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !finDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {finDateRange?.from ? (
                    finDateRange.to ? (
                      <>
                        {format(finDateRange.from, "LLL dd, y")} -{" "}
                        {format(finDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(finDateRange.from, "LLL dd, y")
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
                  defaultMonth={finDateRange?.from}
                  selected={finDateRange}
                  onSelect={setFinDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <LogNewCostDialog />
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Top Row KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${financialData.revenue.total.toLocaleString()}</div><p className="text-xs text-muted-foreground">in selected period</p></CardContent>
              <CardFooter><RevenueBreakdownDialog /></CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Costs</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${financialData.costs.total.toLocaleString()}</div><p className="text-xs text-muted-foreground">API, Infra, Ops</p></CardContent>
              <CardFooter><CostsBreakdownDialog /></CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-400">${financialData.profit.net.toLocaleString()}</div><p className="text-xs text-muted-foreground">After all costs</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Cash Balance</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">${financialData.cashBalance.toLocaleString()}</div><p className="text-xs text-muted-foreground">In Bank</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Credits Bought</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-blue-400">${financialData.creditsBought.toLocaleString()}</div><p className="text-xs text-muted-foreground">in selected period</p></CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Credits Used</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-yellow-400">${financialData.creditsUsed.toLocaleString()}</div><p className="text-xs text-muted-foreground">in selected period</p></CardContent>
            </Card>
          </div>

          {/* Charts and Forecasts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Cash Flow Snapshot</CardTitle></CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="cashIn" name="Cash In" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cashOut" name="Cash Out" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="netFlow" name="Net Flow" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 4, fill: "var(--chart-4)" }} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Forecast & Trends</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between"><span>Projected Revenue (30d):</span> <span className="font-semibold">$55,000</span></div>
                <div className="flex justify-between"><span>Projected Costs (30d):</span> <span className="font-semibold">$20,000</span></div>
                <div className="flex justify-between border-t pt-2"><span>Break-even Forecast:</span> <span className="font-semibold">N/A</span></div>
                <ForecastSimulatorDialog />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};