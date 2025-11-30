import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to view active conversations" },
        { status: 401 }
      );
    }

    // Fetch active conversations (not resolved) with lead details
    const { data: conversationsData, error: conversationsError } = await supabase
      .from("contact_history")
      .select(`
        *,
        leads:lead_id (
          id,
          name,
          phone_number,
          email,
          stage,
          metadata
        )
      `)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });

    if (conversationsError) {
      console.error("Database error:", conversationsError);
      return NextResponse.json(
        { error: "Database error while fetching conversations" },
        { status: 500 }
      );
    }

    // Group messages by lead_id to create conversation threads
    const conversationMap = new Map();

    for (const message of conversationsData || []) {
      const leadId = message.lead_id;
      const lead = message.leads;

      if (!lead) continue;

      if (!conversationMap.has(leadId)) {
        // Determine channel
        let channel = "Email";
        if (lead.phone_number) channel = "WhatsApp";
        if (lead.metadata?.instagram_id) channel = "Instagram";
        if (lead.metadata?.facebook_id) channel = "Facebook";

        // Calculate time waiting (time since last message)
        const lastMessageTime = new Date(message.sent_at);
        const now = new Date();
        const diffMs = now.getTime() - lastMessageTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeWaiting = "";
        if (diffDays > 0) {
          timeWaiting = `${diffDays}d`;
        } else if (diffHours > 0) {
          timeWaiting = `${diffHours}h ${diffMins % 60}m`;
        } else {
          timeWaiting = `${diffMins}m`;
        }

        // Calculate engagement score (based on message count and recency)
        const messageCount = conversationsData.filter((m) => m.lead_id === leadId).length;
        const recencyScore = Math.max(0, 100 - diffHours * 2); // Decay over time
        const activityScore = Math.min(messageCount * 10, 50); // Cap at 50
        const engagementScore = Math.min(100, Math.round((recencyScore + activityScore) / 2));

        conversationMap.set(leadId, {
          id: leadId,
          customer: lead.name || "Unknown",
          avatar: (lead.name || "U")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
          channel,
          timeWaiting,
          engagementScore,
          status: lead.stage === "closed" ? "Resolved" : "Open",
        });
      }
    }

    const activeConversations = Array.from(conversationMap.values()).filter(
      (conv) => conv.status !== "Resolved"
    );

    // Calculate channel volume
    const channelCounts = activeConversations.reduce(
      (acc, conv) => {
        acc[conv.channel] = (acc[conv.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const channelVolume = Object.entries(channelCounts).map(([channel, count]) => ({
      channel,
      count,
      fill: getChannelColor(channel),
    }));

    return NextResponse.json({
      conversations: activeConversations,
      channelVolume,
      totalActive: activeConversations.length,
    });
  } catch (error) {
    console.error("Error fetching active conversations:", error);
    return NextResponse.json(
      { error: "Internal server error while fetching conversations" },
      { status: 500 }
    );
  }
}

function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    WhatsApp: "hsl(var(--chart-1))",
    Email: "hsl(var(--chart-2))",
    Instagram: "hsl(var(--chart-3))",
    Facebook: "hsl(var(--chart-4))",
    Phone: "hsl(var(--chart-5))",
  };
  return colors[channel] || "hsl(var(--chart-1))";
}
