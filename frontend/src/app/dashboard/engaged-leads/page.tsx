'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLeads, selectLeads, selectLeadsError, selectLeadsLoading } from '@/lib/features/leadsSlice';
import { Lead } from '@/lib/types/leadTypes';
import { ITEMS_PER_PAGE } from '@/lib/types/constants';

const ScoreIndicator = ({ score }: { score: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24">
        <Progress value={score} className="h-2" />
      </div>
      <span className="font-medium text-sm text-foreground">{score}</span>
    </div>
  );
};

export default function EngagedLeadsPage() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector(selectLeads);
  const loading = useAppSelector(selectLeadsLoading);
  const error = useAppSelector(selectLeadsError);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Lead; direction: 'ascending' | 'descending' } | null>({ key: 'conversation_score', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

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
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  if (loading === 'pending') {
    return <div className="p-4">Loading engaged leads...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  const pageCount = Math.ceil(sortedLeads.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Engaged Leads</h1>
        <p className="text-muted-foreground mt-1">
          Review all engaged WhatsApp leads and their AI-generated conversion score.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Engaged Leads</CardTitle>
          <CardDescription>
            A list of all leads currently in engagement, sorted by the highest conversion potential.
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
                    <Button variant="ghost" onClick={() => requestSort('conversation_score')}>
                      Conversion Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('temperature')}>
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('updated_at')}>
                      Last Activity
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{lead.phone_number}</TableCell>
                    <TableCell>
                      <ScoreIndicator score={Number(lead.conversation_score || 0)} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          lead.temperature === 'hot' ? 'bg-destructive text-destructive-foreground font-bold' :
                          lead.temperature === 'warm' ? 'bg-yellow-500 dark:bg-yellow-600 text-white font-semibold' :
                          'bg-blue-500 dark:bg-blue-600 text-white'
                        }
                      >
                        {lead.temperature}
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
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Conversation</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Not Interested</DropdownMenuItem>
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
              Showing <strong>{paginatedLeads.length}</strong> of <strong>{sortedLeads.length}</strong> leads.
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
    </div>
  );
}