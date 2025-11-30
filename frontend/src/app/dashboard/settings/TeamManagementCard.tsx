'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { fetchMyTeam, inviteTeamMember, updateTeamMemberRole, removeTeamMember, TeamMember } from '@/lib/features/teamSlice';
import { supabase } from '@/lib/api/supabase';
import { toast } from 'sonner';

export default function TeamManagementCard() {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [isInviting, setIsInviting] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const { members, loading, error } = useSelector((state: RootState) => state.team);
    const isLoading = loading === 'pending';

    // Fetch team members on component mount
    useEffect(() => {
        const loadTeamMembers = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                dispatch(fetchMyTeam(user.id));
            }
        };

        loadTeamMembers();
    }, [dispatch]);

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        setIsInviting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('You must be logged in to invite team members');
                return;
            }

            await dispatch(inviteTeamMember({
                email: inviteEmail.trim(),
                role: inviteRole,
                invitedBy: user.id
            })).unwrap();

            toast.success('Team member invited successfully!');
            setInviteEmail('');
            setInviteRole('member');
            setIsInviteDialogOpen(false);

            // Refresh the team list
            dispatch(fetchMyTeam(user.id));
        } catch (error) {
            console.error('Failed to invite team member:', error);
            toast.error('Failed to invite team member');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            await dispatch(updateTeamMemberRole({ memberId, role: newRole })).unwrap();
            toast.success('Role updated successfully!');
        } catch (error) {
            console.error('Failed to update role:', error);
            toast.error('Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        try {
            await dispatch(removeTeamMember(memberId)).unwrap();
            toast.success('Team member removed successfully!');
        } catch (error) {
            console.error('Failed to remove team member:', error);
            toast.error('Failed to remove team member');
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'manager': return 'Manager';
            case 'member': return 'Member';
            case 'viewer': return 'Viewer';
            default: return role;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-green-400 border-green-400/50 bg-green-500/10';
            case 'pending': return 'text-yellow-400 border-yellow-400/50 bg-yellow-500/10';
            case 'inactive': return 'text-red-400 border-red-400/50 bg-red-500/10';
            default: return '';
        }
    };

    const formatLastLogin = (lastLogin: string | null) => {
        if (!lastLogin) return 'Never';
        const date = new Date(lastLogin);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
        return date.toLocaleDateString();
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>Manage your team members and their roles.</CardDescription>
                </div>
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite New Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription>
                                Send an invitation to a new team member. They will receive an email with instructions to join.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="member@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="invite-role">Role</Label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleInviteMember} disabled={isInviting}>
                                {isInviting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Inviting...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading team members...
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500">Error loading team members: {error}</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-8">
                        <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Team Members</h3>
                        <p className="text-muted-foreground mb-4">
                            You haven't invited any team members yet. Click the button above to get started.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member: TeamMember) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src="" data-ai-hint="person" />
                                                <AvatarFallback>
                                                    {member.first_name && member.last_name
                                                        ? `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`
                                                        : member.email.charAt(0).toUpperCase()
                                                    }
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium break-words">
                                                    {member.first_name && member.last_name
                                                        ? `${member.first_name} ${member.last_name}`
                                                        : 'Pending User'
                                                    }
                                                </p>
                                                <p className="text-sm text-muted-foreground break-all">{member.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => handleRoleChange(member.id, value)}
                                        >
                                            <SelectTrigger className="w-[150px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatLastLogin(member.last_login)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={member.status === 'active' ? 'default' : 'secondary'}
                                            className={getStatusColor(member.status)}
                                        >
                                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
