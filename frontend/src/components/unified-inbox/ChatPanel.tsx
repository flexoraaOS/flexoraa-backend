"use client";

import React, { memo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Send, Loader2, Check, Wand2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/types/leadTypes";

interface ChatPanelProps {
  conversation: Conversation | null;
  onSendReply: (content: string) => void;
  onUpdateStatus: (id: string, status: "Deal Closed" | "Lost") => void;
  isSending: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = memo(({
  conversation, onSendReply, onUpdateStatus, isSending
}) => {
  const [replyContent, setReplyContent] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversation]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{conversation?.customer || "No conversation selected"}</h3>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {conversation?.thread?.map((msg, idx) => (
          <div key={idx} className={cn("mb-4", msg.type === "user" ? "text-left" : "text-right")}>
            <div className={cn("inline-block p-3 rounded-lg", msg.type === "user" ? "bg-muted" : "bg-primary text-primary-foreground")}>
              {msg.content}
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <Textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Type your reply..."
          className="mb-2"
        />
        <Button onClick={() => { onSendReply(replyContent); setReplyContent(""); }} disabled={isSending || !replyContent.trim()}>
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </Button>
      </div>
    </div>
  );
});

ChatPanel.displayName = "ChatPanel";