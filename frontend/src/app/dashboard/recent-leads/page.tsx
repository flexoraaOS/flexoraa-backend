"use client";

import React, { JSX, memo, useCallback, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
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
  X,
  Maximize,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentsDialog } from "@/components/dashboard/leados-sdr/AppoinmentsDialogue";
import { useRouter } from "next/navigation";

// --- TYPE DEFINITIONS ---
type Message = { type: "user" | "ai" | "sdr"; content: string };
type Tag = { text: string; type: "info" | "warning" | "success" | "danger" };
export type Conversation = {
  id: string;
  customer: string;
  avatar: string;
  channel: "WhatsApp" | "Instagram" | "Facebook" | "Gmail" | string;
  lastMessage: string;
  thread: Message[];
  status: "Needs Attention" | "AI Handled" | "Resolved" | string;
  timestamp: string;
  subject: string;
  tags: Tag[];
  fromEmail?: string;
  engagementScore?: number;
};

// --- UTILITY & CONSTANTS ---
const cn = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");

const channelIcons: { [key: string]: JSX.Element } = {
  WhatsApp: <MessageCircle className="h-4 w-4 text-green-500" />,
  Gmail: <Mail className="h-4 w-4 text-red-500" />,
  Phone: <Phone className="h-4 w-4 text-blue-500" />,
  Facebook: <MessageCircle className="h-4 w-4 text-blue-600" />,
  Instagram: <MessageCircle className="h-4 w-4 text-purple-500" />,
};

// --- API FUNCTIONS ---
async function getConversationSummary({
  conversationHistory,
}: {
  conversationHistory: string;
}): Promise<{ data?: { summary: string }; message?: string }> {
  try {
    const response = await fetch("/api/conversations/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversationHistory }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get summary: ${response.status}`);
    }

    const data = await response.json();
    return { data: { summary: data.summary || "No summary available" } };
  } catch (error) {
    console.error("Error fetching conversation summary:", error);
    return { 
      message: error instanceof Error ? error.message : "Failed to generate summary" 
    };
  }
}

async function fetchConversations(): Promise<Conversation[]> {
  try {
    const response = await fetch("/api/conversations");

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch conversations: ${response.status}`);
    }

    const data = await response.json();
    return data.conversations || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    toast.error(`Error: ${error instanceof Error ? error.message : "Failed to load conversations"}`);
    return [];
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
  ({
    conversations,
    selectedId,
    onSelect,
    channelFilter,
    setChannelFilter,
    statusFilter,
    setStatusFilter,
  }) => (
    <div className="border-r flex flex-col h-full min-h-0 bg-background">
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search here..."
            className="pl-9 bg-secondary h-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Filter Channel..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Channels</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Gmail">Gmail</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue placeholder="Filter Status..." />
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
      <ScrollArea className="flex-1 min-h-0">
        {conversations.length === 0 ? (
          <div className="py-8 text-center px-4">
            <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((convo) => (
              <button
                key={convo.id || convo.timestamp}
                className={cn(
                  "w-full text-left p-2.5 rounded-lg border border-transparent transition-colors",
                  selectedId === convo.id
                    ? "bg-secondary border-primary/20"
                    : "hover:bg-secondary/50",
                )}
                onClick={() => onSelect(convo)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {convo.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm">{convo.customer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                </div>
                <h3 className="font-medium text-sm mt-2 truncate">{convo.subject}</h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">{convo.lastMessage}</p>
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {convo.tags.map((tag) => (
                    <Badge
                      key={tag.text}
                      variant="outline"
                      className="text-xs px-1.5 py-0.5"
                    >
                      {tag.text}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
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
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a conversation to view</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-muted/20 h-full min-h-0">
      <div className="p-3 border-b flex items-center justify-between flex-wrap gap-2 bg-background">
        <h2 className="text-base font-bold flex items-center gap-2">
          {channelIcons[conversation.channel] ?? null}
          {conversation.customer}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(conversation.id, "Deal Closed")}
          >
            <Check className="mr-2 h-4 w-4" /> Close
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 p-4 md:p-6">
        <div className="space-y-6">
          {conversation.thread.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex items-end gap-2",
                msg.type === "sdr" ? "justify-end" : "justify-start",
              )}
            >
              {(msg.type === "user" || msg.type === "ai") && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {msg.type === "user" ? conversation.avatar : "AI"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "p-3 rounded-lg max-w-[70%]",
                  msg.type === "user" && "bg-background shadow-sm",
                  msg.type === "ai" &&
                    "bg-blue-500/10 text-blue-900 border border-blue-500/20",
                  msg.type === "sdr" && "bg-primary text-primary-foreground",
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.type === "sdr" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background space-y-3">
        <Textarea
          placeholder={`Reply to ${conversation.customer}...`}
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          className="bg-secondary"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
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
            {isSending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
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
    return (
      <div className="border-l flex-col h-full hidden lg:flex bg-background"></div>
    );
  }

  return (
    <div className="border-l flex-col h-full min-h-0 hidden lg:flex bg-background">
      <ScrollArea className="flex-1 subtle-scrollbar min-h-0">
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{conversation.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact</span>
                <span className="font-medium">{conversation.fromEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{conversation.channel}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Engagement Score</p>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-muted rounded-full w-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${conversation.engagementScore ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {conversation.engagementScore ?? 0}/100
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Summary</p>
                <ConversationSummary conversation={conversation.thread.map(m => m.content).join("\n")} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Wand2 className="mr-2 h-4 w-4" /> Suggest Reply
              </Button>
              <AppointmentsDialog />
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" /> Set Follow-up Reminder
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={() => onTakeOver(conversation)}
              >
                Take Over Manually
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
});
LeadDetailsPanel.displayName = "LeadDetailsPanel";

const ConversationSummary: React.FC<{ conversation: string }> = ({
  conversation,
}) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  React.useEffect(() => {
    let mounted = true;
    async function fetchSummary() {
      setLoading(true);
      setError("");
      try {
        const result = await getConversationSummary({
          conversationHistory: conversation,
        });
        if (mounted) {
          if (result.data) setSummary(result.data.summary);
          else setError(result.message || "Failed to get summary.");
        }
      } catch (e) {
        if (mounted) setError("An unexpected error occurred.");
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
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  return <p className="text-sm pt-1">{summary}</p>;
};

// --- MAIN PAGE COMPONENT (now rendered inside a centered dialog) ---

const UnifiedInboxPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      setIsLoading(true);
      const data = await fetchConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
      setIsLoading(false);
    }
    loadConversations();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((convo) => {
      const channelMatch =
        channelFilter === "All" || convo.channel === channelFilter;
      const statusMatch =
        statusFilter === "All" || convo.status === statusFilter;
      return channelMatch && statusMatch;
    });
  }, [conversations, channelFilter, statusFilter]);

  React.useEffect(() => {
    if (
      selectedConversation &&
      !filteredConversations.find((c) => c.id === selectedConversation.id)
    ) {
      setSelectedConversation(filteredConversations[0] ?? null);
    }
  }, [filteredConversations, selectedConversation]);

  const handleSendReply = useCallback(
    async (content: string) => {
      if (!content || !selectedConversation) return;
      
      setIsSending(true);
      try {
        // Determine API endpoint based on channel
        let apiEndpoint = "";
        switch (selectedConversation.channel) {
          case "WhatsApp":
            apiEndpoint = "/api/messages/whatsapp";
            break;
          case "Instagram":
            apiEndpoint = "/api/messages/instagram";
            break;
          case "Facebook":
            apiEndpoint = "/api/messages/messenger";
            break;
          default:
            toast.error("Unsupported channel for sending messages");
            setIsSending(false);
            return;
        }

        // Send message via API
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: selectedConversation.fromEmail,
            message: content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to send message");
        }

        // Update local state
        const newReply: Message = { type: "sdr", content };
        const updatedConversation = {
          ...selectedConversation,
          thread: [...selectedConversation.thread, newReply],
          lastMessage: content,
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id ? updatedConversation : c,
          ),
        );
        setSelectedConversation(updatedConversation);
        toast.success("Reply Sent!", {
          description: `Your message to ${selectedConversation.customer} has been sent.`,
        });
      } catch (error) {
        console.error("Error sending reply:", error);
        toast.error(`Error: ${error instanceof Error ? error.message : "Failed to send message"}`);
      } finally {
        setIsSending(false);
      }
    },
    [selectedConversation],
  );

  const handleUpdateStatus = useCallback(
    (id: string, status: "Deal Closed" | "Lost") => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "Resolved" } : c)),
      );
      if (selectedConversation && selectedConversation.id === id) {
        setSelectedConversation((prev) =>
          prev ? { ...prev, status: "Resolved" } : prev,
        );
      }
      toast.info("Conversation Updated", {
        description: `Conversation status updated to ${status}.`,
      });
    },
    [selectedConversation],
  );

  const handleTakeOverInternal = useCallback((convo: Conversation) => {
    toast.success("Taken over", {
      description: `You are now handling ${convo.customer}`,
    });
  }, []);

  // If dialog is closed show a small floating button to reopen it
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setIsOpen(true)} size="lg" variant="default">
          Open Inbox
        </Button>
      </div>
    );
  }

  const handleClose = () => {
    setIsOpen(false);
    router.push('/dashboard/agentos-sdr'); 
  };

  const handleSave = () => {
    toast.success('Saved (mock)');
    router.push('/dashboard/agentos-sdr'); 
  };

  return (
    // Full-screen overlay + centered dialog
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      {/* dialog container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-7xl h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* dialog header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Unified Inbox</h2>
            <p className="text-sm text-muted-foreground">Manage all customer conversations from one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { /* potential maximize behavior */ }}>
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* dialog body: the same ResizablePanelGroup but constrained inside dialog */}
        <main className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="flex flex-col min-h-0">
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedConversation?.id ?? null}
                onSelect={setSelectedConversation}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={45} minSize={30} className="flex flex-col min-h-0">
              <ChatPanel
                conversation={selectedConversation}
                onSendReply={handleSendReply}
                onUpdateStatus={handleUpdateStatus}
                isSending={isSending}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={30} minSize={25} className="hidden lg:flex flex-col min-h-0">
              <LeadDetailsPanel
                conversation={selectedConversation}
                onTakeOver={handleTakeOverInternal}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>

        {/* dialog footer */}
        <div className="p-3 border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Close</Button>
          <Button variant="default" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedInboxPage;
