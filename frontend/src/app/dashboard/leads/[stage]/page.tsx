'use client';

import {
    bookedLeadsColumns,
    contactedLeadsColumns,
    convertedLeadsColumns,
    newLeadsColumns,
    qualifiedLeadsColumns,
    unqualifiedLeadsColumns,
    verifiedLeadsColumns
} from "@/components/dashboard/ColumnDefs";
import { LeadsDataTable } from "@/components/dashboard/LeadsDataTable";
import { LeadStages } from "@/lib/types/leadTypes";
import { useParams } from "next/navigation";
import React from "react";

// This component dynamically renders a data table based on the lead stage
export default function LeadsStagePage() {
    const params = useParams();
    const stage = params?.stage as LeadStages | 'verified';

    const stageConfig = {
        'new': {
            title: "New Leads",
            description: "Fresh leads that have not yet been contacted.",
            columns: newLeadsColumns,
            stageFilter: "new" as LeadStages,
        },
        'contacted': {
            title: "Contacted Leads",
            description: "Leads that have been reached out to.",
            columns: contactedLeadsColumns,
            stageFilter: "contacted" as LeadStages,
        },
        'qualified': {
            title: "Qualified Leads",
            description: "Leads that have been identified as potential customers.",
            columns: qualifiedLeadsColumns,
            stageFilter: "qualified" as LeadStages,
        },
        'booked': {
            title: "Booked Appointments",
            description: "Leads who have successfully booked an appointment.",
            columns: bookedLeadsColumns,
            stageFilter: "booked" as LeadStages,
        },
        'converted': {
            title: "Converted Leads",
            description: "Leads that have been successfully converted into customers.",
            columns: convertedLeadsColumns,
            stageFilter: "converted" as LeadStages,
        },
        'unqualified': {
            title: "Unqualified Leads",
            description: "Leads that have been marked as not a good fit.",
            columns: unqualifiedLeadsColumns,
            stageFilter: "unqualified" as LeadStages,
        },
        'verified': { 
            title: "Verified Leads",
            description: "A list of all leads processed by the AI verification system.",
            columns: verifiedLeadsColumns,
            statusFilter: ['valid', 'invalid'],
        },
    };

    const config = stageConfig[stage];

    if (!config) {
        return <div className="p-4">Invalid lead stage or view: <strong>{stage}</strong></div>;
    }

    const { title, description, columns, ...filters } = config;

    return (
        <LeadsDataTable
            title={title}
            description={description}
            columns={columns}
            {...filters} 
        />
    );
}