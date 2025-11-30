
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Bot, Clock, CheckCircle, Settings, PlusCircle, MessageCircle, Mail, Instagram, Facebook, Calendar as CalendarIcon, ArrowUpDown, MoreHorizontal, BrainCircuit, Target, Percent, TrendingUp, TrendingDown, Hand, UserCheck, Search, Wand2, Send, Loader2, Star, Check, Flame, FileText, BarChart, Trophy, Heart, MessageSquareReply, AtSign, RefreshCw, GitCompareArrows, Image as ImageIcon, ThumbsUp, ThumbsDown, MessageCircleQuestion, Lightbulb, UserX, PieChart, MessageSquare } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, Sector, BarChart as RechartsBarChart, Bar, LabelList, FunnelChart, Funnel, LineChart, Line } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, subDays, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getConversationSummary } from '../leados/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { AiChatAnalysis } from '@/components/ai/AIChatAnalysis';


const allConversationData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    const received = 200 + Math.floor(Math.random() * 300);
    const replied = Math.floor(received * (0.85 + Math.random() * 0.14));
    return {
        name: format(date, 'MMM d'),
        date: format(date, 'yyyy-MM-dd'),
        received,
        replied,
    };
}).reverse();

const channelVolumeData = [
    { channel: 'WhatsApp', count: 4500, fill: "#25D366" },
    { channel: 'Instagram', count: 2500, fill: "#E4405F" },
    { channel: 'Facebook', count: 1500, fill: "#1877F2" },
    { channel: 'Gmail', count: 1500, fill: "#D93025" },
]

const initialEngagementFeedData = [
  {
    id: "e1",
    type: "comment" as const,
    user: { name: "Ben Carter", handle: "@bencarter", avatar: "BC" },
    content: "Just bought the new leather jacket, can't wait for it to arrive! 🔥",
    source: { name: "on your post 'Summer Collection Launch'", platform: "Instagram", thumbnail: 'https://placehold.co/100x100.png?text=Post1' },
    timestamp: "2h ago",
    sentiment: "Positive" as const,
    status: "Auto-Reply" as const,
    aiReply: "Thanks for your order, @bencarter! We're sure you'll love it. Let us know what you think when it arrives! 😊",
  },
  {
    id: "e2",
    type: "mention" as const,
    user: { name: "Marketing Weekly", handle: "@marketingweekly", avatar: "MW" },
    content: "Shoutout to @Flexoraa for their awesome AI tools. Seriously streamlining our workflow!",
    source: { name: "in a new post", platform: "Facebook", thumbnail: 'https://placehold.co/100x100.png?text=Post2' },
    timestamp: "5h ago",
    sentiment: "Positive" as const,
    status: "Needs SDR" as const,
    aiReply: "Thanks for the shoutout, @marketingweekly! We're thrilled to hear Flexoraa is making a difference for your team. 🚀",
  },
  {
    id: "e3",
    type: "comment" as const,
    user: { name: "AnonymousUser123", handle: "@anon123", avatar: "A" },
    content: "When will you restock the blue hoodies? It's been out of stock for weeks.",
    source: { name: "on your post 'Hoodie Restock Alert'", platform: "Instagram", thumbnail: 'https://placehold.co/100x100.png?text=Post3' },
    timestamp: "1d ago",
    sentiment: "Negative" as const,
    status: "Needs SDR" as const,
    aiReply: "Hey @anon123, thanks for asking! We're expecting a restock in the next 2-3 weeks. Would you like me to add you to the notification list?",
  },
];

const mentionsFeedData: EngagementItem[] = [
  {
    id: "m1",
    type: "mention",
    user: { name: "Tech Reviews", handle: "@techreviews", avatar: "TR" },
    content: "Just started using @Flexoraa's AgentOS and it's a game changer for managing DMs. Highly recommend!",
    source: { name: "in a new post", platform: "Facebook", thumbnail: 'https://placehold.co/100x100.png?text=Post4' },
    timestamp: "1h ago",
    sentiment: "Positive",
    status: "Needs SDR",
    aiReply: "Wow, thank you so much for the kind words! We're so happy you're loving AgentOS. Let us know if you need anything at all! 🙌",
  }
];

type EngagementItem = typeof initialEngagementFeedData[0];

