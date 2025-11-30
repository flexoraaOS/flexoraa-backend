'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/api/supabase';
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Lead } from '@/lib/types/leadTypes';



interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
}

export default function AssignLeadsManagerView() {
  const { user, isManager } = useAppSelector((state) => state.auth);

  const [unassignedLeads, setUnassignedLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [selectedSdrId, setSelectedSdrId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isManager || !user?.id) return;

    async function loadManagerData() {
      setLoading(true);
      try {
        const leadsPromise = supabase
          .from('leads')
          .select('id, phone_number, status, created_at')
          .eq('user_id', user?.id);

        const teamPromise = supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('manager_id', user?.id);

        const [leadsResult, teamResult] = await Promise.all([leadsPromise, teamPromise]);

        if (leadsResult.error) throw leadsResult.error;
        if (teamResult.error) throw teamResult.error;

        setUnassignedLeads(leadsResult.data);
        setTeamMembers(teamResult.data);
      } catch (error) {
        console.error("Failed to load manager data:", error);
        toast.error("Could not load data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadManagerData();
  }, [user, isManager]);

  // Handle selecting/deselecting all leads
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(unassignedLeads.map(lead => lead?.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  // Handle selecting a single lead
  const handleSelectLead = (leadId: number, checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(prev => [...prev, leadId]);
    } else {
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    }
  };

  // The core function to reassign leads
  const handleAssignLeads = async () => {
    if (selectedLeadIds.length === 0 || !selectedSdrId) {
      toast.error('Please select leads and an SDR to assign them to.');
      return;
    }

    const toastId = toast.loading('Assigning leads...');
    const { error } = await supabase
      .from('leads')
      .update({ user_id: selectedSdrId }) // Change the owner
      .in('id', selectedLeadIds);

    if (error) {
      toast.error('Failed to assign leads.', { id: toastId });
    } else {
      toast.success(`${selectedLeadIds.length} leads assigned successfully!`, { id: toastId });
      
      // Refresh the list of unassigned leads by removing the ones we just assigned
      setUnassignedLeads(prev => prev.filter(lead => !selectedLeadIds.includes(lead?.id)));
      setSelectedLeadIds([]);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Leads</CardTitle>
        <CardDescription>
          Select leads and assign them to a member of your team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Select onValueChange={setSelectedSdrId} value={selectedSdrId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an SDR..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member?.id} value={member?.id}>
                  {member.first_name} {member.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignLeads} disabled={selectedLeadIds.length === 0 || !selectedSdrId}>
            Assign ({selectedLeadIds.length}) Selected Leads
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLeadIds.length > 0 && selectedLeadIds.length === unassignedLeads.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedLeads.length > 0 ? (
                unassignedLeads.map((lead) => (
                  <TableRow key={lead?.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeadIds.includes(lead?.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead?.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>{lead.phone_number}</TableCell>
                    <TableCell>{lead.status}</TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    You have no unassigned leads.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
