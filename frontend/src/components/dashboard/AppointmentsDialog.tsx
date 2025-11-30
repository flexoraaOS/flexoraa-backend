import React, { useState, useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, Bot } from "lucide-react";

// A placeholder for your summary component.
// You would import your actual component here.
const AppointmentSummary = ({ conversation }: { conversation: string }) => {
  return <p className="text-sm text-muted-foreground">{conversation}</p>;
};

// Define the shape of a single appointment object for type-safety
export interface Appointment {
  date: Date;
  time: string;
  leadId: string;
  with: string;
  conversation: string;
}

// Define the props our new component will accept
interface AppointmentsDialogProps {
  appointments: Appointment[];
  triggerButton?: React.ReactNode;
}

export const AppointmentsDialog: React.FC<AppointmentsDialogProps> = ({
  appointments,
  triggerButton,
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedAppointments = useMemo(() => {
    if (!date) return [];
    return appointments
      .filter((app) => isSameDay(app.date, date))
      .sort((a, b) => a.time.localeCompare(b.time)); // Sort by time
  }, [date, appointments]);

  const bookedDays = useMemo(() => appointments.map((a) => a.date), [appointments]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton || ( // Use the provided trigger, or a default one
          <Button variant="outline" className="w-full sm:w-auto">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Appointments
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Appointments</DialogTitle>
          <DialogDescription>
            View booked appointments by date. Click an appointment for an AI summary.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={{ booked: bookedDays }}
              modifiersStyles={{
                booked: {
                  border: "2px solid hsl(var(--primary))",
                  borderRadius: "var(--radius)",
                },
              }}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Appointments for {date ? format(date, "PPP") : "..."}
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {selectedAppointments.length > 0 ? (
                <ul className="space-y-4">
                  {selectedAppointments.map((app, index) => (
                    <li key={index}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary w-full text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                            <div className="flex-shrink-0 bg-primary/20 text-primary p-2 rounded-lg">
                              <Clock className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{app.time}</p>
                              <p className="text-sm text-muted-foreground">
                                With{" "}
                                <span className="font-medium text-foreground">
                                  {app.leadId}
                                </span>{" "}
                                and {app.with}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-500/10">
                              Booked
                            </Badge>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Bot className="h-6 w-6 text-primary" />
                              <h4 className="font-semibold">
                                AI Conversation Summary
                              </h4>
                            </div>
                            <AppointmentSummary conversation={app.conversation} />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No appointments for this date.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};