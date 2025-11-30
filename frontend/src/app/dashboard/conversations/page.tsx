"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
  Send,
  Loader2,
  AlertCircle,
  Plus,
  Instagram,
  Facebook,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- TYPE DEFINITIONS ---
type Message = { type: "user" | "ai" | "sdr"; content: string; timestamp?: string };
type Conversation = {
  id: string;
  customer: string;
  avatar: string;
  channel: "WhatsApp" | "Instagram" | "Facebook" | "Gmail" | string;
  lastMessage: string;
  thread: Message[];
  status: string;
  timestamp: string;
  subject: string;
  leadId?: string;
};

type Lead = {
  id: string;
  name: string;
  phone_number?: string;
  email?: string;
  has_whatsapp?: boolean;
  metadata?: {
    instagram_id?: string;
    facebook_id?: string;
  };
};

// --- UTILITY & CONSTANTS ---
const cn = (...args: Array<string | false | null | undefined>) =>
  args.filter(Boolean).join(" ");

const channelIcons: { [key: string]: JSX.Element } = {
  WhatsApp: <MessageCircle className="h-4 w-4 text-green-500" />,
  Gmail: <Mail className="h-4 w-4 text-red-500" />,
  Facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  Instagram: <Instagram className="h-4 w-4 text-pink-500" />,
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const user = useAppSelector((state) => state.auth.user);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/conversations");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to load conversations" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0]);
        }
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load conversations";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedConversation]);

  useEffect(() => {
    loadConversations();
  }, [user]); // Only run on mount and user change

  // Handle conversation selection on mobile
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  // Back to list on mobile
  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!replyContent.trim() || !selectedConversation || !user) {
      toast.error("Please enter a message");
      return;
    }

    setIsSending(true);

    try {
      // Get lead details
      const leadResponse = await fetch(`/api/leads/${selectedConversation.leadId || selectedConversation.id}`);
      if (!leadResponse.ok) {
        throw new Error("Failed to fetch lead details");
      }

      const leadData = await leadResponse.json();
      const lead: Lead = leadData.lead;

      if (!lead) {
        throw new Error("Lead not found");
      }

      // Determine API endpoint and recipient
      let apiEndpoint = "";
      let recipient = "";

      switch (selectedConversation.channel) {
        case "WhatsApp":
          apiEndpoint = "/api/messages/whatsapp";
          recipient = lead.phone_number || "";
          break;
        case "Instagram":
          apiEndpoint = "/api/messages/instagram";
          recipient = lead.metadata?.instagram_id || "";
          break;
        case "Facebook":
          apiEndpoint = "/api/messages/messenger";
          recipient = lead.metadata?.facebook_id || "";
          break;
        default:
          toast.error("Unsupported channel for sending messages");
          setIsSending(false);
          return;
      }

      if (!recipient) {
        throw new Error(`No ${selectedConversation.channel} identifier found for this lead`);
      }

      // Send message
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          to: recipient,
          message: replyContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Update local conversation
      const newMessage: Message = {
        type: "sdr",
        content: replyContent,
        timestamp: new Date().toISOString(),
      };

      const updatedConversation = {
        ...selectedConversation,
        thread: [...selectedConversation.thread, newMessage],
        lastMessage: replyContent,
        timestamp: "Just now",
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? updatedConversation : c))
      );
      setSelectedConversation(updatedConversation);
      setReplyContent("");

      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      searchQuery === "" ||
      conv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel = channelFilter === "All" || conv.channel === channelFilter;
    const matchesStatus = statusFilter === "All" || conv.status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Please log in to view conversations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage conversations across WhatsApp, Instagram, and Facebook Messenger
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={loadConversations} disabled={isLoading} className="flex-1 sm:flex-initial">
            <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <NewConversationDialog onConversationStarted={loadConversations} />
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <ResizablePanelGroup 
        direction="horizontal" 
        className="min-h-[calc(100vh-180px)] sm:min-h-[calc(100vh-220px)] rounded-lg border overflow-hidden"
      >
        {/* Conversations List Panel */}
        <ResizablePanel 
          defaultSize={30} 
          minSize={25}
          className={cn(
            "transition-all duration-300",
            showMobileChat && "hidden md:flex"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-3 sm:p-4 border-b space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-sm">All Conversations ({filteredConversations.length})</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
              {isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No conversations found</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchQuery || channelFilter !== "All" || statusFilter !== "All"
                      ? "Try adjusting your filters"
                      : "Start a new conversation to get started"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.id}
                      className={cn(
                        "w-full text-left p-2 sm:p-3 rounded-lg border transition-all",
                        selectedConversation?.id === conv.id
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "border-transparent hover:bg-muted/50"
                      )}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-primary/20">{conv.avatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{conv.customer}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {channelIcons[conv.channel]}
                              <span>{conv.channel}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">{conv.timestamp}</p>
                      </div>
                      <h3 className="font-medium text-sm mb-1 truncate">{conv.subject}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{conv.lastMessage}</p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex" />

        {/* Chat Panel */}
        <ResizablePanel 
          defaultSize={70} 
          minSize={50}
          className={cn(
            "transition-all duration-300",
            !showMobileChat && "hidden md:flex"
          )}
        >
          {!selectedConversation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No conversation selected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a conversation from the list to start messaging
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={handleBackToList}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </Button>
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-xs sm:text-sm">{selectedConversation.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base font-bold truncate">{selectedConversation.customer}</h2>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-muted-foreground">
                      {channelIcons[selectedConversation.channel]}
                      <span>{selectedConversation.channel}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs sm:text-sm">{selectedConversation.status}</Badge>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                  {selectedConversation.thread.map((msg, index) => (
                    <div
                      key={`${msg.type}-${index}`}
                      className={cn("flex items-start gap-2 sm:gap-3", msg.type === "sdr" ? "justify-end" : "")}
                    >
                      {(msg.type === "user" || msg.type === "ai") && (
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 shrink-0">
                          <AvatarFallback className={cn(
                            "text-xs",
                            msg.type === "ai" ? "bg-blue-500/20" : "bg-muted"
                          )}>
                            {msg.type === "user" ? selectedConversation.avatar : "AI"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "p-3 sm:p-4 rounded-xl max-w-[85%] sm:max-w-[70%] shadow-sm",
                          msg.type === "user" && "bg-muted",
                          msg.type === "ai" && "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
                          msg.type === "sdr" && "bg-primary text-primary-foreground"
                        )}
                      >
                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {msg.type === "sdr" && (
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mt-1 shrink-0">
                          <AvatarFallback className="bg-primary/20">You</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Box */}
              <div className="border-t bg-background space-y-2 sm:space-y-3 p-3 sm:p-4">
                <Textarea
                  placeholder={`Reply to ${selectedConversation.customer}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSendMessage} disabled={isSending || !replyContent.trim()} className="w-full sm:w-auto">
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Sending...</span>
                        <span className="sm:hidden">Sending</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Send Message</span>
                        <span className="sm:hidden">Send</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// New Conversation Dialog Component
function NewConversationDialog({ onConversationStarted }: { onConversationStarted: () => void }) {
  const [open, setOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [channel, setChannel] = useState<string>("WhatsApp");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (open && user) {
      loadLeads();
    }
  }, [open, user]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error("Error loading leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedLead || !message.trim()) {
      toast.error("Please select a lead and enter a message");
      return;
    }

    const lead = leads.find((l) => l.id === selectedLead);
    if (!lead) return;

    setIsSending(true);

    try {
      let apiEndpoint = "";
      let recipient = "";

      switch (channel) {
        case "WhatsApp":
          apiEndpoint = "/api/messages/whatsapp";
          recipient = lead.phone_number || "";
          break;
        case "Instagram":
          apiEndpoint = "/api/messages/instagram";
          recipient = lead.metadata?.instagram_id || "";
          break;
        case "Facebook":
          apiEndpoint = "/api/messages/messenger";
          recipient = lead.metadata?.facebook_id || "";
          break;
        default:
          toast.error("Please select a channel");
          return;
      }

      if (!recipient) {
        toast.error(`This lead doesn't have a ${channel} identifier`);
        setIsSending(false);
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          to: recipient,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      toast.success("Conversation started successfully!");
      setOpen(false);
      setMessage("");
      setSelectedLead("");
      onConversationStarted();
    } catch (error) {
      console.error("Error starting conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start conversation";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 sm:flex-initial">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New Conversation</span>
          <span className="sm:hidden">New</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogDescription>Select a lead and channel to begin messaging</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Lead</label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone_number || lead.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Channel</label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </div>
                </SelectItem>
                <SelectItem value="Instagram">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    Instagram
                  </div>
                </SelectItem>
                <SelectItem value="Facebook">
                  <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    Facebook Messenger
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartConversation} disabled={isSending || !selectedLead || !message.trim()}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Start Conversation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
