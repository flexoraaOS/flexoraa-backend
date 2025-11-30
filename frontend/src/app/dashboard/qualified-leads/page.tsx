'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Flame, Phone, MessageSquare, CalendarPlus, Mic, Square, Save, Clock, ChevronLeft, ChevronRight, List, FileText, UserPlus, Milestone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, updateLead, scheduleFollowUp, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { Lead as BaseLead } from '@/lib/types/leadTypes';
import ScheduleBookingFollowUp from '@/components/dashboard/ScheduledBookingFollowUp';
import LeadTimelineDialog from '@/components/dashboard/leados-sdr/LeadTimeline';
import AddNoteDialog from '@/components/dashboard/AddNoteDialogue';
import LeadStagePipelineDialog from '@/components/dashboard/LeadStagePipelineDiaogue';

type LeadStage = 'New' | 'Contacted' | 'Demo Booked' | 'Follow-up' | 'Closed';
type TimelineEvent = {
    type: 'created' | 'stage_change' | 'note' | 'follow_up';
    title: string;
    content: string;
    date: string;
};

type QualifiedLead = BaseLead & {
    lead_stage: LeadStage;
    timeline: TimelineEvent[];
};

const pipelineStages: LeadStage[] = ['New', 'Contacted', 'Demo Booked', 'Follow-up', 'Closed'];


const ScoreIndicator = ({ score }: { score: number }) => {
    return (
        <div className="flex items-center gap-2">
            <div className="w-24">
                <Progress value={score} className="h-2" />
            </div>
            <span className="font-medium text-sm text-foreground">{score}</span>
        </div>
    );
};








export default function QualifiedLeadsPage() {
    const dispatch = useAppDispatch();
    const allLeads = useAppSelector(selectLeads);
    const loading = useAppSelector(selectLeadsLoading);
    const error = useAppSelector(selectLeadsError);
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof QualifiedLead; direction: 'ascending' | 'descending' } | null>({ key: 'conversation_score', direction: 'descending' });

    React.useEffect(() => {
        dispatch(fetchLeads());
    }, [dispatch]);

    const hotLeads = React.useMemo(() => {
        return allLeads.filter(lead => lead.temperature === 'hot');
    }, [allLeads]);

    const enrichedLeads = React.useMemo((): QualifiedLead[] => {
        return hotLeads.map((lead, index) => ({
            ...lead,
            lead_stage: lead.stage || pipelineStages[index % pipelineStages.length] || 'New',
            timeline: lead.stage || [
                { type: 'created', title: 'Lead Created', content: 'From AI analysis.', date: lead.created_at || new Date().toISOString() },
                { type: 'stage_change', title: 'Marked as HOT', content: `Score: ${lead.conversation_score}`, date: lead.updated_at || new Date().toISOString() }
            ],
        }));
    }, [hotLeads]);

    const handleStageChange = (leadId: string, newStage: LeadStage) => {
        dispatch(updateLead({ id: leadId, changes: { lead_stage: newStage } }));
        toast.success("Lead Stage Updated", { description: `Lead moved to ${newStage}.` });
    };

    const sortedLeads = React.useMemo(() => {
        const sortableItems = [...enrichedLeads];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? '';
                const bValue = b[sortConfig.key] ?? '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [enrichedLeads, sortConfig]);

    const requestSort = (key: keyof QualifiedLead) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (loading === 'pending') {
        return <div className="p-4 flex items-center justify-center h-96"><p>Loading qualified leads...</p></div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Qualified Leads (HOT)</h1>
                <p className="text-muted-foreground mt-1">A list of all leads identified as high-priority, qualified prospects.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>HOT Leads</CardTitle>
                    <CardDescription>These leads show the highest conversion potential based on AI analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('phone_number')}>Phone Number<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead>Actions</TableHead>
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('conversation_score')}>Conversion Score<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('temperature')}>Status<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead><Button variant="ghost" onClick={() => requestSort('lead_stage')}>Lead Stage<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                                    <TableHead>Timeline</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead><span className="sr-only">Menu</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedLeads.map((lead) => (
                                    <TableRow key={lead.id} className="hover:bg-secondary/50">
                                        <TableCell className="font-medium">{lead.phone_number}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Button asChild size="sm" className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 hover:text-green-300">
                                                    <Link href={`tel:${lead.phone_number}`}><Phone className="mr-2 h-4 w-4" /> Call</Link>
                                                </Button>
                                                <Button asChild size="sm" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:text-blue-300">
                                                    <Link href={`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`} target="_blank"><MessageSquare className="mr-2 h-4 w-4" /> WhatsApp</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell><ScoreIndicator score={Number(lead.conversation_score || 0)} /></TableCell>
                                        <TableCell>
                                            <Badge variant="destructive" className={'bg-red-500/90'}>
                                                <Flame className="mr-1 h-3.5 w-3.5" />
                                                {lead.temperature}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <LeadStagePipelineDialog lead={lead} >
                                                <button className="text-muted-foreground hover:text-foreground hover:underline transition-all cursor-pointer">
                                                    {lead.stage ?? 'new'}
                                                </button>
                                            </LeadStagePipelineDialog>
                                        </TableCell>
                                        <TableCell><LeadTimelineDialog lead={lead} /></TableCell>
                                        <TableCell><ScheduleBookingFollowUp lead={lead} /></TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>View Conversation</DropdownMenuItem>
                                                    <AddNoteDialog lead={lead} />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}