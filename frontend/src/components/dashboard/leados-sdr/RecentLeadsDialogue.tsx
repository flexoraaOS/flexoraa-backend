'use client';
import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Flame,
  Users,
  Phone,
  MessageSquare,
  MoreHorizontal,
  Mic,
  Square,
  Save,
  Bot
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/lib/types/leadTypes';
import { getConversationSummary } from '@/app/dashboard/leados/actions';
import LeadTimelineDialog from './LeadTimeline';
import ScheduleBookingFollowUp from '../ScheduledBookingFollowUp';
import LeadStagePipelineDialog from '../LeadStagePipelineDiaogue';
import AddNoteDialog from '../AddNoteDialogue';

// --- Local helpers ---
const digitsOnly = (s: string) => (s || '').replace(/\D/g, '');

// --- Types used inside this file ---


// --- Small child components ---

const ScoreIndicator = ({ score }: { score?: string | number | null }) => {
  const numeric = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="w-24">
        <Progress value={numeric} className="h-2" />
      </div>
      <span className="font-medium text-sm text-foreground">{numeric}</span>
    </div>
  );
};









export function RecentLeadsDialog({ leadsAssigned, leads: initialLeads }: { leadsAssigned: number; leads: Lead[] }) {
  const [leads, setLeads] = React.useState<Lead[]>(initialLeads ?? []);

  // keep local state in sync if parent passes a new array reference
  React.useEffect(() => {
    setLeads(initialLeads ?? []);
  }, [initialLeads]);

  

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Assigned</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md"><Users className="h-5 w-5 text-primary" /></div>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{leadsAssigned}</div>
            <p className="text-xs text-green-500">+20 from last month</p>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Recent Leads</DialogTitle>
          <DialogDescription>Your most recently assigned leads.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lead Stage</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-right">More</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {leads.map((lead) => {
                const tel = digitsOnly(lead.phone_number || '');
                return (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.id ?? lead.phone_number ?? '—'}</TableCell>

                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {tel && (
                          <Button asChild size="sm" className="bg-green-500/20 text-green-400 border border-green-500/30 transition-colors">
                            <Link href={`tel:${tel}`}><Phone className="mr-2 h-4 w-4" />Call</Link>
                          </Button>
                        )}

                        {tel && (
                          <Button asChild size="sm" className="bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-colors">
                            <Link href={`https://wa.me/${tel}`} target="_blank" rel="noreferrer">
                              <MessageSquare className="mr-2 h-4 w-4" />WhatsApp
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell><ScoreIndicator score={lead.conversation_score ?? (lead as any).score} /></TableCell>

                    <TableCell>
                      <Badge
                        className={
                          lead.status === 'Hot'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300'
                            : lead.status === 'Warm'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 hover:text-yellow-300'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:text-blue-300'
                        }
                      >
                        {lead.status === 'Hot' && <Flame className="mr-1 h-3 w-3" />}
                        {lead.status}
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

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <Popover>
                            <PopoverTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>AI Summary</DropdownMenuItem>
                            </PopoverTrigger>

                            <PopoverContent className="w-80 space-y-3">
                              <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h4 className="font-semibold font-headline">AI Conversation Summary(coming soon)</h4></div>
                              {/* <ConversationSummary conversationHistory={lead.conversation_score ?? ''} /> */}
                            </PopoverContent>
                          </Popover>

                          <AddNoteDialog lead={lead} />

                          
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
