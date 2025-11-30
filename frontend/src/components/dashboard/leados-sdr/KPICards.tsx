
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { RecentLeadsDialog } from './RecentLeadsDialogue';
import { AppointmentsDialog } from './AppoinmentsDialogue';
import { TodaysTasksDialog } from './TodaysTasksDialog';
import { Lead } from '@/lib/types/leadTypes';

interface KpiCardsProps {
    leadsAssigned: number;
    meetingsBooked: number;
    conversionPercentage: number;
    tasksDue: number;
    tasksCompleted: number;
    totalTasks: number;
    leads:Lead[];
}

const KpiCard = ({ icon, title, value, footer }: { icon: React.ReactNode, title: string, value: string | number, footer: React.ReactNode }) => {
    return (
         <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-md">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-green-500">{footer}</p>
            </CardContent>
        </Card>
    );
};


export function KpiCards({ leadsAssigned, meetingsBooked, conversionPercentage, tasksDue, tasksCompleted, totalTasks, leads }: KpiCardsProps) {
    const taskCompletionPercentage = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <RecentLeadsDialog leadsAssigned={leadsAssigned} leads={leads} />
            
            <AppointmentsDialog  />

            <KpiCard 
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                title="Conversion %"
                value={`${conversionPercentage}%`}
                footer="+1.2% from last month"
            />
            
            <TodaysTasksDialog tasksCompleted={tasksCompleted} totalTasks={totalTasks} taskCompletionPercentage={taskCompletionPercentage} />
        </div>
    );
}
