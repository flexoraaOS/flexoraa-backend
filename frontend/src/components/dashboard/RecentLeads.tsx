'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Lead } from '@/lib/types/leadTypes';

type Props = {
  leads?: Lead[];
  loading?: boolean;
  error?: string | null;
};

const RecentLeads: React.FC<Props> = ({ leads = [], loading, error }) => {
  const getBadgeClass = (status: string | undefined) => {
    switch ((status || '').toLowerCase()) {
      case 'hot':
        return 'bg-red-500/20 text-red-500 border border-red-500/30 font-semibold hover:bg-red-500/30';
      case 'warm':
        return 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-semibold hover:bg-yellow-500/30';
      case 'cold':
        return 'bg-blue-500/20 text-blue-500 border border-blue-500/30 font-semibold hover:bg-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-500 border border-gray-500/30 font-semibold hover:bg-gray-500/30';
    }
  };

  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ));
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-destructive">
            {error}
          </TableCell>
        </TableRow>
      );
    }

    if (!leads || leads.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="text-center text-muted-foreground">
            No recent leads found.
          </TableCell>
        </TableRow>
      );
    }

    return leads.map((lead) => (
      <TableRow key={lead.id} className="hover:bg-muted/40 transition-colors">
        <TableCell className="font-medium">
          {lead.phone_number ?? `Lead-${lead.id}`}
        </TableCell>
        <TableCell>
          <Badge className={getBadgeClass(lead.temperature)}>
            {lead.temperature || 'N/A'}
          </Badge>
        </TableCell>
        <TableCell>
          {lead.stage || 'New'}
        </TableCell>
        <TableCell className="text-muted-foreground">
          {lead.updated_at
            ? formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })
            : 'N/A'}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Leads</CardTitle>
        <CardDescription>
          A snapshot of your latest lead activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderContent()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentLeads;
