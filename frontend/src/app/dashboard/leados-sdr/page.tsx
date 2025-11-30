'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DailyOutreachTracker } from '@/components/dashboard/leados-sdr/DailyOutreactTracker';
import { DropOffAnalysis } from '@/components/dashboard/leados-sdr/DropoffAnalysis';
import { KpiCards } from '@/components/dashboard/leados-sdr/KPICards';
import { PerformanceChart } from '@/components/dashboard/leados-sdr/PerformenceChart';
import SDRDashboard from '@/components/dashboard/leados-sdr/SDRDashboardHeader';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { Skeleton } from '@/components/ui/skeleton';
import { AiChatAnalysis } from '@/components/ai/AIChatAnalysis';
import { PerformanceChartNew } from '@/components/dashboard/leados-sdr/PerformanceChartNew';

const upcomingTasksData = [
  { id: 'T1', lead: 'Chris Evans', task: 'Initial follow-up call', due: new Date(), completed: false },
  { id: 'T2', lead: 'Laura Bailey', task: 'Send pricing information', due: new Date(), completed: true },
];

function SDRLeadOS() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const leads = useAppSelector(selectLeads);
  const leadsLoading = useAppSelector(selectLeadsLoading);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchLeads({ userId: user?.id }));
    }
  }, [user, dispatch]);

  const kpiData = useMemo(() => {
    const leadsAssigned = leads.length;
    const closedLeads = leads.filter(lead => lead.closed === true).length;

    const conversionPercentage = leadsAssigned > 0
      ? ((closedLeads / leadsAssigned) * 100).toFixed(2)
      : "0.00";

    const meetingsBooked = leads.filter(lead => !lead.closed).length;

    return { leadsAssigned, meetingsBooked, conversionPercentage };
  }, [leads]);

  const [tasks] = useState(upcomingTasksData);
  const todaysTotalTasks = useMemo(() => tasks.filter(t => new Date(t.due).toDateString() === new Date().toDateString()).length, [tasks]);
  const todaysCompletedTasks = useMemo(() => tasks.filter(t => new Date(t.due).toDateString() === new Date().toDateString() && t.completed).length, [tasks]);

  return (
    <div>
      <SDRDashboard showNotifications credits={4500} />

      {leadsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <KpiCards
          leads={leads}
          leadsAssigned={kpiData.leadsAssigned}
          meetingsBooked={kpiData.meetingsBooked}
          conversionPercentage={kpiData.conversionPercentage}
          tasksDue={todaysTotalTasks - todaysCompletedTasks}
          tasksCompleted={todaysCompletedTasks}
          totalTasks={todaysTotalTasks}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-10">
        <DropOffAnalysis leads={leads} />
        <div className="lg:col-span-2 space-y-6">
          <DailyOutreachTracker />
          <PerformanceChart />
        </div>
      </div>
      <div className='grid grid-cols-2 pt-7 gap-7'>

        <AiChatAnalysis />
        <PerformanceChartNew />
      </div>
    </div>
  );
}

export default SDRLeadOS;
