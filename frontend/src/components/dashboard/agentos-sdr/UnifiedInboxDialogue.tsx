"use client";

import React, { JSX, memo, useCallback, useState, useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Hand,
  Search,
  MessageCircle,
  Mail,
  Phone,
  MoreHorizontal,
  Send,
  Loader2,
  Check,
  Wand2,
  FileText,
  CalendarCheck,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// --- TYPE DEFINITIONS ---
type Message = { type: "user" | "ai" | "sdr"; content: string };
type Tag = { text: string; type: "info" | "warning" | "success" | "danger" };
export type Conversation = {
  id: string;
  customer: string;
  avatar: string;
  channel: "WhatsApp" | "Instagram" | "Facebook" | "Gmail";
  lastMessage: string;
  thread: Message[];
  status: "Needs Attention" | "AI Handled" | "Resolved";
  timestamp: string;
  subject: string;
  tags: Tag[];
  fromEmail?: string;
  engagementScore?: number;
  leadId?: string;
};

// --- UTILITY & CONSTANTS ---
const cn = (...args: Array<string | false | null | undefined>) => args.filter(Boolean).join(" ");

const channelIcons: { [key: string]: JSX.Element } = {
  WhatsApp: <MessageCircle className="h-4 w-4 text-destructive" />,
  Gmail: <Mail className="h-4 w-4 text-destructive" />,
  Phone: <Phone className="h-4 w-4 text-destructive" />,
  Facebook: <MessageCircle className="h-4 w-4 text-destructive" />,
  Instagram: <MessageCircle className="h-4 w-4 text-destructive" />,
};

// Removed dummy conversations - using only real API data

// --- REAL API ---
async function getConversationSummary({ conversationHistory }: { conversationHistory: string }) {
  try {
    const response = await fetch('/api/conversations/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate summary' }));
      return { message: errorData.error || 'Failed to generate conversation summary' };
    }

    const data = await response.json();
    return { data: { summary: data.summary } };
  } catch (error) {
    console.error('Error fetching conversation summary:', error);
    return { message: 'Network error: Unable to generate summary' };
  }
}

// --- SUB-COMPONENTS ---

