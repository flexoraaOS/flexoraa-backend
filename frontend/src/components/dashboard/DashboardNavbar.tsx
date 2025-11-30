'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/ui/logo';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { logoutUser } from '@/lib/features/authSlice';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import {
    UserCircle,
    Settings,
    LogOut,
    Sparkles,
    ChevronDown,
    ChevronRight,
    X,
    MoreHorizontal,
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
    Inbox,
    Phone,
    CalendarCheck,
    Repeat,
    Archive,
    MessageSquare,
    Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardNavbar() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin, isManager } = useAppSelector((state) => state.auth);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        dispatch(logoutUser());
        router.push("/auth/login");
    };

    const getInitials = () => {
        const firstName = user?.user_metadata?.first_name || '';
        const lastName = user?.user_metadata?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    };

    // All navigation items (for mobile menu and "More" dropdown)
    const allNavItems = [
        // LeadOS Features
        { href: '/dashboard/leados', label: 'LeadOS', icon: BarChart2, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/leados/leads-assign', label: 'Leads Assign', icon: AsteriskSquare, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/upload-leads', label: 'Upload Leads', icon: Upload, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/uploaded-leads', label: 'Uploaded Leads', icon: List, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/verified-leads', label: 'Verified Leads', icon: CheckCircle, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/engaged-leads', label: 'Engaged Leads', icon: Zap, subscription: 'leados', group: 'LeadOS' },
        { href: '/dashboard/qualified-leads', label: 'Qualified Leads', icon: Flame, subscription: 'leados', group: 'LeadOS' },

        // AgentOS Features
        { href: '/dashboard/agentos', label: 'AgentOS', icon: ChartArea, subscription: 'agentos', group: 'AgentOS', isSeparator: true },
        { href: '/dashboard/ai-messaging', label: 'AI Messaging', icon: Wand2, subscription: 'agentos', group: 'AgentOS' },
        { href: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare, subscription: 'agentos', group: 'AgentOS' },
        { href: '/dashboard/create-agent', label: 'Create Agent', icon: Wand, subscription: 'agentos', group: 'AgentOS' },
        { href: '/dashboard/agentos-sdr', label: 'SDR-AgentOS', icon: WandSparkles, subscription: 'agentos', group: 'AgentOS' },

        // Role-specific Features
        { href: '/dashboard/leados-sdr', label: 'SDR-LeadOS', icon: TrendingUpDownIcon, roles: ['sdr'], isSeparator: true, group: 'SDR' },
        { href: '/dashboard/create-agent', label: 'Create Agent', icon: RockingChair, roles: ['sdr'], group: 'SDR' },
        { href: '/dashboard/campaign-intelligence', label: 'Campaign Intelligence', icon: BrainCircuit, roles: ['sdr'], group: 'SDR' },
        { href: '/dashboard/admin-dashboard', label: 'Admin Dashboard', icon: ArrowDownLeftFromCircleIcon, roles: ['admin'], group: 'Admin' },

        // Lead Status Links
        { href: '/dashboard/leads/new', label: 'New Leads', icon: Inbox, subscription: 'leados', isSeparator: true, group: 'Lead Status' },
        { href: '/dashboard/leads/contacted', label: 'Contacted', icon: Phone, subscription: 'leados', group: 'Lead Status' },
        { href: '/dashboard/leads/booked', label: 'Demo Booked', icon: CalendarCheck, subscription: 'leados', group: 'Lead Status' },
        { href: '/dashboard/follow-up', label: 'Follow-up', icon: Repeat, subscription: 'leados', group: 'Lead Status' },
        { href: '/dashboard/leads/converted', label: 'Closed', icon: Archive, subscription: 'leados', group: 'Lead Status' },
    ];

    const hasLeadosAccess = user?.user_metadata?.has_leados_access ?? false;
    const hasAgentosAccess = user?.user_metadata?.has_agentos_access ?? false;

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

    // Group items by category for "More" dropdown
    const groupedNavItems = React.useMemo(() => {
        const groups: Record<string, typeof visibleNav> = {};
        for (const item of visibleNav) {
            const group = item.group || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(item);
        }
        return groups;
    }, [visibleNav]);

    // Get first 7 items for main nav, rest go to "More"
    const mainNavItems = visibleNav.slice(0, 7);
    const moreNavItems = visibleNav.slice(7);

    return (
        <TooltipProvider>
            <header 
                className={cn(
                    "sticky top-0 z-50 w-full transition-all duration-300",
                    scrolled 
                        ? "bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-background/5" 
                        : "bg-background/95 backdrop-blur-sm border-b border-border/20"
                )}
            >
                <div className="w-full px-3 sm:px-4 lg:px-6">
                    <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
                        {/* Left side - Logo and mobile menu */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Mobile menu button */}
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="lg:hidden h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                                    >
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent 
                                    side="left" 
                                    className="w-[300px] sm:w-[350px] p-0 bg-background/95 backdrop-blur-xl border-r border-border/40 [&>button]:hidden"
                                >
                                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                    <SheetDescription className="sr-only">
                                        Access dashboard navigation and user settings
                                    </SheetDescription>
                                    
                                    {/* Mobile menu header */}
                                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                                        <Logo />
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-lg hover:bg-primary/10"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    {/* Mobile navigation */}
                                    <ScrollArea className="h-[calc(100vh-180px)]">
                                        <div className="p-4 space-y-6">
                                            {/* Grouped navigation */}
                                            {Object.entries(groupedNavItems).map(([groupName, items], groupIndex) => (
                                                <div key={groupName} className="space-y-2">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                            {groupName}
                                                        </span>
                                                        <div className="flex-1 h-px bg-border/50" />
                                                    </div>
                                                    <nav className="grid gap-1">
                                                        {items.map((item, index) => (
                                                            <Link
                                                                key={item.href}
                                                                href={item.href}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className={cn(
                                                                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                                                    'hover:bg-primary/10 hover:text-primary',
                                                                    pathname === item.href
                                                                        ? 'bg-primary/15 text-primary border-l-2 border-primary'
                                                                        : 'text-muted-foreground hover:translate-x-1'
                                                                )}
                                                                style={{ animationDelay: `${(groupIndex * 5 + index) * 30}ms` }}
                                                            >
                                                                <div className={cn(
                                                                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200",
                                                                    pathname === item.href 
                                                                        ? "bg-primary/20 text-primary" 
                                                                        : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                                                )}>
                                                                    <item.icon className="h-4 w-4" />
                                                                </div>
                                                                <span>{item.label}</span>
                                                                {pathname === item.href && (
                                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                )}
                                                            </Link>
                                                        ))}
                                                    </nav>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    
                                    {/* Mobile menu footer - user section */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40 bg-background/95 backdrop-blur-xl">
                                        <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-muted/30">
                                            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.first_name || 'User'} />
                                                <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/5 text-primary font-medium">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {user?.user_metadata?.first_name || 'User'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {user?.email}
                                                </p>
                                            </div>
                                            <ThemeToggle />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 text-xs hover:bg-primary/10 hover:text-primary"
                                                onClick={() => {
                                                    router.push('/dashboard/profile');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                <UserCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 text-xs hover:bg-primary/10 hover:text-primary"
                                                onClick={() => {
                                                    router.push('/dashboard/settings');
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsMobileMenuOpen(false);
                                                }}
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            
                            {/* Logo */}
                            <Link href="/dashboard" className="flex items-center gap-2 group">
                                <div className="hidden sm:block transition-transform duration-300 group-hover:scale-105">
                                    <Logo />
                                </div>
                                <div className="sm:hidden">
                                    <Logo className="[&>span]:hidden" />
                                </div>
                            </Link>
                        </div>

                        {/* Center - Navigation menu (Desktop & Tablet) */}
                        <nav className="hidden lg:flex items-center justify-center flex-1 max-w-4xl mx-4">
                            <div className="flex items-center gap-0.5 p-1 bg-muted/30 rounded-xl border border-border/30">
                                {mainNavItems.map((item, index) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <React.Fragment key={item.href}>
                                            {item.isSeparator && index > 0 && (
                                                <div className="w-px h-5 bg-border/50 mx-1" />
                                            )}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={item.href}
                                                        className={cn(
                                                            'relative flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-200',
                                                            'hover:bg-background/80 hover:shadow-sm',
                                                            isActive
                                                                ? 'bg-background text-foreground shadow-md'
                                                                : 'text-muted-foreground hover:text-foreground'
                                                        )}
                                                    >
                                                        <item.icon className={cn(
                                                            "h-3.5 w-3.5 xl:h-4 xl:w-4 transition-colors duration-200",
                                                            isActive && "text-primary"
                                                        )} />
                                                        <span className="hidden xl:inline whitespace-nowrap">{item.label}</span>
                                                        {isActive && (
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                                        )}
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" className="xl:hidden">
                                                    <p>{item.label}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </React.Fragment>
                                    );
                                })}
                                
                                {/* More dropdown for remaining items */}
                                {moreNavItems.length > 0 && (
                                    <>
                                        <div className="w-px h-5 bg-border/50 mx-1" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className={cn(
                                                        "h-auto px-2.5 xl:px-3 py-1.5 rounded-lg gap-1.5 text-xs xl:text-sm font-medium",
                                                        "text-muted-foreground hover:text-foreground hover:bg-background/80",
                                                        "data-[state=open]:bg-background data-[state=open]:text-foreground data-[state=open]:shadow-md"
                                                    )}
                                                >
                                                    <MoreHorizontal className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
                                                    <span className="hidden xl:inline">More</span>
                                                    <ChevronDown className="h-3 w-3 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent 
                                                align="end" 
                                                className="w-56 p-2 bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl"
                                            >
                                                {Object.entries(groupedNavItems)
                                                    .filter(([_, items]) => items.some(i => moreNavItems.includes(i)))
                                                    .map(([groupName, items], groupIndex) => {
                                                        const filteredItems = items.filter(i => moreNavItems.includes(i));
                                                        if (filteredItems.length === 0) return null;
                                                        return (
                                                            <React.Fragment key={groupName}>
                                                                {groupIndex > 0 && <DropdownMenuSeparator className="my-1" />}
                                                                <div className="px-2 py-1">
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                                        {groupName}
                                                                    </span>
                                                                </div>
                                                                {filteredItems.map((item) => (
                                                                    <DropdownMenuItem key={item.href} asChild>
                                                                        <Link 
                                                                            href={item.href} 
                                                                            className={cn(
                                                                                "flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-md transition-colors",
                                                                                pathname === item.href && "bg-primary/10 text-primary"
                                                                            )}
                                                                        >
                                                                            <item.icon className="h-4 w-4" />
                                                                            <span>{item.label}</span>
                                                                            {pathname === item.href && (
                                                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                                                            )}
                                                                        </Link>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </>
                                )}
                            </div>
                        </nav>

                        {/* Tablet navigation - simplified */}
                        <nav className="hidden md:flex lg:hidden items-center gap-1">
                            {mainNavItems.slice(0, 5).map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200',
                                                    'hover:bg-primary/10 hover:text-primary',
                                                    isActive
                                                        ? 'bg-primary/15 text-primary'
                                                        : 'text-muted-foreground'
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            <p>{item.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    align="end" 
                                    className="w-56 p-2 bg-background/95 backdrop-blur-xl"
                                >
                                    {visibleNav.slice(5).map((item) => (
                                        <DropdownMenuItem key={item.href} asChild>
                                            <Link 
                                                href={item.href} 
                                                className={cn(
                                                    "flex items-center gap-2.5 px-2 py-2 cursor-pointer rounded-md",
                                                    pathname === item.href && "bg-primary/10 text-primary"
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>

                        {/* Right side - Theme toggle and user menu */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Theme toggle - hidden on smallest screens */}
                            <div className="hidden sm:block">
                                <ThemeToggle />
                            </div>

                            {/* User menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        className={cn(
                                            "flex items-center gap-2 px-2 sm:px-3 py-1.5 h-auto rounded-xl",
                                            "hover:bg-muted/50 transition-all duration-200",
                                            "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                                        )}
                                    >
                                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-primary/10 transition-all duration-200 group-hover:ring-primary/30">
                                            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.first_name || 'User'} />
                                            <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/5 text-primary text-xs font-medium">
                                                {getInitials()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden md:flex flex-col items-start">
                                            <span className="text-sm font-medium leading-none">
                                                {user?.user_metadata?.first_name || 'User'}
                                            </span>
                                            {isAdmin && (
                                                <span className="text-[10px] text-primary font-medium flex items-center gap-1 mt-0.5">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 hidden sm:block" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    align="end" 
                                    className="w-64 p-2 bg-background/95 backdrop-blur-xl border border-border/40 shadow-xl rounded-xl"
                                    sideOffset={8}
                                >
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                                <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/5 text-primary text-lg font-medium">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                                                        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                                                        : user?.user_metadata?.first_name || 'User'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {user?.email}
                                                </p>
                                                {isAdmin && (
                                                    <Badge variant="secondary" className="mt-1 h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0">
                                                        <Sparkles className="h-2.5 w-2.5 mr-1" />
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    
                                    <DropdownMenuSeparator className="my-2" />
                                    
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <button
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 cursor-pointer rounded-lg transition-colors hover:bg-muted"
                                                onClick={() => router.push('/dashboard/profile')}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                                                    <UserCircle className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium">Profile</p>
                                                    <p className="text-xs text-muted-foreground">Manage your account</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <button
                                                className="flex items-center gap-2.5 w-full px-3 py-2.5 cursor-pointer rounded-lg transition-colors hover:bg-muted"
                                                onClick={() => router.push('/dashboard/settings')}
                                            >
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                                                    <Settings className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-medium">Settings</p>
                                                    <p className="text-xs text-muted-foreground">Preferences & config</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    
                                    {/* Theme toggle for mobile in dropdown */}
                                    <div className="sm:hidden px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Theme</span>
                                            <ThemeToggle />
                                        </div>
                                    </div>
                                    
                                    <DropdownMenuSeparator className="my-2" />
                                    
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10">
                                            <LogOut className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>
        </TooltipProvider>
    );
}
