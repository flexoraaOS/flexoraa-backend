'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, ArrowUpDown, Inbox } from 'lucide-react'; // Added Inbox icon
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { Lead, LeadStages } from '@/lib/types/leadTypes';
import { ITEMS_PER_PAGE } from '@/lib/types/constants';

// A generic type for defining table columns, making the component highly reusable
export interface ColumnDef<TData> {
  header: React.ReactNode;
  accessorKey: keyof TData;
  cell: (row: TData) => React.ReactNode;
}

// Props interface for our new component
interface LeadsDataTableProps {
  title: string;
  description: string;
  stageFilter: LeadStages | LeadStages[];
  columns: ColumnDef<Lead>[];
  campaignId?: string; // Optional: to filter leads by a specific campaign
}

export function LeadsDataTable({ title, description, stageFilter, columns, campaignId }: LeadsDataTableProps) {
  const dispatch = useAppDispatch();
  const allLeads = useAppSelector(selectLeads);
  const loading = useAppSelector(selectLeadsLoading);
  const error = useAppSelector(selectLeadsError);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch leads, optionally filtering by campaignId at the API level
    dispatch(fetchLeads({ campaignId }));
  }, [dispatch, campaignId]);

  // Filter leads based on the stageFilter prop
  const processedLeads = useMemo(() => {
    const filters = Array.isArray(stageFilter) ? stageFilter : [stageFilter];
    return allLeads.filter(lead => 
      lead.stage && filters.includes(lead.stage)
    );
  }, [allLeads, stageFilter]);

  // Sorting logic
  const sortedLeads = useMemo(() => {
    const sortableItems = [...processedLeads];
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
  }, [processedLeads, sortConfig]);

  // Pagination logic
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

  if (loading) {
    return <div className="p-4 text-center">Loading leads...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  }

  const pageCount = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);

  return (
    // This wrapper centers the content on the screen
    <div className="flex w-full justify-center pt-10 px-4">
      <div className="w-full max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        {/* Conditionally render the "No Data" box or the data table */}
        {processedLeads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-20 text-center">
              <div className="p-5 bg-secondary rounded-full">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">No Leads Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are currently no leads that match your criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
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
                          <TableCell key={String(column.accessorKey)}>
                            {column.cell(lead)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Add Note</DropdownMenuItem>
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
                <div className="text-sm text-muted-foreground">
                  Showing <strong>{paginatedLeads.length}</strong> of <strong>{processedLeads.length}</strong> leads.
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(pageCount, prev + 1))}
                    disabled={currentPage === pageCount || pageCount === 0}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}