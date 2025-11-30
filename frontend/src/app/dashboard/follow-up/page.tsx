'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import type { Lead } from '@/lib/types/leadTypes';

// UI Components (ensure these paths are correct for your project)
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown, Inbox } from 'lucide-react';

// Reusable type definition for table columns
export interface ColumnDef<TData> {
  header: React.ReactNode;
  accessorKey: keyof TData;
  cell: (row: TData) => React.ReactNode;
}

const ITEMS_PER_PAGE = 10;

// ==================================================================================
//  1. REUSABLE DATA TABLE COMPONENT
//  This component is designed to display, sort, and paginate any array of leads.
// ==================================================================================
interface LeadsDataTableProps {
  title: string;
  description: string;
  columns: ColumnDef<Lead>[];
  data: Lead[]; // This component receives its data directly as a prop
}

function LeadsDataTable({ title, description, columns, data }: LeadsDataTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedLeads = useMemo(() => {
    const sortableItems = [...data];
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
  }, [data, sortConfig]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedLeads, currentPage]);

  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const pageCount = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
      <Card>
        {data.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center p-20 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-6 text-xl font-semibold">No Leads to Display</h3>
            <p className="mt-2 text-sm text-muted-foreground">There are no leads that match the follow-up criteria.</p>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={String(column.accessorKey)}>
                          <Button variant="ghost" onClick={() => requestSort(column.accessorKey as keyof Lead)}>
                            {column.header}
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                      ))}
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map((lead) => (
                      <TableRow key={lead.id} className="hover:bg-secondary/50">
                        {columns.map((column) => (
                          <TableCell key={String(column.accessorKey)}>{column.cell(lead)}</TableCell>
                        ))}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">Showing <strong>{paginatedLeads.length}</strong> of <strong>{data.length}</strong> leads.</div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {pageCount}</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount || pageCount === 0}>Next</Button>
                </div>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}


// ==================================================================================
//  2. MAIN PAGE COMPONENT
//  This is the page that handles fetching, filtering, and displaying the data.
// ==================================================================================
export default function FollowUpLeadsPage() {
  const dispatch = useAppDispatch();
  const allLeads = useAppSelector(selectLeads);
  const loading = useAppSelector(selectLeadsLoading);
  const error = useAppSelector(selectLeadsError);

  // Fetch all leads from the database when the component mounts
  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  // This is the core logic: filter leads based on your specific criteria
  const followUpLeads = useMemo(() => {
    return allLeads.filter(lead => 
      !lead.closed && lead.booked_timestamp
    );
  }, [allLeads]);

  // Define the columns you want to display in the table for these leads
  const columns: ColumnDef<Lead>[] = [
    { accessorKey: 'name', header: 'Name', cell: (lead) => <span className="font-medium">{lead.name}</span> },
    { accessorKey: 'email', header: 'Email', cell: (lead) => <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a> },
    { accessorKey: 'booked_timestamp', header: 'Booking Date', cell: (lead) => <span>{new Date(lead.booked_timestamp!).toLocaleString()}</span> },
    { accessorKey: 'stage', header: 'Current Stage', cell: (lead) => <span>{lead.stage}</span> },
    { accessorKey: 'followup_date', header: 'Next Follow-up', cell: (lead) => <span>{lead.followup_date ? new Date(lead.followup_date).toLocaleDateString() : 'Not Set'}</span> },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><p>Loading leads...</p></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-screen"><p className="text-red-500">Error: {error}</p></div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <LeadsDataTable
        title="Follow-up Leads"
        description="Active leads that have a booking timestamp and are not yet closed."
        columns={columns}
        data={followUpLeads}
      />
    </div>
  );
}