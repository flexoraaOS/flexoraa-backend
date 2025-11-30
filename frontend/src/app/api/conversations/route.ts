import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch conversations by joining contact_history with leads
    const { data: conversations, error } = await supabase
      .from("contact_history")
      .select(`
        id,
        direction,
        message_text,
        message_type,
        sent_at,
        lead_id,
        leads (
          id,
          name,
          phone_number,
          email,
          has_whatsapp,
          metadata
        )
      `)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Group messages by lead_id to create conversation threads
    const conversationMap = new Map();

    conversations?.forEach((msg: any) => {
      const leadId = msg.lead_id;
      if (!conversationMap.has(leadId)) {
        // Determine channel based on lead data
        let channel = "Unknown";
        if (msg.leads?.has_whatsapp) {
          channel = "WhatsApp";
        } else if (msg.leads?.metadata?.instagram_id) {
          channel = "Instagram";
        } else if (msg.leads?.metadata?.facebook_id) {
          channel = "Facebook";
        } else if (msg.leads?.email) {
          channel = "Gmail";
        }

        conversationMap.set(leadId, {
          id: leadId,
          customer: msg.leads?.name || "Unknown",
          avatar: msg.leads?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "UN",
          channel,
          lastMessage: msg.message_text || "",
          thread: [],
          status: "AI Handled", // Default status
          timestamp: new Date(msg.sent_at).toLocaleTimeString(),
          subject: `Conversation with ${msg.leads?.name || "Unknown"}`,
          tags: [],
          fromEmail: msg.leads?.email || "",
          engagementScore: 50, // Default score
          leadId: leadId,
        });
      }

      // Add message to thread
      const conversation = conversationMap.get(leadId);
      let messageType: "user" | "sdr" | "ai" = "ai";
      if (msg.direction === "inbound") {
        messageType = "user";
      } else if (msg.direction === "outbound") {
        messageType = "sdr";
      }
      conversation.thread.unshift({
        type: messageType,
        content: msg.message_text || "",
      });

      // Update last message and timestamp
      if (conversation.thread.length === 1) {
        conversation.lastMessage = msg.message_text || "";
        conversation.timestamp = new Date(msg.sent_at).toLocaleTimeString();
      }
    });

    const result = Array.from(conversationMap.values());

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Error in conversations API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