const recentConversations = [
    { 
      id: 'C1', 
      customer: 'Jacob Jones', 
      avatar: 'JJ', 
      subject: "Inquiry about the new collection",
      lastMessage: 'Hey, I saw your new collection on IG. Can you tell me more about the materials used in the leather jacket?',
      channel: 'Instagram', 
      status: 'Needs Attention',
      timestamp: '2m ago',
      tags: [{ text: 'New Lead', type: 'info' }, { text: 'High Intent', type: 'success' }],
      thread: [
          { type: 'user', content: "Hey, I saw your new collection on IG. Can you tell me more about the materials used in the leather jacket? It looks amazing! Also, do you ship to Canada?" },
          { type: 'ai', content: "Thanks for reaching out! Our jackets are made from ethically sourced lambskin. We do ship to Canada! Shipping takes 5-7 business days." },
          { type: 'user', content: "That's great to hear. One last thing, what's your return policy?" },
      ],
      fromEmail: 'jacob.jones',
      toEmail: '@your_brand_handle',
      timeWaiting: '2m',
      engagementScore: 92,
    },
    { 
      id: 'C2', 
      customer: 'Floyd Miles', 
      avatar: 'FM', 
      subject: "Question about my order #FM-12345",
      lastMessage: 'Hi, I received my order but one of the items is damaged. Can you help me with a return?',
      channel: 'WhatsApp', 
      status: 'Needs Attention',
      timestamp: '2d ago',
      tags: [{ text: 'Support Request', type: 'warning' }],
      thread: [
          { type: 'user', content: "Hi, I received my order #FM-12345 but one of the items is damaged. It's the blue ceramic mug. Can you help me with a return or replacement? Thanks." },
      ],
      fromEmail: '+1-555-222-3333',
      toEmail: 'Your Business Number',
      timeWaiting: '1h',
      engagementScore: 68,
    },
    { 
      id: 'C3', 
      customer: 'Wade Warren', 
      avatar: 'WW', 
      subject: "Partnership Proposal",
      lastMessage: 'Hello, my name is Wade and I run a marketing agency. I would love to discuss a potential collaboration...',
      channel: 'Gmail', 
      status: 'AI Handled',
      timestamp: '3d ago',
      tags: [{ text: 'Outreach', type: 'default' }, { text: 'To Review', type: 'info' }],
       thread: [
          { type: 'user', content: "Hello Flexoraa Team,\nMy name is Wade Warren and I run a marketing agency focused on e-commerce growth. I've been following your brand for a while and I'm very impressed with your products. I would love to discuss a potential collaboration to help scale your online presence.\n\nAre you free for a brief call next week?\n\nBest,\nWade" },
          { type: 'ai', content: "Hi Wade, thanks for your interest! We've forwarded your message to our partnerships team. They will review your proposal and get back to you if there's a good fit. Best regards." },
      ],
      fromEmail: 'wade.warren@agency.com',
      toEmail: 'partners@flexoraa.com',
      timeWaiting: 'N/A',
      engagementScore: 75,
    },
    { 
      id: 'C4', 
      customer: 'Darlene Robertson', 
      avatar: 'DR', 
      subject: "Is this item available in your store?",
      lastMessage: 'Hi, I saw a post on Facebook about a new floral dress. Is it available in your downtown store?',
      channel: 'Facebook', 
      status: 'Resolved',
      timestamp: '4d ago',
      tags: [{ text: 'Product Inquiry', type: 'default' }],
      thread: [
          { type: 'user', content: "Hi, I saw a post on Facebook about a new floral dress. Is it available in your downtown store, or is it online only? I'd love to try it on!" },
          { type: 'sdr', content: "Hi Darlene! That dress is an online exclusive right now, but we offer free returns if the fit isn't perfect. Let me know if you have any other questions!" },
      ],
      fromEmail: 'darlene.robertson',
      toEmail: 'Your Page Name',
      timeWaiting: 'N/A',
      engagementScore: 55,
    },
];

const agentPerformance = [
    { name: 'Support Bot Alpha', conversations: 1254, resolutionRate: 92, avatar: '🤖' },
    { name: 'Sales Assistant', conversations: 876, resolutionRate: 88, avatar: '💼' },
    { name: 'General Inquiries', conversations: 2341, resolutionRate: 95, avatar: '❓' },
]

const sdrPerformanceData = {
    appointmentShowUpRate: { value: 85, trend: 2.5 },
    followUpCompletionRate: { value: 92, trend: -1.0 },
    aiFallbackRate: { value: 78, trend: 5.0 },
    avgTakeoverTime: { value: 15, trend: -2.1 },
    sdrDrivenConversionRate: { value: 12, trend: 1.5 },
};

const sdrBreakdownData = {
    showUpRate: [
        { sdr: 'Samantha Ray', value: 90, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Alex Green', value: 82, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Ben Carter', value: 84, avatar: 'https://placehold.co/40x40.png' },
    ],
    conversionRate: [
        { sdr: 'Samantha Ray', value: 15, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Alex Green', value: 11, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Ben Carter', value: 10, avatar: 'https://placehold.co/40x40.png' },
    ],
    followUpRate: [
        { sdr: 'Samantha Ray', value: 95, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Alex Green', value: 90, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Ben Carter', value: 88, avatar: 'https://placehold.co/40x40.png' },
    ],
    fallbackRate: [
        { sdr: 'Samantha Ray', value: 75, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Alex Green', value: 80, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Ben Carter', value: 79, avatar: 'https://placehold.co/40x40.png' },
    ],
    takeoverTime: [
        { sdr: 'Samantha Ray', value: 12, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Alex Green', value: 18, avatar: 'https://placehold.co/40x40.png' },
        { sdr: 'Ben Carter', value: 16, avatar: 'https://placehold.co/40x40.png' },
    ],
};

const leadNurturingFunnelData = [
    { name: 'Assigned to SDR', value: 500, fill: '(var(--chart-5)' },
    { name: 'SDR First Contact', value: 400, fill: '(var(--chart-4)' },
    { name: 'SDR Nurturing', value: 320, fill: '(var(--chart-3)' },
    { name: 'Meeting Booked by SDR', value: 150, fill: '(var(--chart-2)' },
    { name: 'Closed by SDR', value: 95, fill: '(var(--chart-1)' },
];

const channelIcons = {
    WhatsApp: <MessageCircle className="h-5 w-5 text-green-500" />,
    Instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    Facebook: <Facebook className="h-5 w-5 text-blue-600" />,
    Gmail: <Mail className="h-5 w-5 text-red-500" />,
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  return (
    <g>
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor={fill} floodOpacity="0.6" />
        </filter>
      </defs>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" fill={fill} className="text-2xl font-bold font-headline">
        {payload.channel}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="(var(--foreground)" className="text-xl">
        {`${value.toLocaleString()}`}
      </text>
      <text x={cx} y={cy} dy={40} textAnchor="middle" fill="(var(--muted-foreground)" className="text-base">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow)"
      />
    </g>
  );
};


