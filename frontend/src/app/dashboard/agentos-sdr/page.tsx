"use client";

import React, { JSX, useState } from "react";
import { Mail, MessageSquare, Instagram, Facebook } from "lucide-react";
import AgentosDashboardHeader from "@/components/dashboard/agentos-sdr/AgentosDashboardHeaderProps";
import { NewConversationsCard } from "@/components/dashboard/agentos-sdr/NewConversationsCard";
import UnifiedInboxDialog from "@/components/dashboard/agentos-sdr/UnifiedInboxDialogue";
import { AppointmentsDialog } from "@/components/dashboard/leados-sdr/AppoinmentsDialogue";
import { RecentLeadsCTA } from "@/components/dashboard/agentos-sdr/RecentLeadCta";
import PerformanceDeepDive, { FunnelData, PerformanceData, Ranking } from "@/components/dashboard/agentos-sdr/PerformanceDeepdrive";
import ActiveConversationsPanel, { ExampleActiveConversations } from "@/components/dashboard/agentos-sdr/ActiveConversationPanel";
import { AiChatAnalysis } from "@/components/ai/AIChatAnalysis";

function SDRAgentOSPage() {
  const [isAiActive, setIsAiActive] = useState(true);

  const channelIcons: { [key: string]: JSX.Element } = {
    WhatsApp: <MessageSquare className="h-5 w-5 text-green-500" />,
    Instagram: <Instagram className="h-5 w-5 text-pink-500" />,
    Facebook: <Facebook className="h-5 w-5 text-blue-600" />,
    Gmail: <Mail className="h-5 w-5 text-red-500" />,
  };
  const handleTakeOver = (conversation: any) => {
    console.log("Taking over conversation:", conversation);
    alert(`Taking over conversation with ${conversation.customer}`);
  };

  return (
    <div className="p-6">
      <AgentosDashboardHeader
        channelIcons={channelIcons}
        isAiActive={isAiActive}
        setIsAiActive={setIsAiActive}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <NewConversationsCard />
        <AppointmentsDialog />
        <UnifiedInboxDialog 
          onTakeOver={handleTakeOver} 
          label="Unified Inbox"
        />
        <RecentLeadsCTA />
      </div>

      <div className="mt-6">
        <PerformanceDeepDive />
        <ExampleActiveConversations/>
      </div>

      <div className="mt-6">
        <AiChatAnalysis/>
      </div>
    </div>
  );
}

export default SDRAgentOSPage;
