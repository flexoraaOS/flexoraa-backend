"use client";

import { getConversationSummary } from "@/lib/data/inbox";
import React, { useState, useEffect } from "react";

export const ConversationSummary: React.FC<{ conversation: string }> = ({
  conversation,
}) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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