const ConversationList: React.FC<{
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (convo: Conversation) => void;
  channelFilter: string;
  setChannelFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}> = memo(
  ({ conversations, selectedId, onSelect, channelFilter, setChannelFilter, statusFilter, setStatusFilter }) => (
    <div className="md:col-span-4 lg:col-span-3 border-r flex flex-col h-full bg-background">
      <div className="p-4 border-b space-y-3">
        <h3 className="font-semibold text-sm">Conversations</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-9 bg-muted/50 h-10" />
        </div>
        <div className="flex gap-2">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Channels</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Gmail">Gmail</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
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
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No conversations available</p>
              <p className="text-xs text-muted-foreground mt-1">Your conversations will appear here once you start messaging leads.</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedId === convo.id 
                    ? "bg-primary/10 border-primary shadow-sm" 
                    : "border-transparent hover:bg-muted/50",
                )}
                onClick={() => onSelect(convo)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/20">{convo.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{convo.customer}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {channelIcons[convo.channel]}
                        <span>{convo.channel}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{convo.timestamp}</p>
                </div>
                <h3 className="font-medium text-sm mb-1 truncate">{convo.subject}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{convo.lastMessage}</p>
                {convo.tags && convo.tags.length > 0 && (
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    {convo.tags.map((tag) => (
                      <Badge 
                        key={tag.text} 
                        variant={tag.type === "success" ? "default" : "outline"} 
                        className="text-xs px-2 py-0.5"
                      >
                        {tag.text}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  ),
);
ConversationList.displayName = "ConversationList";

const ChatPanel: React.FC<{
  conversation: Conversation | null;
  onSendReply: (content: string) => void;
  onUpdateStatus: (id: string, status: "Deal Closed" | "Lost") => void;
  isSending: boolean;
}> = memo(({ conversation, onSendReply, onUpdateStatus, isSending }) => {
  const [replyContent, setReplyContent] = useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleSend = () => {
    onSendReply(replyContent);
    setReplyContent("");
  };

  if (!conversation) {
    return (
      <div className="md:col-span-5 lg:col-span-5 flex items-center justify-center h-full text-muted-foreground">
        <p>Select a conversation to view</p>
      </div>
    );
  }

  return (
    <div className="md:col-span-5 lg:col-span-5 flex flex-col bg-background h-full">
      <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3 bg-muted/30">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/20">{conversation.avatar}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              {conversation.customer}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {channelIcons[conversation.channel] ?? null}
              <span>{conversation.channel}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(conversation.id, "Deal Closed")}>
            <Check className="mr-2 h-4 w-4" /> Mark Resolved
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="space-y-4 max-w-4xl mx-auto">
          {conversation.thread.map((msg, index) => (
            <div key={`${msg.type}-${msg.content.slice(0, 10)}-${index}`} className={cn("flex items-start gap-3", msg.type === "sdr" ? "justify-end" : "")}>
              {(msg.type === "user" || msg.type === "ai") && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className={msg.type === "ai" ? "bg-blue-500/20" : "bg-muted"}>
                    {msg.type === "user" ? conversation.avatar : "AI"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "p-4 rounded-xl max-w-[70%] shadow-sm",
                  msg.type === "user" && "bg-muted",
                  msg.type === "ai" && "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
                  msg.type === "sdr" && "bg-primary text-primary-foreground",
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.type === "sdr" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary/20">You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className=" border-t bg-background space-y-3 p-4">
        <Textarea
          placeholder={`Reply to ${conversation.customer}...`}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className="bg-secondary min-h-[100px]"
        />
        <div className="flex justify-between items-center">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <FileText className="mr-2 h-4 w-4" /> Templates
            </Button>
            <Button variant="ghost" size="sm">
              <Wand2 className="mr-2 h-4 w-4" /> AI Suggest
            </Button>
          </div>
          <Button onClick={handleSend} disabled={isSending || !replyContent}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});
ChatPanel.displayName = "ChatPanel";

const LeadDetailsPanel: React.FC<{
  conversation: Conversation | null;
  onTakeOver: (convo: Conversation) => void;
}> = memo(({ conversation, onTakeOver }) => {
  if (!conversation) {
    return <div className="md:col-span-3 lg:col-span-4 border-l flex flex-col h-full"></div>;
  }

  return (
    <div className="md:col-span-3 lg:col-span-4 border-l flex flex-col h-full bg-muted/20">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Name</span>
                <span className="font-semibold">{conversation.customer}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground font-medium">Contact</span>
                <span className="font-medium truncate max-w-[180px]">{conversation.fromEmail}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground font-medium">Source</span>
                <div className="flex items-center gap-1.5">
                  {channelIcons[conversation.channel]}
                  <span className="font-medium">{conversation.channel}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium">Engagement Score</p>
                  <span className="text-sm font-bold">{conversation.engagementScore ?? 0}/100</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-primary transition-all"
                    style={{ width: `${conversation.engagementScore ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-sm font-medium mb-2 text-muted-foreground">AI Summary</p>
                <ConversationSummary conversation={conversation.thread.map((t) => t.content).join("\n")} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-10">
                <Wand2 className="mr-2 h-4 w-4" /> AI Suggest Reply
              </Button>
              <Button variant="outline" className="w-full justify-start h-10">
                <CalendarCheck className="mr-2 h-4 w-4" /> Schedule Appointment
              </Button>
              <Button variant="outline" className="w-full justify-start h-10">
                <Clock className="mr-2 h-4 w-4" /> Set Reminder
              </Button>
              <Button 
                variant="default" 
                className="w-full h-10 mt-3" 
                onClick={() => onTakeOver(conversation)}
              >
                Take Over Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
});
LeadDetailsPanel.displayName = "LeadDetailsPanel";

const ConversationSummary: React.FC<{ conversation: string }> = ({ conversation }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  React.useEffect(() => {
    let mounted = true;
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const result = await getConversationSummary({ conversationHistory: conversation });
        if (mounted) {
          if (result.data) setSummary(result.data.summary);
          else setError(result.message || "Failed to get summary.");
        }
      } catch (e) {
        if (mounted) setError("An unexpected error occurred.");
        console.error("Error fetching conversation summary:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSummary();
    return () => {
      mounted = false;
    };
  }, [conversation]);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
      </div>
    );
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  return <p className="text-sm pt-1">{summary}</p>;
};

// --- MAIN DIALOG COMPONENT ---

interface UnifiedInboxDialogProps {
  onTakeOver?: (convo: Conversation) => void;
  initialConversation?: Conversation | null;
  label?: string;
}

const UnifiedInboxDialog: React.FC<UnifiedInboxDialogProps> = ({
  onTakeOver,
  initialConversation = null,
  label = "Open Unified Inbox",
}) => {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversation ?? null,
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const user = useAppSelector((state) => state.auth.user);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    if (!user) {
      toast.error('Please log in to view conversations');
      return;
    }

    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load conversations' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.conversations && data.conversations.length > 0) {
        setConversations(data.conversations);
        setSelectedConversation(data.conversations[0]);
      } else {
        // No conversations available - show empty state
        setConversations([]);
        setSelectedConversation(null);
        toast.info('No conversations found. Start messaging your leads!');
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load conversations';
      toast.error(`Error: ${errorMessage}`);
      // Show empty state on error
      setConversations([]);
      setSelectedConversation(null);
    }
  }, [user]);

  // Load conversations when dialog opens
  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user, loadConversations]);

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((convo) => {
      const channelMatch = channelFilter === "All" || convo.channel === channelFilter;
      const statusMatch = statusFilter === "All" || convo.status === statusFilter;
      return channelMatch && statusMatch;
    });
  }, [conversations, channelFilter, statusFilter]);

  React.useEffect(() => {
    if (initialConversation) {
      setSelectedConversation(initialConversation);
    } else if (!selectedConversation && filteredConversations.length > 0) {
      setSelectedConversation(filteredConversations[0]);
    } else if (
      selectedConversation &&
      !filteredConversations.some((c) => c.id === selectedConversation.id)
    ) {
      setSelectedConversation(filteredConversations[0] ?? null);
    }
  }, [filteredConversations, selectedConversation, initialConversation]);

  const handleSendReply = useCallback(
    async (content: string) => {
      if (!content || !selectedConversation) return;

      if (!user) {
        toast.error("You must be logged in to send messages");
        return;
      }

      setIsSending(true);
      try {
        // Get lead details to find the recipient identifier
        const leadResponse = await fetch(`/api/leads/${selectedConversation.leadId || selectedConversation.id}`);
        if (!leadResponse.ok) {
          throw new Error("Failed to fetch lead details");
        }
        const leadData = await leadResponse.json();
        const lead = leadData.lead;

        if (!lead) {
          throw new Error("Lead not found");
        }

        // Determine which API to call based on channel and get recipient identifier
        let apiEndpoint = "";
        let recipient = "";
        const payload = {
          userId: user.id,
          message: content,
        };

        switch (selectedConversation.channel) {
          case "WhatsApp":
            apiEndpoint = "/api/messages/whatsapp";
            recipient = lead.phone_number;
            break;
          case "Instagram":
            apiEndpoint = "/api/messages/instagram";
            recipient = lead.metadata?.instagram_id || lead.phone_number;
            break;
          case "Facebook":
            apiEndpoint = "/api/messages/messenger";
            recipient = lead.metadata?.facebook_id || lead.phone_number;
            break;
          default:
            toast.error("Unsupported channel for sending messages");
            setIsSending(false);
            return;
        }

        if (!recipient) {
          throw new Error(`No ${selectedConversation.channel} identifier found for this lead`);
        }

        // Add recipient to payload
        payload.to = recipient;

        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        // Add the message to the local conversation
        const newReply: Message = { type: "sdr", content };
        const updatedConversation = {
          ...selectedConversation,
          thread: [...selectedConversation.thread, newReply],
          lastMessage: content,
        };

        setConversations((prev) =>
          prev.map((c) => (c.id === selectedConversation.id ? updatedConversation : c))
        );
        setSelectedConversation(updatedConversation);

        toast.success("Message sent successfully");
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error(error instanceof Error ? error.message : "Failed to send message");
      } finally {
        setIsSending(false);
      }
    },
    [selectedConversation, user]
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: "Deal Closed" | "Lost") => {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, status: "Resolved" } : c)));
      if (selectedConversation?.id === id) {
        setSelectedConversation((prev) => (prev ? { ...prev, status: "Resolved" } : prev));
      }
      toast("Conversation Updated", { description: `Conversation status updated to ${status}.` });
    },
    [selectedConversation],
  );

  const handleTakeOverInternal = useCallback(
    (convo: Conversation) => {
      if (onTakeOver) onTakeOver(convo);
      toast("Taken over", { description: `You are now handling ${convo.customer}` });
    },
    [onTakeOver],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Hand className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-orange-500 bg-clip-text text-transparent">
              {conversations.filter((c) => c.status === "Needs Attention").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active conversations</p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] h-[90vh] md:max-w-7xl md:h-[85vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">Unified Inbox</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Manage all customer conversations from WhatsApp, Instagram, Facebook & Gmail
              </DialogDescription>
            </div>
            {user && (
              <Badge variant="outline" className="ml-auto">
                {conversations.length} total
              </Badge>
            )}
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversation?.id ?? null}
            onSelect={setSelectedConversation}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <ChatPanel
            conversation={selectedConversation}
            onSendReply={handleSendReply}
            onUpdateStatus={handleUpdateStatus}
            isSending={isSending}
          />
          <LeadDetailsPanel conversation={selectedConversation} onTakeOver={handleTakeOverInternal} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedInboxDialog;