'use client';

import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarRail,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import {
    BarChart2,
    Upload,
    List,
    CheckCircle,
    Zap,
    Flame,
    Wand2,
    ChartArea,
    Wand,
    ArrowDownLeftFromCircleIcon,
    TrendingUpDownIcon,
    AsteriskSquare,
    WandSparkles,
    RockingChair,
    BrainCircuit,
    Rocket,
    MessageSquare,
    // Add these new icons for the lead statuses
    Inbox,
    Phone,
    CalendarCheck,
    Repeat,
    Archive,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/lib/hooks';
import { Separator } from '@/components/ui/separator';

// Navigation items
const allNavItems = [
    // LeadOS Features
    { href: '/dashboard/leados', label: 'LeadOS Dashboard', icon: BarChart2, subscription: 'leados' },
    { href: '/dashboard/leados/leads-assign', label: 'Leads Assigning', icon: AsteriskSquare, subscription: 'leados' },
    { href: '/dashboard/upload-leads', label: 'Upload Leads', icon: Upload, subscription: 'leados' },
    { href: '/dashboard/uploaded-leads', label: 'Uploaded Leads', icon: List, subscription: 'leados' },
    { href: '/dashboard/verified-leads', label: 'Verified Leads', icon: CheckCircle, subscription: 'leados' },
    { href: '/dashboard/engaged-leads', label: 'Engaged Leads', icon: Zap, subscription: 'leados' },
    { href: '/dashboard/qualified-leads', label: 'Qualified Leads', icon: Flame, subscription: 'leados' },

    
    // AgentOS Features
    { href: '/dashboard/agentos', label: 'AgentOS Dashboard', icon: ChartArea, subscription: 'agentos', isSeparator: true },
    { href: '/dashboard/ai-messaging', label: 'AI Messaging', icon: Wand2, subscription: 'agentos' },
    { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare, subscription: 'agentos' },
    { href: '/dashboard/create-agent', label: 'Create Agent', icon: Wand, subscription: 'agentos' },
    { href: '/dashboard/agentos-sdr', label: 'SDR-AgentOS', icon: WandSparkles, subscription: 'agentos' },
    
    // Role-specific Features
    { href: '/dashboard/leados-sdr', label: 'SDR-LeadOS', icon: TrendingUpDownIcon, roles: ['sdr'], isSeparator: true },
    { href: '/dashboard/create-agent', label: 'Create Agent', icon: RockingChair, roles: ['sdr'] },
    { href: '/dashboard/campaign-intelligence', label: 'Campaign Intelligence', icon: BrainCircuit, roles: ['sdr'] },
    { href: '/dashboard/admin-dashboard', label: 'Admin Dashboard', icon: ArrowDownLeftFromCircleIcon, roles: ['admin'] },


    // START: New Lead Status Links with a separator before them
    { href: '/dashboard/leads/new', label: 'New Leads', icon: Inbox, subscription: 'leados', isSeparator: true },
    { href: '/dashboard/leads/contacted', label: 'Contacted', icon: Phone, subscription: 'leados' },
    { href: '/dashboard/leads/booked', label: 'Demo Booked', icon: CalendarCheck, subscription: 'leados' },
    { href: '/dashboard/follow-up', label: 'Follow-up', icon: Repeat, subscription: 'leados' },
    { href: '/dashboard/leads/converted', label: 'Closed', icon: Archive, subscription: 'leados' },
    // END: New Lead Status Links
];

export function AppSidebar() {
    const pathname = usePathname();
    const { user, isAdmin, isManager } = useAppSelector((state) => state.auth);

    const hasLeadosAccess = user?.user_metadata?.has_leados_access ?? false;
    const hasAgentosAccess = user?.user_metadata?.has_agentos_access ?? false;

    const isSdr = user?.user_metadata?.role === 'agent';
    const showUpgradeBlock = (isManager || isSdr) && (hasLeadosAccess !== hasAgentosAccess);

    const visibleNav = React.useMemo(() => {
        if (isAdmin) {
            return allNavItems.filter(item => !item.roles || item.roles.includes('admin'));
        }

        if (isManager) {
            return allNavItems.filter(item => {
                if (item.roles && (item.roles.includes('admin') || item.roles.includes('agent'))) {
                    return false;
                }
                if (item.subscription === 'leados') return hasLeadosAccess;
                if (item.subscription === 'agentos') return hasAgentosAccess;
                return true;
            });
        }

        return allNavItems.filter(item => {
            if (item.roles && (item.roles.includes('admin') || item.roles.includes('manager'))) {
                return false;
            }
            if (item.subscription === 'leados') return hasLeadosAccess;
            if (item.subscription === 'agentos') return hasAgentosAccess;
            return true;
        });
    }, [isAdmin, isManager, hasLeadosAccess, hasAgentosAccess]);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex items-left justify-between">
                <div className="group-data-[collapsible=icon]:hidden">
                    <Logo />
                </div>
                <SidebarRail />
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu>
                    {visibleNav.map((item) => (
                        // Use React.Fragment to allow the separator to be a sibling
                        <React.Fragment key={item.href}>
                            {/* RENDER SEPARATOR: Check for the isSeparator flag and render */}
                            {item.isSeparator && <Separator className="my-2" />}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                >
                                    <Link href={item.href} className="flex items-center gap-2">
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </React.Fragment>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="space-y-2">
                {showUpgradeBlock && (
                    <div className="group-data-[collapsible=icon]:hidden">
                        <Separator className="my-4" />
                        <div className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg text-center border border-primary/20">
                            <h4 className="font-semibold font-headline text-foreground">Unlock More Power</h4>
                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Upgrade your plan to access advanced features and higher limits.
                            </p>
                            <Button size="sm" className="w-full gradient-background text-primary-foreground" asChild>
                                <Link href="/pricing">
                                    <Rocket className="mr-2 h-4 w-4" />
                                    Upgrade Plan
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
