
'use client';
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Plus, CheckCircle, MoreHorizontal, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const initialTasks = [
    { id: 'T1', lead: 'Chris Evans', task: 'Initial follow-up call', due: new Date(), completed: false },
    { id: 'T2', lead: 'Laura Bailey', task: 'Send pricing information', due: new Date(), completed: false },
    { id: 'T3', lead: 'Marisha Ray', task: 'Book demo call', due: new Date(), completed: false },
    { id: 'T4', lead: 'Sam Riegel', task: 'Check in after demo', due: new Date(), completed: false },
    { id: 'T5', lead: 'John Doe', task: 'Finalize contract details', due: new Date(), completed: false },
];

interface TodaysTasksProps {
    tasksCompleted: number;
    totalTasks: number;
    taskCompletionPercentage: number;
}

export function TodaysTasksDialog({ tasksCompleted: initialCompleted, totalTasks: initialTotal, taskCompletionPercentage: initialCompletionPercentage }: TodaysTasksProps) {
  const [tasks, setTasks] = useState(initialTasks);

  const handleTaskAction = (taskId: string, action: 'complete' | 'postpone', duration?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (action === 'complete') {
        setTasks(tasks.filter(t => t.id !== taskId));
        toast({
            title: "Task Completed!",
            description: `"${task.task}" marked as done.`,
        });
    } else if (action === 'postpone' && duration) {
        setTasks(tasks.filter(t => t.id !== taskId));
        toast({
            title: "Task Postponed",
            description: `"${task.task}" has been moved to ${duration}.`,
        });
    }
  };

  const tasksSummary = useMemo(() => {
    const total = tasks.length;
    const completed = initialTasks.length - tasks.length;
    return {
        total,
        completed,
        percentage: initialTasks.length > 0 ? (completed / initialTasks.length) * 100 : 0
    }
  }, [tasks]);


  return (
    <Dialog>
        <DialogTrigger asChild>
            <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today&apos;s Tasks</CardTitle>
                   <div className="p-2 bg-primary/10 rounded-md">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{tasksSummary.total}</div>
                  <p className="text-xs text-green-500">{tasksSummary.completed} of {initialTasks.length} tasks completed</p>
                   <Progress value={tasksSummary.percentage} className="mt-2 h-2" />
              </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className='max-w-3xl w-full'>
            <DialogHeader>
                <DialogTitle>AI-Generated Task List</DialogTitle>
                <DialogDescription>Your intelligent to-do list for today. Tasks are prioritized by the AI.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto py-4">
                <div className="space-y-3">
                  {tasks.length > 0 ? tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="flex-1">
                          <p className="text-sm font-medium leading-none">
                              {task.task}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            For {task.lead} &bull; Due {format(task.due, 'MMM dd')}
                          </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleTaskAction(task.id, 'complete')}>
                            <CheckCircle className="h-4 w-4 text-green-500"/>
                        </Button>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Clock className="h-4 w-4 text-yellow-500"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'postpone', 'Tomorrow')}>Tomorrow</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'postpone', 'in 2 days')}>In 2 days</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'postpone', 'next week')}>Next week</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction(task.id, 'postpone', 'next month')}>Next month</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Low Priority</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No upcoming tasks. You are all caught up!</p>
                    </div>
                  )}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
