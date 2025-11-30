import { Badge } from "@/components/ui/badge";
import { Lead } from "@/lib/types/leadTypes";
import { CheckCircle, XCircle, Clock, Star, TrendingUp, ThumbsDown } from "lucide-react";
import { ColumnDef } from "./LeadsDataTable";

// --- Helper Functions & Components ---

const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    // Returns a more readable format like "Aug 31, 2025"
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const StageBadge = ({ stage }: { stage?: string | null }) => {
    if (!stage) return <Badge variant="secondary">Unknown</Badge>;

    const stageColors: { [key: string]: string } = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        contacted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        converted: 'bg-green-500/10 text-green-400 border-green-500/20',
        unqualified: 'bg-red-500/10 text-red-400 border-red-500/20',
        booked: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };

    return (
        <Badge variant="outline" className={`capitalize ${stageColors[stage] || 'bg-gray-500/10 text-gray-400'}`}>
            {stage}
        </Badge>
    );
};

// --- Column Definitions by Lead Stage ---

// For the special "Verified Leads" view (filters on status, not stage)
export const verifiedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div className="font-medium">{lead.phone_number}</div>,
    },
    {
        header: "Verification Status",
        accessorKey: "status",
        cell: (lead) => {
            const isVerified = lead.status?.toLowerCase() === 'valid';
            const text = isVerified ? 'Verified' : 'Invalid';
            const className = isVerified ? 'text-green-400 border-green-400/50' : 'text-red-400 border-red-400/50';
            const Icon = isVerified ? CheckCircle : XCircle;
            return (
                <Badge variant="outline" className={className}>
                    <Icon className="mr-2 h-3.5 w-3.5" />
                    {text}
                </Badge>
            );
        },
    },
    {
        header: "Verified On",
        accessorKey: "updated_at",
        cell: (lead) => <div className="text-muted-foreground">{formatDate(lead.updated_at)}</div>,
    }
];

// For the "New" leads stage
export const newLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Stage",
        accessorKey: "stage",
        cell: (lead) => <StageBadge stage={lead.stage} />,
    },
    {
        header: "Received On",
        accessorKey: "created_at",
        cell: (lead) => <div className="text-muted-foreground">{formatDate(lead.created_at)}</div>,
    }
];

// For the "Contacted" leads stage
export const contactedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Stage",
        accessorKey: "stage",
        cell: (lead) => <StageBadge stage={lead.stage} />,
    },
    {
        header: "Last Contacted",
        accessorKey: "updated_at",
        cell: (lead) => (
            <div className="flex items-center text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                {formatDate(lead.updated_at)}
            </div>
        ),
    }
];

// For the "Qualified" leads stage
export const qualifiedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Temperature",
        accessorKey: "temperature",
        cell: (lead) => <Badge variant="outline" className="capitalize">{lead.temperature || 'Natural'}</Badge>,
    },
    {
        header: "Stage",
        accessorKey: "stage",
        cell: (lead) => <StageBadge stage={lead.stage} />,
    },
    {
        header: "Qualified On",
        accessorKey: "updated_at",
        cell: (lead) => <div className="text-muted-foreground">{formatDate(lead.updated_at)}</div>,
    }
];

// For the "Converted" leads stage
export const convertedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Status",
        accessorKey: "closed",
        cell: (lead) => (
            <div className="flex items-center font-semibold text-green-500">
                <TrendingUp className="mr-2 h-4 w-4" />
                Converted
            </div>
        ),
    },
    {
        header: "Conversion Date",
        accessorKey: "updated_at",
        cell: (lead) => <div className="font-bold">{formatDate(lead.updated_at)}</div>,
    }
];

// For the "Unqualified" leads stage
export const unqualifiedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Reason / Note",
        accessorKey: "note",
        cell: (lead) => <div className="text-sm text-muted-foreground truncate max-w-xs">{lead.note || 'No reason provided'}</div>,
    },
    {
        header: "Status",
        accessorKey: "stage",
        cell: (lead) => (
             <div className="flex items-center font-semibold text-red-500">
                <ThumbsDown className="mr-2 h-4 w-4" />
                Unqualified
            </div>
        )
    }
];

// For the "Booked" leads stage
export const bookedLeadsColumns: ColumnDef<Lead>[] = [
    {
        header: "Name",
        accessorKey: "name",
        cell: (lead) => <div className="font-medium">{lead.name || 'N/A'}</div>,
    },
    {
        header: "Phone Number",
        accessorKey: "phone_number",
        cell: (lead) => <div>{lead.phone_number}</div>,
    },
    {
        header: "Booking Date",
        accessorKey: "booked_timestamp",
        cell: (lead) => <div className="font-bold">{formatDate(lead.booked_timestamp)}</div>,
    },
    {
        header: "Contacted",
        accessorKey: "contacted",
        cell: (lead) => lead.contacted
            ? <Badge className="bg-blue-500/20 text-blue-400">Contacted</Badge>
            : <Badge variant="outline">Not Contacted</Badge>,
    }
];