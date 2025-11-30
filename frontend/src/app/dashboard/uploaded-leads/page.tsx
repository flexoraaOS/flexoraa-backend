'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { Lead, LeadStatus } from '@/lib/types/leadTypes';
import { deleteLead, fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { ITEMS_PER_PAGE } from '@/lib/types/constants';

export default function UploadedLeadsPage() {

  const dispatch = useAppDispatch();
  const leads = useAppSelector(selectLeads);
  const loading = useAppSelector(selectLeadsLoading);
  const error = useAppSelector(selectLeadsError);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1)
  
  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);

  const sortedLeads = useMemo(() => {
    const sortableItems = [...leads];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [leads, sortConfig]);

  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedLeads.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedLeads, currentPage]);


  const requestSort = (key: keyof Lead) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleRemove = (id: string | undefined) => {
    if (id) {
      dispatch(deleteLead(id));
    }
  };

  const getStatusDisplay = (status: LeadStatus = 'pending') => {
    switch (status) {
      case 'processed':
        return { text: 'Processed', className: 'text-green-400 border-green-400/50' };
      case 'pending':
        return { text: 'Pending', className: 'text-yellow-400 border-yellow-400/50' };
      case 'invalid':
        return { text: 'Invalid', className: 'text-red-400 border-red-400/50' };
      case 'skipped':
        return { text: 'Skipped', className: 'text-gray-400 border-gray-400/50' };
      default:
        return { text: status, className: 'text-blue-400 border-blue-400/50' };
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toISOString().split('T')[0];
  };
  
  if (loading === 'pending') {
    return <div className="p-4">Loading leads...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  const pageCount = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Uploaded Leads</h1>
        <p className="text-muted-foreground mt-1">
          A list of all leads that have been uploaded to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Leads</CardTitle>
          <CardDescription>
            Review all uploaded leads and their current campaign status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('phone_number')}>
                      Phone Number
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')}>
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('created_at')}>
                      Uploaded On
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => {
                  const statusDisplay = getStatusDisplay(lead.status);
                  return (
                    <TableRow key={lead.id} className="hover:bg-secondary/50">
                      <TableCell className="font-medium">{lead.phone_number}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusDisplay.className}
                        >
                          {statusDisplay.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(lead.created_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                              onClick={() => handleRemove(lead.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              Showing <strong>{paginatedLeads.length}</strong> of <strong>{leads.length}</strong> leads.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}