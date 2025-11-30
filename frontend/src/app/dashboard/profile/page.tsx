"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, CreditCard, HelpCircle, Users, Download, Edit, BrainCircuit, ArrowRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { updateUser } from "@/lib/features/authSlice"; 
import { createClient } from '@/lib/api/supabase-client';
import { CompanyDetailsForm } from "@/components/dashboard/CompanyDetailsForm";
import { BuyCreditsDialog } from "@/components/dashboard/BuyCreditDialogue";

interface Payment {
    payment_id: string;
    order_id: string;
    amount: number;
    status: string;
    created_at: string;
    user_id: string;
}

interface Subscription {
    plan_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
}

interface UsageData {
    leados_used: number;
    leados_limit: number;
    agentos_used: number;
    agentos_limit: number;
}


interface EditProfileModalProps {
    user: any;
    isOpen: boolean;
    onClose: () => void;
}

function EditProfileModal({ user, isOpen, onClose }: EditProfileModalProps) {
    const dispatch = useAppDispatch();
    const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
    const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');

    useEffect(() => {
        setFirstName(user?.user_metadata?.first_name || '');
        setLastName(user?.user_metadata?.last_name || '');
    }, [user]);

    const handleSaveChanges = () => {
        dispatch(updateUser({ firstName, lastName }));
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                            First Name
                        </Label>
                        <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                            Last Name
                        </Label>
                        <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main Profile Page Component ---
export default function ProfilePage() {
    const { user, isAdmin, isManager } = useAppSelector((state) => state.auth);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [aiPersona, setAiPersona] = useState<{ agent_name: string; agent_persona: string } | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user?.id) return;

            try {
                const supabase = createClient();
                // Fetch payments
                const { data: paymentsData, error: paymentsError } = await supabase
                    .from('payments')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'success')
                    .order('created_at', { ascending: false });

                if (paymentsError) {
                    console.error('Error fetching payments:', paymentsError);
                } else {
                    setPayments((paymentsData as Payment[]) || []);
                }

                // Fetch active subscription
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .select('plan_name, status, current_period_start, current_period_end')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!subscriptionError && subscriptionData) {
                    setSubscription(subscriptionData as Subscription);
                }

                // Fetch usage data from leads table (LeadOS usage)
                const { count: leadsCount, error: leadsError } = await supabase
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                // Fetch usage data from contact_history (AgentOS conversations)
                const { count: conversationsCount, error: conversationsError } = await supabase
                    .from('contact_history')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!leadsError || !conversationsError) {
                    setUsageData({
                        leados_used: leadsCount || 0,
                        leados_limit: user?.user_metadata?.leados_limit || 2000,
                        agentos_used: conversationsCount || 0,
                        agentos_limit: user?.user_metadata?.agentos_limit || 5000,
                    });
                }

                // Fetch AI persona data from profiles table
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profileError && profileData) {
                    // Check if agent_name and agent_persona exist in profile
                    if (profileData.agent_name || profileData.agent_persona) {
                        setAiPersona({
                            agent_name: profileData.agent_name || 'Not configured',
                            agent_persona: profileData.agent_persona || 'Not configured'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    // This data would come from your 'profiles' table via the user object
    const hasLeadosAccess = user?.user_metadata?.has_leados_access ?? false;
    const hasAgentosAccess = user?.user_metadata?.has_agentos_access ?? false;

    const getRoleName = () => {
        if (isAdmin) return "Administrator";
        if (isManager) return "Manager";
        return "Agent";
    };

    const getInitials = () => {
        const firstName = user?.user_metadata?.first_name || '';
        const lastName = user?.user_metadata?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <div className="space-y-8">
            <EditProfileModal user={user} isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} />
            <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground mt-1">
                    View and manage your account details, subscription, and support.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={user?.user_metadata.avatar_url}
                                        alt={`${user?.user_metadata.full_name ?? 'User'}’s avatar`}
                                        className="h-20 w-20"
                                    />
                                    <AvatarFallback>{getInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <CardTitle className="text-2xl font-headline">{user?.user_metadata.first_name || "User"}</CardTitle>
                                    <CardDescription>{getRoleName()}</CardDescription>
                                </div>
                                <Button className="ml-auto w-full sm:w-auto" onClick={() => setEditModalOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Separator className="my-6" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">Full Name</p>
                                    <p className="text-foreground">{user?.user_metadata.first_name || 'N/A'} {user?.user_metadata.last_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">Email Address</p>
                                    <p className="text-foreground">{user?.email || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">Role</p>
                                    <p className="text-foreground">{getRoleName()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">Member Since</p>
                                    <p className="text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <CompanyDetailsForm />

                    {usageData && (hasLeadosAccess || hasAgentosAccess) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Usage Quotas</CardTitle>
                                <CardDescription>Your current usage for this billing cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {hasLeadosAccess && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-muted-foreground">Leads Processed (LeadOS)</span>
                                            <span className="text-foreground">{usageData.leados_used.toLocaleString()} / {usageData.leados_limit.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(usageData.leados_used / usageData.leados_limit) * 100} />
                                    </div>
                                )}
                                {hasAgentosAccess && (
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-muted-foreground">Agent Conversations (AgentOS)</span>
                                            <span className="text-foreground">{usageData.agentos_used.toLocaleString()} / {usageData.agentos_limit.toLocaleString()}</span>
                                        </div>
                                        <Progress value={(usageData.agentos_used / usageData.agentos_limit) * 100} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" /> AI Persona</CardTitle>
                            <CardDescription>A summary of your active AI agents configuration.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            {aiPersona ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Agent Name</span>
                                        <span className="font-semibold">{aiPersona.agent_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Persona</span>
                                        <Badge variant="secondary">{aiPersona.agent_persona}</Badge>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted-foreground text-sm">No AI persona configured yet</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="destructive" className="w-full">
                                <Link href="/dashboard/ai-persona">
                                    {aiPersona ? 'Edit AI Persona' : 'Configure AI Persona'} <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing & Payments</CardTitle>
                            <CardDescription>Manage your subscription and payment details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between items-baseline">
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">Current Plan</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {subscription ? (
                                            <Badge variant="default">{subscription.plan_name}</Badge>
                                        ) : (
                                            <>
                                                {hasLeadosAccess && <Badge variant="default">LeadOS</Badge>}
                                                {hasAgentosAccess && <Badge variant="default">AgentOS</Badge>}
                                                {!hasLeadosAccess && !hasAgentosAccess && <p className="text-foreground font-semibold">Free Plan</p>}
                                            </>
                                        )}
                                    </div>
                                    {subscription && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/dashboard/settings">Manage Plan</Link>
                                </Button>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-medium text-muted-foreground mb-2">Billing History</h4>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead><span className="sr-only">Download</span></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                                </TableRow>
                                            ) : payments.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center">No payments found</TableCell>
                                                </TableRow>
                                            ) : (
                                                payments.map((payment) => (
                                                    <TableRow key={payment.payment_id}>
                                                        <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                                        <TableCell>₹{(payment.amount / 100).toFixed(2)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-green-400 border-green-400/50">Paid</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                                <a href={`/api/invoice/download/${payment.payment_id}`} download={`invoice-${payment.payment_id}.pdf`}>
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Help & Support</CardTitle>
                            <CardDescription>Need assistance? Find it here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="#"><BookOpen className="mr-2 h-4 w-4" />Help Center</Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href="#"><Users className="mr-2 h-4 w-4" />Community Forum</Link>
                            </Button>
                        </CardContent>
                    </Card>


                    {usageData && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Usage Quotas</CardTitle>
                                <CardDescription>Your current usage for this billing cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span className="font-medium text-muted-foreground">LeadOS Verifications</span>
                                        <BuyCreditsDialog>
                                            <Button variant="secondary" size="sm"><ShoppingCart className="mr-2 h-4 w-4" />Add Credits</Button>
                                        </BuyCreditsDialog>
                                    </div>
                                    <Progress value={(usageData.leados_used / usageData.leados_limit) * 100} />
                                    <p className="text-right text-xs text-muted-foreground mt-1">
                                        {usageData.leados_used.toLocaleString()} / {usageData.leados_limit.toLocaleString()} used
                                    </p>
                                </div>
                                <Separator />
                                <div>
                                    <div className="flex justify-between items-center text-sm mb-2">
                                        <span className="font-medium text-muted-foreground">AgentOS Conversations</span>
                                        <BuyCreditsDialog>
                                            <Button variant="secondary" size="sm"><ShoppingCart className="mr-2 h-4 w-4" />Add Credits</Button>
                                        </BuyCreditsDialog>
                                    </div>
                                    <Progress value={(usageData.agentos_used / usageData.agentos_limit) * 100} />
                                    <p className="text-right text-xs text-muted-foreground mt-1">
                                        {usageData.agentos_used.toLocaleString()} / {usageData.agentos_limit.toLocaleString()} used
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
