"use client";

import React, { JSX, useMemo, useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Search, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";

// --- Types (Unchanged) ---
export type Conversation = {
  id: string | number;
  customer: string;
  avatar?: string;
  channel: string;
  timeWaiting: string;
  engagementScore: number;
  status: string;
};

export type ChannelVolumeItem = {
  channel: string;
  count: number;
  fill?: string;
};

// --- Props (Unchanged) ---
export type ActiveConversationsPanelProps = {
  conversations: Conversation[];
  channelVolumeData: ChannelVolumeItem[];
  onUpdateStatus?: (id: Conversation["id"], newStatus: string) => void;
  searchValue?: string;
  onSearchChange?: (q: string) => void;
  channelIcons?: Record<string, JSX.Element>;
};

const defaultChannelIcons: Record<string, JSX.Element> = {
  WhatsApp: <span className="text-xs font-medium">WA</span>,
  Phone: <span className="text-xs font-medium">PH</span>,
  Email: <span className="text-xs font-medium">EM</span>,
  Web: <span className="text-xs font-medium">Web</span>,
};

export default function ActiveConversationsPanel({
  conversations,
  channelVolumeData,
  onUpdateStatus,
  searchValue: controlledSearch,
  onSearchChange,
  channelIcons = defaultChannelIcons,
}: ActiveConversationsPanelProps) {
  const [localSearch, setLocalSearch] = useState("");
  const search = controlledSearch !== undefined ? controlledSearch : localSearch;

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (onSearchChange) onSearchChange(v);
    if (controlledSearch === undefined) setLocalSearch(v);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.customer.toLowerCase().includes(q) ||
        c.channel.toLowerCase().includes(q) ||
        String(c.id).toLowerCase().includes(q)
    );
  }, [conversations, search]);

  function handleUpdateStatus(id: Conversation["id"], newStatus: string) {
    if (onUpdateStatus) onUpdateStatus(id, newStatus);
  }

  return (
    // ✨ Replaced grid layout with ResizablePanelGroup
    <ResizablePanelGroup
      direction="horizontal"
      className="min-h-[30vh] rounded-lg border" // Added a container style
    >
      <ResizablePanel defaultSize={66} minSize={40}>
        {/* ✨ Added flex layout to make the card fill the panel height */}
        <div className="flex h-full items-start justify-center p-6">
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Active Conversations</CardTitle>
                  <CardDescription>
                    All ongoing chats SDR is handling.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-9"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
            </CardHeader>

            {/* ✨ Made CardContent grow and scrollable */}
            <CardContent className="flex-grow overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Time Waiting</TableHead>
                    <TableHead>Engagement Score</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered
                    .filter((c) => c.status !== "Resolved")
                    .map((convo) => (
                      <TableRow key={convo.id} className="hover:bg-secondary/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {convo.avatar ?? convo.customer?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{convo.customer}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {channelIcons[convo.channel] ?? (
                                  <span className="text-xs">{convo.channel}</span>
                                )}
                                <span>{convo.channel}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={convo.timeWaiting.includes("d") ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {convo.timeWaiting}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={convo.engagementScore} className="w-24 h-1.5" />
                            <span className="text-xs font-semibold">
                              {convo.engagementScore}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(convo.id, "Booked")}>
                                Close: Booked
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(convo.id, "Follow-up")}>
                                Close: Follow-up
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(convo.id, "Lost")} className="text-destructive">
                                Close: Lost
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={34} minSize={30}>
        {/* ✨ Added flex layout to make the card fill the panel height */}
        <div className="flex h-full items-start justify-center p-6">
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle>Conversation Volume</CardTitle>
              <CardDescription>
                Breakdown by channel for the last 7 days.
              </CardDescription>
            </CardHeader>

            {/* ✨ Made CardContent grow */}
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={channelVolumeData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="channel"
                    type="category"
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--secondary)" }}
                    contentStyle={{
                      backgroundColor: "var(--background) / 0.8)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="count" position="right" />
                    {channelVolumeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill ?? "var(--chart-1)"}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

// --- Mock data + usage example replaced with real data fetch ---
export const ExampleActiveConversations: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channelVolume, setChannelVolume] = useState<ChannelVolumeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchActiveConversations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/conversations/active');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to load active conversations' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else {
          setConversations([]);
        }

        if (data.channelVolume && Array.isArray(data.channelVolume)) {
          setChannelVolume(data.channelVolume);
        } else {
          setChannelVolume([]);
        }
      } catch (err) {
        console.error('Error fetching active conversations:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load active conversations';
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
        setConversations([]);
        setChannelVolume([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveConversations();
  }, [user]);

  function handleUpdate(id: number | string, status: string) {
    console.log("update", id, status);
    // TODO: Call API to update conversation status
    toast.success(`Conversation ${status}`);
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Please log in to view active conversations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading active conversations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive">Error loading conversations</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No active conversations</p>
            <p className="text-xs text-muted-foreground mt-1">Start messaging your leads!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <ActiveConversationsPanel
        conversations={conversations}
        channelVolumeData={channelVolume}
        onUpdateStatus={handleUpdate}
      />
    </div>
  );
};