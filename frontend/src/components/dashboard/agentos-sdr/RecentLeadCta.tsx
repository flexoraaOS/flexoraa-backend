"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Hand, Loader2 } from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";

export const RecentLeadsCTA = () => {
  const [conversationCount, setConversationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/conversations");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to load conversations" }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.conversations && Array.isArray(data.conversations)) {
          // Count conversations needing attention
          const attentionCount = data.conversations.filter(
            (c: any) => c.status === "Needs Attention"
          ).length;
          setConversationCount(attentionCount);
        } else {
          setConversationCount(0);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load conversation count";
        toast.error(`Error: ${errorMessage}`);
        setConversationCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  return (
    <Link href="/dashboard/recent-leads">
      <Card className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Unified Inbox</CardTitle>
          <Hand className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{conversationCount}</div>
              <p className="text-xs text-muted-foreground">
                {user 
                  ? "Conversations needing attention" 
                  : "Login to view conversations"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};