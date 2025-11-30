// src/components/unified-inbox/LeadDetailsPanel.tsx
"use client";

import React, { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, Clock } from "lucide-react";
import { Conversation } from "@/lib/types/leadTypes";

// Placeholder for the AppointmentsDialog component.
// In a real app, this would be a fully functional component.
const AppointmentsDialog = () => (
    <Button variant="outline" className="w-full justify-start">
        <Clock className="mr-2 h-4 w-4" /> Schedule Appointment
    </Button>
);

interface LeadDetailsPanelProps {
  conversation: Conversation | null;
  onTakeOver: (convo: Conversation) => void;
}

export const LeadDetailsPanel: React.FC<LeadDetailsPanelProps> = memo(({
  conversation, onTakeOver
}) => {
  if (!conversation) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a conversation to view details
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Name:</span> {conversation.customer}
            </div>
            <div>
              <span className="font-semibold">Channel:</span> {conversation.channel}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {conversation.status}
            </div>
            <div>
              <span className="font-semibold">Engagement Score:</span> {conversation.engagementScore}
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => onTakeOver(conversation)} className="w-full">
          <Wand2 className="mr-2 h-4 w-4" />
          Take Over Conversation
        </Button>
        <AppointmentsDialog />
      </div>
    </ScrollArea>
  );
});

LeadDetailsPanel.displayName = "LeadDetailsPanel";