import React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CalendarCheck, Clock } from "lucide-react";
import { Lead } from "@/lib/types/leadTypes";
import { useAppDispatch } from "@/lib/hooks";
import { scheduleBooking } from "@/lib/features/leadsSlice";

interface Props {
  lead: Lead;
}

const TIME_SLOTS = ["10:00 AM", "02:00 PM", "04:00 PM"];

const ScheduleBookingFollowUp: React.FC<Props> = ({ lead }) => {
  const dispatch = useAppDispatch();
  const [date, setDate] = React.useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSetBooking = async () => {
    if (!date || !selectedTime) {
      toast.error("Please select both a date and a time for the booking.");
      return;
    }

    const booking = new Date(date);
    const [time, modifier] = selectedTime.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hours = Number(hourStr);
    const minutes = Number(minuteStr);

    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    booking.setHours(hours, minutes, 0, 0);
    const booked_timestamp = booking.toISOString();

    setLoading(true);
    const toastId = toast.loading("Scheduling booking...");
    try {
      await dispatch(
        scheduleBooking({
          id: lead?.id,
          booked_timestamp,
        })
      ).unwrap();

      toast.success("Booking scheduled!", { id: toastId });
      setIsOpen(false);
      setDate(undefined);
      setSelectedTime(null);
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : (err as any)?.message ?? "Failed to schedule booking.";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" onClick={() => setIsOpen(!isOpen)}>
          <CalendarCheck className="mr-2" />
          Schedule Booking
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book for {lead.phone_number}</DialogTitle>
        </DialogHeader>

        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={(d: Date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return d < today;
          }}
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          {TIME_SLOTS.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTime(time)}
            >
              {time}
            </Button>
          ))}
        </div>

        <Button
          className="w-full mt-4"
          onClick={handleSetBooking}
          disabled={loading}
        >
          <Clock className="mr-2" />
          Set Booking
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleBookingFollowUp;
