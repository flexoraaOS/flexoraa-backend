import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
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
        { error: "Unauthorized - Please log in to generate summaries" },
        { status: 401 }
      );
    }

    const { conversationHistory } = await request.json();

    if (!conversationHistory || typeof conversationHistory !== 'string') {
      return NextResponse.json(
        { error: "Invalid request - conversationHistory is required" },
        { status: 400 }
      );
    }

    // TODO: Replace with actual AI summarization service (OpenAI, Anthropic, etc.)
    // For now, we'll return a basic analysis
    const messages = conversationHistory.split('\n').filter(m => m.trim());
    const messageCount = messages.length;
    const hasQuestions = conversationHistory.toLowerCase().includes('?');
    const hasPricing = conversationHistory.toLowerCase().includes('price') || 
                        conversationHistory.toLowerCase().includes('cost');
    const hasUrgency = conversationHistory.toLowerCase().includes('urgent') || 
                       conversationHistory.toLowerCase().includes('asap');

    let summary = `Conversation contains ${messageCount} messages. `;
    
    if (hasQuestions) {
      summary += "Customer has asked questions. ";
    }
    
    if (hasPricing) {
      summary += "Discussion involves pricing/cost concerns. ";
    }
    
    if (hasUrgency) {
      summary += "⚠️ Customer indicated urgency. ";
    }
    
    summary += messageCount > 5 
      ? "Active engagement - high purchase intent likely." 
      : "Early stage conversation.";

    return NextResponse.json({ 
      summary,
      metadata: {
        messageCount,
        hasQuestions,
        hasPricing,
        hasUrgency,
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error("Error generating conversation summary:", error);
    return NextResponse.json(
      { error: "Internal server error while generating summary" },
      { status: 500 }
    );
  }
}
