'use client';

import React, { JSX, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Instagram, Facebook, Mail, MessageSquare as MessageSquareIcon, Loader2, AlertCircle } from "lucide-react";
import { useAppSelector } from '@/lib/hooks';
import { toast } from 'sonner';

// --- Types ---
type Conversation = {
    id: string;
    customer: string;
    avatar: string;
    subject: string;
    lastMessage: string;
    channel: string;
    timestamp: string;
    tags: Array<{ text: string; type: string }>;
};

type Conversation = typeof dummyConversations[0];

type Conversation = typeof dummyConversations[0];

const getTagStyles = (type: string) => {
    switch (type) {
        case 'success': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'info': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default: return 'bg-secondary text-secondary-foreground';
    }
};

const channelIcons: { [key: string]: JSX.Element } = {
    WhatsApp: <MessageSquareIcon className="h-4 w-4 text-green-500" />,
    Instagram: <Instagram className="h-4 w-4 text-pink-500" />,
    Facebook: <Facebook className="h-4 w-4 text-blue-600" />,
    Gmail: <Mail className="h-4 w-4 text-red-500" />,
};

// --- Reusable Standalone Component ---

export function NewConversationsCard() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const user = useAppSelector((state) => state.auth.user);

    // Fetch conversations when dialog opens
    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchConversations = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/conversations');
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to load conversations' }));
                    throw new Error(errorData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();
                
                if (data.conversations && Array.isArray(data.conversations)) {
                    // Filter to show only new/recent conversations (last 24 hours if we have timestamps)
                    setConversations(data.conversations);
                } else {
                    setConversations([]);
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
                setError(errorMessage);
                toast.error(`Error: ${errorMessage}`);
                setConversations([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();
    }, [isOpen, user]);

    const newConversationsCount = conversations.length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Conversations</CardTitle>
                        <MessageSquareIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newConversationsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {user ? 'from your conversations' : 'Login to view'}
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>New Conversations Inbox</DialogTitle>
                    <DialogDescription>
                        Recent conversations from all channels
                    </DialogDescription>
                </DialogHeader>
                
                {!user ? (
                    <div className="py-8 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Please log in to view conversations</p>
                    </div>
                ) : isLoading ? (
                    <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading conversations...</p>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                        <p className="text-sm font-medium text-destructive">Error loading conversations</p>
                        <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="py-8 text-center">
                        <MessageSquareIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No conversations found</p>
                        <p className="text-xs text-muted-foreground mt-1">Start messaging your leads!</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-3 py-4">{conversations.map((convo) => (
                            <div key={convo.id} className="border p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{convo.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{convo.customer}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {channelIcons[convo.channel]}
                                                <span>{convo.channel}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                                </div>
                                <h3 className="font-medium text-sm mt-2.5 truncate">{convo.subject}</h3>
                                <p className="text-xs text-muted-foreground mt-1 truncate">{convo.lastMessage}</p>
                                <div className="mt-2.5 flex gap-1.5 flex-wrap">
                                    {convo.tags.map(tag => (
                                        <Badge key={tag.text} variant="outline" className={cn("text-xs px-1.5 py-0.5", getTagStyles(tag.type))}>
                                            {tag.text}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}