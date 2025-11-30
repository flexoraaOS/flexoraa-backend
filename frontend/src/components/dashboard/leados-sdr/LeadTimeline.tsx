import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { List, Clock, PlusCircle, Pencil, MessageSquare, BookMarked } from "lucide-react";
import { Lead } from "@/lib/types/leadTypes";
import { JSX, useMemo } from "react";

interface TimelineEvent {
    type: 'created' | 'updated' | 'note_added' | string; 
    title: string;
    date: string;
    content: string;
}

const eventIcons: { [key: string]: JSX.Element } = {
    created: <PlusCircle className="h-4 w-4 text-destructive" />,
    updated: <Pencil className="h-4 w-4 text-destructive" />,
    note_added: <MessageSquare className="h-4 w-4 text-violet-600" />,
    default: <Clock className="h-4 w-4 text-slate-500" />,
    booked: <BookMarked className="h-4 w-4 text-destructive" />,
};

const LeadTimelineDialog = ({ lead }: { lead: Lead }) => {

    const timeline = useMemo(() => {
        const events: (TimelineEvent | false)[] = [
            lead.created_at ? {
                type: "created",
                title: "Lead Created",
                date: new Date(lead.created_at).toLocaleString(),
                content: `Lead was created for phone number: ${lead.phone_number}.`,
            } : false,

            lead.updated_at ? {
                type: "updated",
                title: "Lead Updated",
                date: new Date(lead.updated_at).toLocaleString(),
                content: "The lead details were last updated.",
            } : false,
            lead.booked_timestamp ? {
                type: "booked",
                title: "Booked At",
                date: new Date(lead.booked_timestamp).toLocaleString(),
                content: "Lead is just booked .",
            } : false,
        ];

        return events
            .filter((event): event is TimelineEvent => Boolean(event))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [lead]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Timeline
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Lead Timeline</DialogTitle>
                    <DialogDescription>
                        A chronological history of all events related to this lead.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {timeline.length > 0 ? (
                        <div className="relative space-y-8 px-6">
                            <div className="absolute left-10 top-2 h-full w-0.5 bg-destructive dark:bg-destructive" />

                            {timeline.map((event, idx) => (
                                <div key={idx} className="relative flex items-start gap-6">
                                    <div className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-destructive">
                                        {eventIcons[event.type] || eventIcons.default}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{event.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{event.date}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 py-12">
                            <Clock className="h-10 w-10 mb-2" />
                            <p className="font-semibold">No Timeline Events</p>
                            <p className="text-sm">There is no history available for this lead yet.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LeadTimelineDialog;