const AgentPerformanceItem = ({ name, avatar, conversations, resolutionRate }: { name: string, avatar: string, conversations: number, resolutionRate: number }) => {
    return (
        <div className="flex items-center gap-4 group">
            <Avatar className="h-12 w-12 transition-transform duration-300 group-hover:scale-110">
                <AvatarFallback className="bg-secondary text-2xl group-hover:bg-background">{avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{conversations.toLocaleString()} conversations</p>
            </div>
            <div className="text-right w-20">
                <p className="font-bold text-foreground">{resolutionRate}%</p>
                <Progress value={resolutionRate} className="h-1.5 mt-1"/>
            </div>
        </div>
    )
}

const allConversationsData = [
    ...recentConversations
];

type Conversation = typeof allConversationsData[0];


const getTagStyles = (type: string) => {
    switch (type) {
        case 'success': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: return 'bg-secondary text-secondary-foreground';
    }
}


const AllConversationsDialog = ({ initialConversation }: { initialConversation?: Conversation | null }) => {
    const [open, setOpen] = React.useState(false);
    const [conversations, setConversations] = React.useState<Conversation[]>(allConversationsData);
    const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null);
    const [replyContent, setReplyContent] = React.useState('');
    const [isSending, setIsSending] = React.useState(false);
    const [channelFilter, setChannelFilter] = React.useState('All');
    const [statusFilter, setStatusFilter] = React.useState('All');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if(initialConversation) {
            setSelectedConversation(initialConversation);
        } else if (filteredConversations.length > 0) {
            setSelectedConversation(filteredConversations[0]);
        }
    }, [initialConversation]);
    
    const filteredConversations = React.useMemo(() => {
        return conversations.filter(convo => {
            const channelMatch = channelFilter === 'All' || convo.channel === channelFilter;
            const statusMatch = statusFilter === 'All' || convo.status === statusFilter;
            return channelMatch && statusMatch;
        });
    }, [conversations, channelFilter, statusFilter]);
    
    React.useEffect(() => {
      if (open && filteredConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(filteredConversations[0]);
      }
    }, [open, filteredConversations, selectedConversation]);

    const messages = selectedConversation ? selectedConversation.thread : [];

    React.useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [selectedConversation, messages]);

    const handleSendReply = () => {
        if (!replyContent || !selectedConversation) return;
        setIsSending(true);
        setTimeout(() => {
            const newReply = { type: 'sdr' as const, content: replyContent };
            const updatedConversation = { ...selectedConversation, thread: [...selectedConversation.thread, newReply] };
            setConversations(prev => prev.map(c => c.id === selectedConversation.id ? updatedConversation : c));
            setSelectedConversation(updatedConversation);
            toast({
                title: "Reply Sent!",
                description: `Your message to ${selectedConversation.customer} has been sent.`,
            });
            setReplyContent('');
            setIsSending(false);
        }, 1000);
    };
    
    const handleUpdateStatus = (id: string, status: 'Deal Closed' | 'Lost') => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved' } : c));
        if (selectedConversation && selectedConversation.id === id) {
            setSelectedConversation(prev => ({ ...prev!, status: 'Resolved' }));
        }
         toast({
            title: "Conversation Updated",
            description: `Conversation status updated to ${status}.`
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                    <MessageCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12,540</div>
                    <p className="text-xs text-muted-foreground"><span className="text-green-500">+18.2%</span> from last month</p>
                </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] h-[90vh] md:max-w-7xl md:h-[80vh] flex flex-col p-0">
                <div className="p-4 border-b">
                    <DialogTitle className="text-lg font-semibold font-headline">Unified Inbox</DialogTitle>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden flex-1">
                    {/* Left Panel */}
                    <div className="md:col-span-4 lg:col-span-3 border-r flex flex-col">
                        <div className="p-3 border-b space-y-2">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input placeholder="Search here..." className="pl-9 bg-background h-9"/>
                            </div>
                            <div className="flex gap-2">
                                <Select value={channelFilter} onValueChange={setChannelFilter}>
                                    <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Filter Channel..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Channels</SelectItem>
                                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                        <SelectItem value="Instagram">Instagram</SelectItem>
                                        <SelectItem value="Facebook">Facebook</SelectItem>
                                        <SelectItem value="Gmail">Gmail</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Filter Status..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Statuses</SelectItem>
                                        <SelectItem value="Needs Attention">Needs Attention</SelectItem>
                                        <SelectItem value="AI Handled">AI Handled</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {filteredConversations.map((convo) => (
                                    <button 
                                        key={convo.id}
                                        className={cn(
                                            "w-full text-left p-2.5 rounded-lg border border-transparent transition-colors",
                                            selectedConversation?.id === convo.id 
                                                ? "bg-secondary border-primary/20"
                                                : "hover:bg-secondary/50"
                                        )}
                                        onClick={() => setSelectedConversation(convo)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">{convo.avatar}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-semibold text-sm">{convo.customer}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                                        </div>
                                        <h3 className="font-medium text-sm mt-2 truncate">{convo.subject}</h3>
                                        <p className="text-xs text-muted-foreground mt-1 truncate">{convo.lastMessage}</p>
                                        <div className="mt-2 flex gap-1.5 flex-wrap">
                                            {convo.tags.map(tag => (
                                                <Badge key={tag.text} variant="outline" className={cn("text-xs px-1.5 py-0.5", getTagStyles(tag.type))}>
                                                    {tag.text}
                                                </Badge>
                                            ))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Center Panel */}
                    <div className="md:col-span-5 lg:col-span-5 flex flex-col bg-muted/20">
                        {selectedConversation ? (
                            <>
                                <div className="p-3 border-b flex items-center justify-between flex-wrap gap-2 bg-background">
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        {channelIcons[selectedConversation.channel as keyof typeof channelIcons]}
                                        {selectedConversation.customer}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm"><Check className="mr-2 h-4 w-4"/> Close</Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                 <DropdownMenuItem onClick={() => handleUpdateStatus(selectedConversation.id, 'Deal Closed')}>
                                                    <Star className="mr-2 h-4 w-4 text-green-400"/>
                                                    Mark as Deal Closed
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(selectedConversation.id, 'Lost')}>
                                                    <Hand className="mr-2 h-4 w-4 text-red-400"/>
                                                    Mark as Lost
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                                                <DropdownMenuItem>Assign to team member</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Mark as spam</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 md:p-6">
                                    <div className="space-y-6">
                                        {messages.map((msg, index) => (
                                            <div key={index} className={cn("flex items-end gap-2", msg.type === 'sdr' ? 'justify-end' : '')}>
                                                {(msg.type === 'user' || msg.type === 'ai') && (
                                                     <Avatar className="h-8 w-8">
                                                        <AvatarImage src={`https://i.pravatar.cc/40?u=${selectedConversation.customer}`} />
                                                        <AvatarFallback>{msg.type === 'user' ? selectedConversation.avatar : 'AI'}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn(
                                                    "p-3 rounded-lg max-w-md",
                                                    msg.type === 'user' && 'bg-background shadow-sm',
                                                    msg.type === 'ai' && 'bg-blue-500/10 text-blue-900 dark:text-blue-200 border border-blue-500/20',
                                                    msg.type === 'sdr' && 'bg-primary text-primary-foreground',
                                                )}>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                                {msg.type === 'sdr' && (
                                                     <Avatar className="h-8 w-8">
                                                        <AvatarFallback>You</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="p-4 border-t bg-background space-y-3">
                                    <Textarea
                                        placeholder={`Reply to ${selectedConversation.customer}...`}
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        className="bg-secondary"
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm"><FileText className="mr-2 h-4 w-4" /> Templates</Button>
                                            <Button variant="ghost" size="sm"><Wand2 className="mr-2 h-4 w-4" /> AI Suggest</Button>
                                        </div>
                                        <Button
                                            onClick={handleSendReply}
                                            disabled={isSending || !replyContent}
                                        >
                                            {isSending ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="mr-2 h-4 w-4" />
                                            )}
                                            Send
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Select a conversation to view</p>
                            </div>
                        )}
                    </div>
                    {/* Right Panel */}
                    <div className="md:col-span-3 lg:col-span-4 border-l flex flex-col">
                        <ScrollArea className="flex-1">
                            {selectedConversation && (
                                <div className="p-6 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Lead Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Name</span>
                                                <span className="font-medium">{selectedConversation.customer}</span>
                                            </div>
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Contact</span>
                                                <span className="font-medium">{selectedConversation.fromEmail}</span>
                                            </div>
                                             <div className="flex justify-between">
                                                <span className="text-muted-foreground">Source</span>
                                                <span className="font-medium">{selectedConversation.channel}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader>
                                            <CardTitle>AI Insights</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label className="text-xs">Confidence Score</Label>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={selectedConversation.engagementScore} />
                                                    <span>{selectedConversation.engagementScore}/100</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-xs">AI Summary</Label>
                                                <p className="text-sm text-muted-foreground">Lead is asking about product materials and shipping, showing high purchase intent.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const EngagementDialog = () => {
    const [engagementFeed, setEngagementFeed] = React.useState(initialEngagementFeedData);
    const [mentionsFeed, setMentionsFeed] = React.useState(mentionsFeedData);
    const [activeTab, setActiveTab] = React.useState("comments");
    const [filter, setFilter] = React.useState("all");
    const [selectedItem, setSelectedItem] = React.useState<EngagementItem | null>(initialEngagementFeedData[0]);

    const handleItemAction = (itemId: string, action: 'resolve' | 'send', collection: 'engagement' | 'mentions') => {
        const updateFeed = (feed: EngagementItem[]) => feed.map(item =>
            item.id === itemId ? { ...item, status: 'Resolved' as const } : item
        );

        if(collection === 'engagement') {
            setEngagementFeed(updateFeed(engagementFeed));
        } else {
            setMentionsFeed(updateFeed(mentionsFeed));
        }
        
        toast({
            title: action === 'resolve' ? "Item Resolved" : "Reply Sent!",
            description: `The item has been updated.`,
        });
    };
    
    const sentimentAnalyticsData = [
        { name: 'Positive', value: 65, fill: '(var(--chart-2)' },
        { name: 'Neutral', value: 25, fill: '(var(--chart-3)' },
        { name: 'Negative', value: 10, fill: '(var(--chart-1)' },
    ];
    
    const engagementTrendData = Array.from({ length: 7 }, (_, i) => ({
      name: format(subDays(new Date(), 6 - i), 'eee'),
      comments: Math.floor(Math.random() * 20) + 10,
      mentions: Math.floor(Math.random() * 5) + 2,
    }));

    const getSentimentStyles = (sentiment: 'Positive' | 'Neutral' | 'Negative') => {
        switch (sentiment) {
            case 'Positive': return 'text-green-500 bg-green-500/10';
            case 'Negative': return 'text-red-500 bg-red-500/10';
            default: return 'text-yellow-500 bg-yellow-500/10';
        }
    };
    
    const currentFeed = activeTab === 'comments' ? engagementFeed : mentionsFeed;
    const filteredFeed = React.useMemo(() => {
        if (filter === 'all') return currentFeed;
        return currentFeed.filter(item => {
             if (filter === 'unanswered' || filter === 'needs-review') return item.status === 'Needs SDR';
             if (filter === 'mentions') return item.type === 'mention';
             return true;
        })
    }, [filter, currentFeed]);

    React.useEffect(() => {
        if(filteredFeed.length > 0) {
            setSelectedItem(filteredFeed[0]);
        } else {
            setSelectedItem(null);
        }
    }, [filteredFeed])


    const renderFeed = (items: EngagementItem[], collection: 'engagement' | 'mentions') => (
        <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
            {items.length > 0 ? items.map(item => (
                <Card 
                    key={item.id} 
                    className={cn("cursor-pointer transition-all", selectedItem?.id === item.id ? "border-primary shadow-lg" : "hover:border-primary/50")}
                    onClick={() => setSelectedItem(item)}
                >
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10"><AvatarFallback>{item.user.avatar}</AvatarFallback></Avatar>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{item.user.name} <span className="text-muted-foreground font-normal">{item.user.handle}</span></p>
                                    <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                                </div>
                                <p className="text-sm mt-1">{item.content}</p>
                                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4"/>
                                    <span>{item.source.name} on {item.source.platform}</span>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className={getSentimentStyles(item.sentiment)}>{item.sentiment}</Badge>
                                <Badge variant={item.status === 'Auto-Reply' || item.status === 'Resolved' ? 'default' : 'destructive'} className={cn(item.status === 'Auto-Reply' || item.status === 'Resolved' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
                                    {item.status === 'Needs SDR' ? <MessageCircleQuestion className="h-3 w-3 mr-1.5"/> : <CheckCircle className="h-3 w-3 mr-1.5"/>}
                                    {item.status}
                                </Badge>
                            </div>
                             <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-8">Reply</Button>
                                <Button variant="ghost" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); handleItemAction(item.id, 'resolve', collection); }}>Mark Resolved</Button>
                                <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">Ignore</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )) : (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                    <MessageSquare className="h-10 w-10 mb-4" />
                    <h3 className="font-semibold">No items match your filter</h3>
                    <p className="text-sm">Try selecting a different filter option.</p>
                </div>
            )}
            </div>
        </ScrollArea>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="lg:col-span-1 cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Engagements</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">48</div>
                        <p className="text-xs text-muted-foreground"><span className="text-green-500">+8</span> mentions & comments</p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="font-headline text-lg">AgentOS Engagement Panel</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
                    <div className="md:col-span-8 flex flex-col border-r">
                        <Tabs defaultValue="comments" className="flex flex-col flex-1" onValueChange={setActiveTab}>
                            <TabsList className="m-4">
                                <TabsTrigger value="comments">Comments</TabsTrigger>
                                <TabsTrigger value="mentions">Mentions</TabsTrigger>
                                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                            </TabsList>
                            <TabsContent value="comments" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-4 pb-4 border-b">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Search comments..." className="pl-8 bg-background"/>
                                        </div>
                                        <Select value={filter} onValueChange={setFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="unanswered">Unanswered</SelectItem>
                                                <SelectItem value="needs-review">Needs Review</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {renderFeed(filteredFeed, 'engagement')}
                            </TabsContent>
                             <TabsContent value="mentions" className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-4 pb-4 border-b">
                                   <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input placeholder="Search mentions..." className="pl-8 bg-background"/>
                                        </div>
                                         <Select value={filter} onValueChange={setFilter}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filter..."/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="unanswered">Unanswered</SelectItem>
                                                <SelectItem value="needs-review">Needs Review</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {renderFeed(filteredFeed, 'mentions')}
                            </TabsContent>
                             <TabsContent value="analytics" className="flex-1 overflow-y-auto p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold font-headline text-xl">AI Engagement Analysis</h3>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm">This Week</Button>
                                        <Button variant="outline" size="sm">Last 7 Days</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Comments</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">1,254</p></CardContent></Card>
                                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Mentions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">321</p></CardContent></Card>
                                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">% Auto-Handled by AI</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">85%</p></CardContent></Card>
                                    <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">% Escalated to SDR</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">15%</p></CardContent></Card>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <Card className="lg:col-span-2">
                                        <CardHeader><CardTitle>Sentiment Analysis</CardTitle></CardHeader>
                                        <CardContent className="grid grid-cols-2 gap-4">
                                            <div className="h-[200px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsPieChart>
                                                        <Tooltip />
                                                        <Pie data={sentimentAnalyticsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                                            const RADIAN = Math.PI / 180;
                                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                            return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{`${(percent * 100).toFixed(0)}%`}</text>;
                                                        }}>
                                                            {sentimentAnalyticsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                        </Pie>
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div>
                                                 <h4 className="font-semibold mb-2">Top Themes</h4>
                                                <ul className="space-y-2 text-sm">
                                                    <li className="flex items-start"><span className="text-green-400 mr-2">🟢</span><div><strong>Positive:</strong> Praise for product quality, good customer service.</div></li>
                                                    <li className="flex items-start"><span className="text-yellow-400 mr-2">🟡</span><div><strong>Neutral:</strong> Questions about shipping times, feature requests.</div></li>
                                                    <li className="flex items-start"><span className="text-red-400 mr-2">🔴</span><div><strong>Negative:</strong> Complaints about out-of-stock items.</div></li>
                                                </ul>
                                            </div>
                                        </CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader><CardTitle>AI Narrative</CardTitle></CardHeader>
                                        <CardContent className="text-sm text-muted-foreground space-y-2 italic bg-secondary p-4 rounded-lg">
                                            <p>This week saw a 15% increase in total engagements, driven by the "Summer Sale" post on Instagram.</p>
                                            <p>Positive sentiment is high (65%), mainly praising product quality. Negative sentiment (10%) is mostly related to stock availability for the blue hoodie.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                     <Card className="lg:col-span-2">
                                        <CardHeader><CardTitle>Engagement Trends (Last 7 Days)</CardTitle></CardHeader>
                                        <CardContent className="h-[200px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={engagementTrendData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" fontSize={12} />
                                                    <YAxis fontSize={12} />
                                                    <Tooltip />
                                                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                                                    <Line type="monotone" dataKey="comments" stroke="(var(--chart-1)" />
                                                    <Line type="monotone" dataKey="mentions" stroke="(var(--chart-2)" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader><CardTitle>AI Recommendations</CardTitle></CardHeader>
                                        <CardContent>
                                            <ul className="space-y-3">
                                                <li className="flex items-start gap-2 text-sm"><Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0"/><span>Post between <strong>6-8 PM</strong> for peak engagement.</span></li>
                                                <li className="flex items-start gap-2 text-sm"><Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0"/><span>Address "out of stock" questions proactively in your next post.</span></li>
                                                <li className="flex items-start gap-2 text-sm"><Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0"/><span>Create a saved reply for common pricing questions.</span></li>
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <aside className="md:col-span-4 bg-secondary/30 p-4 flex flex-col gap-4 overflow-y-auto">
                        {selectedItem ? (
                            <>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-base">Context</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-3">
                                            <img src={selectedItem.source.thumbnail} alt="Post thumbnail" className="w-16 h-16 rounded-md object-cover"/>
                                            <div>
                                                <p className="font-semibold text-sm">Post: {selectedItem.source.name}</p>
                                                <p className="text-xs text-muted-foreground">Platform: {selectedItem.source.platform}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="flex-1">
                                    <CardHeader className="pb-2"><CardTitle className="text-base">Thread</CardTitle></CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Avatar className="h-8 w-8"><AvatarFallback>{selectedItem.user.avatar}</AvatarFallback></Avatar>
                                            <p className="bg-background p-2 rounded-lg text-sm">{selectedItem.content}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-base">AI Suggestion</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="bg-background p-3 rounded-lg text-sm border border-primary/20">{selectedItem.aiReply}</div>
                                        <div className="flex gap-2 mt-3">
                                            <Button className="flex-1" onClick={() => handleItemAction(selectedItem.id, 'send', activeTab === 'comments' ? 'engagement' : 'mentions')}>Send Reply</Button>
                                            <Button variant="outline" className="flex-1"><RefreshCw className="mr-2 h-4 w-4"/>Re-generate</Button>
                                        </div>
                                         <Button variant="secondary" className="w-full mt-2"><GitCompareArrows className="mr-2 h-4 w-4"/>Escalate to DM</Button>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                                <MessageSquare className="h-10 w-10 mb-4" />
                                <h3 className="font-semibold">Select an item</h3>
                                <p className="text-sm">Choose a comment or mention to see the context and reply.</p>
                            </div>
                        )}
                    </aside>
                </div>
            </DialogContent>
        </Dialog>
    )
}


const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(dayAfter.getDate() + 2);

const agentosAppointments = [
    { date: today, time: '10:30 AM', lead: 'Alex Johnson', with: 'Support Bot Alpha', conversation: "User asked for a refund for order #12345. AI has gathered details and tagged for human review. User seems frustrated but is willing to wait for a resolution. Meeting booked to finalize." },
    { date: today, time: '03:00 PM', lead: 'Sophia Brown', with: 'Sales Assistant', conversation: "User inquired about bulk pricing for product XYZ. AI provided initial details and sensed high purchase intent. Booked a call for the sales team to provide a custom quote. User is very responsive." },
    { date: tomorrow, time: '09:00 AM', lead: 'Ken Watanabe', with: 'Support Bot Alpha', conversation: "Follow-up regarding invoice #12345. User is confused about a specific charge. AI has pulled up the invoice details. A call is booked to walk the user through the invoice line by line." },
];

const AppointmentSummary = ({ conversation }: { conversation: string }) => {
  const [summary, setSummary] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError('');
      try {
        const result = await getConversationSummary({ conversationHistory: conversation });
        if (result.data) {
          setSummary(result.data.summary);
        } else {
           setError(result.message || 'Failed to get summary.');
        }
      } catch (e) {
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [conversation]);

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-2">
        <p className="text-sm">{summary}</p>
    </div>
  );
};

const SdrMetricDialog = ({
  title,
  data,
  icon,
  unit = '',
}: {
  title: string;
  data: { sdr: string; value: number; avatar: string }[];
  icon: React.ReactNode;
  unit?: string;
}) => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {icon} {title}
        </DialogTitle>
        <DialogDescription>
          Detailed breakdown by Sales Development Representative.
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SDR</TableHead>
            <TableHead className="text-right">Metric</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.sdr}>
              <TableCell className="font-medium flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback>{item.sdr.charAt(0)}</AvatarFallback>
                </Avatar>
                {item.sdr}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {item.value.toLocaleString()}{unit}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DialogContent>
  );
};


export default function AgentOSDashboard() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [appointmentDate, setAppointmentDate] = React.useState<Date | undefined>();

  React.useEffect(() => {
    // We set the date range in a useEffect to avoid hydration mismatches
    const today = new Date();
    setDateRange({ from: subDays(today, 29), to: today });
    setAppointmentDate(today);
  }, []);

  const onPieEnter = React.useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, [setActiveIndex]);

  const conversationData = React.useMemo(() => {
    if (!dateRange?.from) {
        return allConversationData.slice(-7);
    }
    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? startOfDay(dateRange.to) : fromDate;

    return allConversationData.filter(d => {
        const dDate = startOfDay(new Date(d.date));
        return dDate >= fromDate && dDate <= toDate;
    })
  }, [dateRange]);

  const selectedAppointments = agentosAppointments.filter(
    (app) => appointmentDate && format(app.date, 'yyyy-MM-dd') === format(appointmentDate, 'yyyy-MM-dd')
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">AgentOS Dashboard</h1>
        <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Appointments
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Appointments</DialogTitle>
                  <DialogDescription>
                    View booked appointments by date. Click an appointment for an AI summary.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={appointmentDate}
                      onSelect={setAppointmentDate}
                      className="rounded-md border"
                      modifiers={{ booked: agentosAppointments.map(a => a.date) }}
                      modifiersStyles={{ booked: { border: '2px solid (var(--primary)', borderRadius: 'var(--radius)' } }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                        Appointments for {appointmentDate ? format(appointmentDate, "PPP") : "..."}
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {selectedAppointments.length > 0 ? (
                        <ul className="space-y-4">
                            {selectedAppointments.map((app, index) => (
                             <li key={index}>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button className="flex items-center space-x-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary w-full text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
                                            <div className="flex-shrink-0 bg-primary/20 text-primary p-2 rounded-lg">
                                                <Clock className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold">{app.time}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    With <span className="font-medium text-foreground">{app.lead}</span> and {app.with}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-green-400 border-green-400/50 bg-green-500/10">Booked</Badge>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Bot className="h-6 w-6 text-primary" />
                                                <h4 className="font-semibold font-headline">AI Conversation Summary</h4>
                                            </div>
                                            <AppointmentSummary conversation={app.conversation}/>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </li>
                            ))}
                        </ul>
                        ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No appointments for this date.</p>
                        </div>
                        )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" asChild>
                <Link href="/dashboard/ai-persona">
                    <Settings className="mr-2 h-4 w-4" />
                    AI Persona & Knowledge
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AllConversationsDialog />
        {/* <channelIn /> */}
        <Card className="transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          <Link href="/dashboard/campaign-intelligence">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Intelligence</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">88/100</div>
              <p className="text-xs text-muted-foreground"><span className="text-green-500">+3 pts</span> avg. quality score</p>
            </CardContent>
          </Link>
        </Card>
        <EngagementDialog />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>SDR Performance & Effectiveness</CardTitle>
            <CardDescription>Track metrics related to SDR follow-ups, AI fallback handling, and lead nurturing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">AI-Booked Show-up Rate</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{sdrPerformanceData.appointmentShowUpRate.value}%</p>
                            <p className={cn("text-xs", sdrPerformanceData.appointmentShowUpRate.trend > 0 ? 'text-green-500' : 'text-red-500')}>{sdrPerformanceData.appointmentShowUpRate.trend > 0 ? '+' : ''}{sdrPerformanceData.appointmentShowUpRate.trend}% vs last month</p>
                        </CardContent>
                    </Card>
                   </DialogTrigger>
                   <SdrMetricDialog title="AI-Booked Show-up Rate" data={sdrBreakdownData.showUpRate} icon={<CheckCircle className="h-5 w-5 text-primary" />} unit="%" />
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">SDR-Driven Conversion</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{sdrPerformanceData.sdrDrivenConversionRate.value}%</p>
                                <p className={cn("text-xs", sdrPerformanceData.sdrDrivenConversionRate.trend > 0 ? 'text-green-500' : 'text-red-500')}>{sdrPerformanceData.sdrDrivenConversionRate.trend > 0 ? '+' : ''}{sdrPerformanceData.sdrDrivenConversionRate.trend}% vs last month</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                     <SdrMetricDialog title="SDR-Driven Conversion" data={sdrBreakdownData.conversionRate} icon={<Trophy className="h-5 w-5 text-primary" />} unit="%" />
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Follow-up Completion</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{sdrPerformanceData.followUpCompletionRate.value}%</p>
                                <p className={cn("text-xs", sdrPerformanceData.followUpCompletionRate.trend > 0 ? 'text-green-500' : 'text-red-500')}>{sdrPerformanceData.followUpCompletionRate.trend > 0 ? '+' : ''}{sdrPerformanceData.followUpCompletionRate.trend}% vs last month</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <SdrMetricDialog title="Follow-up Completion" data={sdrBreakdownData.followUpRate} icon={<Percent className="h-5 w-5 text-primary" />} unit="%" />
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">AI Fallback Handling Rate</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{sdrPerformanceData.aiFallbackRate.value}%</p>
                                <p className={cn("text-xs", sdrPerformanceData.aiFallbackRate.trend > 0 ? 'text-green-500' : 'text-red-500')}>{sdrPerformanceData.aiFallbackRate.trend > 0 ? '+' : ''}{sdrPerformanceData.aiFallbackRate.trend}% vs last month</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                     <SdrMetricDialog title="AI Fallback Handling Rate" data={sdrBreakdownData.fallbackRate} icon={<Hand className="h-5 w-5 text-primary" />} unit="%" />
                </Dialog>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg. Takeover Time</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{sdrPerformanceData.avgTakeoverTime.value} mins</p>
                                <p className={cn("text-xs", sdrPerformanceData.avgTakeoverTime.trend > 0 ? 'text-red-500' : 'text-green-500')}>{sdrPerformanceData.avgTakeoverTime.trend > 0 ? '+' : ''}{sdrPerformanceData.avgTakeoverTime.trend} mins vs last month</p>
                            </CardContent>
                        </Card>
                    </DialogTrigger>
                    <SdrMetricDialog title="Avg. Takeover Time" data={sdrBreakdownData.takeoverTime} icon={<Clock className="h-5 w-5 text-primary" />} unit=" mins" />
                </Dialog>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>SDR Lead Nurturing Funnel</CardTitle>
                        <CardDescription>Tracks lead progression after being assigned to an SDR.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip contentStyle={{ backgroundColor: '(var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid (var(--border)', borderRadius: 'var(--radius)' }}/>
                                <Funnel data={leadNurturingFunnelData} dataKey="value">
                                    <LabelList position="right" fill="(var(--foreground)" dataKey="name" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Fallback Analysis</CardTitle>
                        <CardDescription>Breakdown of conversations requiring SDR intervention.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={[{name: 'Fallback', rate: 78}]} layout="vertical">
                                <XAxis type="number" hide domain={[0, 100]} />
                                <YAxis type="category" dataKey="name" hide/>
                                <Bar dataKey="rate" background={{ fill: '(var(--secondary)', radius: 4 }}>
                                    <LabelList dataKey="rate" position="center" formatter={(value: number) => `${value}% Handled`} className="fill-primary-foreground text-lg font-bold" />
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>
      

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>Response Volume</CardTitle>
                    <CardDescription>Total messages received vs. replied.</CardDescription>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className="w-[300px] justify-start text-left font-normal"
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                            <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                            </>
                            ) : (
                            format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={conversationData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                 <defs>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="(var(--chart-2)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="(var(--chart-2)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReplied" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="(var(--chart-1)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="(var(--chart-1)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="(var(--border) / 0.5)" />
                <XAxis dataKey="name" stroke="(var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false}/>
                <YAxis stroke="(var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false}/>
                <Tooltip 
                  cursor={{ stroke: '(var(--accent)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  contentStyle={{ backgroundColor: '(var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid (var(--border)', borderRadius: 'var(--radius)' }} 
                />
                 <Legend wrapperStyle={{fontSize: "12px"}}/>
                <Area type="monotone" name="Received" dataKey="received" stroke="(var(--chart-2)" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" className="chart-glow-2" dot={false} />
                <Area type="monotone" name="Replied" dataKey="replied" stroke="(var(--chart-1)" strokeWidth={2} fillOpacity={1} fill="url(#colorReplied)" className="chart-glow-1" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Conversation Volume by Channel</CardTitle>
                <CardDescription>Total conversations from each source.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pl-2">
              <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={channelVolumeData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                      <defs>
                          <linearGradient id="gradient-whatsapp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#25D366" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#25D366" stopOpacity={0.2}/>
                          </linearGradient>
                          <linearGradient id="gradient-instagram" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#E4405F" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#E4405F" stopOpacity={0.2}/>
                          </linearGradient>
                           <linearGradient id="gradient-facebook" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1877F2" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#1877F2" stopOpacity={0.2}/>
                          </linearGradient>
                           <linearGradient id="gradient-gmail" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D93025" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#D93025" stopOpacity={0.2}/>
                          </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="(var(--border) / 0.5)"/>
                      <XAxis dataKey="channel" type="category" stroke="(var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis type="number" stroke="(var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                          cursor={{ fill: '(var(--secondary)' }}
                          contentStyle={{ backgroundColor: '(var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid (var(--border)', borderRadius: 'var(--radius)' }} 
                      />
                      <Bar dataKey="count" name="Conversations" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="count" position="top" formatter={(value: number) => value.toLocaleString()} style={{ fill: '(var(--foreground)', fontSize: '12px' }}/>
                          {channelVolumeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`url(#gradient-${entry.channel.toLowerCase()})`} />
                          ))}
                      </Bar>
                  </RechartsBarChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <AiChatAnalysis/>
        </div>
         <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Channel Breakdown</CardTitle>
                <CardDescription>Distribution of conversations.</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                        <Tooltip
                            cursor={{ fill: '(var(--secondary)' }}
                            contentStyle={{ backgroundColor: '(var(--background) / 0.8)', backdropFilter: 'blur(4px)', border: '1px solid (var(--border)', borderRadius: 'var(--radius)' }}
                        />
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={channelVolumeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            dataKey="count"
                            nameKey="channel"
                            onMouseEnter={onPieEnter}
                        >
                            {channelVolumeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} className="chart-glow" style={{ filter: `drop-shadow(0 0 5px ${entry.fill})` }}/>
                            ))}
                        </Pie>
                    </RechartsPieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
