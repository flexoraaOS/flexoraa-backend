'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { Lead } from '@/lib/types/leadTypes';
import { ITEMS_PER_PAGE } from '@/lib/types/constants';

export default function VerifiedLeadsPage() {

  const dispatch = useAppDispatch();
  const allLeads = useAppSelector(selectLeads);
  const loading = useAppSelector(selectLeadsLoading);
  const error = useAppSelector(selectLeadsError);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchLeads());
  }, [dispatch]);
  
  const processedLeads = useMemo(() => {
    return allLeads.filter(lead => 
      lead.status && ['valid', 'invalid'].includes(lead.status.toLowerCase())
    );
  }, [allLeads]);
  console.log(allLeads)

  const sortedLeads = useMemo(() => {
    const sortableItems = [...processedLeads];
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
  }, [processedLeads, sortConfig]);

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
  
  const getVerificationStatusDisplay = (status?: string | null) => {
    const lowerCaseStatus = status?.toLowerCase();
    switch (lowerCaseStatus) {
      case 'valid':
        return { text: 'Verified', className: 'text-green-400 border-green-400/50', Icon: CheckCircle };
      case 'invalid':
        return { text: 'Invalid', className: 'text-red-400 border-red-400/50', Icon: XCircle };
      default:
        return { text: 'Unknown', className: 'text-gray-400 border-gray-400/50', Icon: null };
    }
  };
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
        <h1 className="text-3xl font-bold font-headline">Verified Leads</h1>
        <p className="text-muted-foreground mt-1">
          A list of all leads that have been processed by the AI verification system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
          <CardDescription>
            Review the verification status of all uploaded leads.
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
                      Verification Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('updated_at')}>
                      Verified On
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => {
                  const { text, className, Icon } = getVerificationStatusDisplay(lead.status);
                  return (
                    <TableRow key={lead.id} className="hover:bg-secondary/50">
                      <TableCell className="font-medium">{lead.phone_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={className}>
                          {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                          {text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(lead.updated_at)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
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