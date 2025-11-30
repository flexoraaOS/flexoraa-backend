"use client";

import React, { memo, JSX } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types/leadTypes";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (convo: Conversation) => void;
  channelFilter: string;
  setChannelFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = memo(({
  conversations, selectedId, onSelect, channelFilter, setChannelFilter, statusFilter, setStatusFilter
}) => (
  <div className="border-r flex flex-col h-full min-h-0 bg-background">
    <div className="p-3 border-b space-y-2">
      {/* ... (rest of the component JSX from the prompt) ... */}
    </div>
    <ScrollArea className="flex-1 min-h-0">
      {/* ... (rest of the component JSX from the prompt) ... */}
    </ScrollArea>
  </div>
));

ConversationList.displayName = "ConversationList";