'use client';
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday, parseISO } from 'date-fns';
import Link from 'next/link';
import { Phone, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAppSelector } from '@/lib/hooks';
import { selectLeads } from '@/lib/features/leadsSlice';

export function AppointmentsDialog() {
  const allLeads = useAppSelector(selectLeads);
  const [date, setDate] = useState<Date | undefined>(new Date());

  const scheduledMeetings = useMemo(() => {
    return allLeads
      .filter(lead => !!lead.booked_timestamp)
      .map(lead => ({
        ...lead,
        booked_at_date: parseISO(lead.booked_timestamp!),
      }));
  }, [allLeads]);

  const filteredMeetings = useMemo(() => {
    if (!date) return [];
    return scheduledMeetings.filter(m => format(m.booked_at_date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
  }, [date, scheduledMeetings]);

  const bookedDays = useMemo(() => scheduledMeetings.map(m => m.booked_at_date), [scheduledMeetings]);
  const totalMeetings = scheduledMeetings.length;
  const meetingCounts = useMemo(() => {
    const now = new Date();
    const thisMonthMeetings = scheduledMeetings.filter(m =>
      isWithinInterval(m.booked_at_date, { start: startOfMonth(now), end: endOfMonth(now) })
    ).length;
    const thisWeekMeetings = scheduledMeetings.filter(m =>
      isWithinInterval(m.booked_at_date, { start: startOfWeek(now), end: endOfWeek(now) })
    ).length;
    return { thisMonth: thisMonthMeetings, thisWeek: thisWeekMeetings };
  }, [scheduledMeetings]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="w-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Booked</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMeetings}</div>
            <p className="text-xs text-muted-foreground">{meetingCounts.thisWeek} this week</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Upcoming Appointments</DialogTitle>
          <DialogDescription>A list of your scheduled meetings. Use the calendar to select a date.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
          <div className="md:col-span-1 flex flex-col items-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{ booked: bookedDays }}
              modifiersStyles={{
                booked: {
                  outline: '2px dotted #ef4444',
                  outlineOffset: '3px',
                  borderRadius: '0.5rem',
                },
              }}
            />
            <Button
              variant="ghost"
              onClick={() => setDate(new Date())}
              className="mt-4"
              disabled={date ? isToday(date) : false}
            >
              Go to Today
            </Button>
          </div>
          <div className="md:col-span-2 max-h-[60vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-center md:text-left">
              Appointments for {date ? format(date, 'PPP') : '...'}
            </h3>
            <div className="space-y-4 py-4">
              {filteredMeetings.length > 0 ? filteredMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center space-x-4 p-4 rounded-lg bg-secondary/50">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{meeting.phone_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(meeting.booked_at_date, 'p')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`tel:${meeting.phone_number}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </Link>
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 h-full">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="font-semibold">No appointments scheduled</p>
                  <p className="text-sm">Select a different date to view other appointments.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
