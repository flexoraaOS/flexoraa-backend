import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/api/supabase';

export async function POST(request: NextRequest) {
  try {
    const { to, message, userId } = await request.json();
    
    // Check for API key authentication (for testing/automation)
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.FLEXORAA_API_KEY;
    
    let authenticatedUserId: string | null = null;

    if (apiKey && validApiKey && apiKey === validApiKey) {
      // API key authentication - use provided userId
      authenticatedUserId = userId;
    } else {
      // Cookie-based authentication
      const cookieStore = await cookies();
      const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            },
          },
        }
      );

      const {
        data: { user },
        error: authError,
      } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in to send messages' },
          { status: 401 }
        );
      }

      authenticatedUserId = user.id;
      
      // Verify the userId matches the authenticated user
      if (userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - User ID mismatch' },
          { status: 403 }
        );
      }
    }

    if (!to || !message || !authenticatedUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message, userId' },
        { status: 400 }
      );
    }

    // Get user's WhatsApp credentials from env
    const phone_number_id = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const meta_access_token = process.env.META_ACCESS_TOKEN;

    if (!phone_number_id || !meta_access_token) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not configured in environment' },
        { status: 400 }
      );
    }

    // Send message via WhatsApp Business API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v23.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meta_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to.replaceAll(/\D/g, ''), // Remove non-digits
          type: 'text',
          text: {
            body: message
          }
        }),
      }
    );

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.json();
      console.error('WhatsApp API error:', errorData);

      // Handle specific error codes
      if (whatsappResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send WhatsApp message', details: errorData },
        { status: whatsappResponse.status }
      );
    }

    const whatsappData = await whatsappResponse.json();

    // Store outgoing message in contact_history
    await supabase.from('contact_history').insert({
      user_id: authenticatedUserId,
      lead_id: to,
      direction: 'outbound',
      message_text: message,
      message_type: 'whatsapp',
      sent_at: new Date().toISOString()
    });

    // Update lead's last contact time
    await supabase
      .from('leads')
      .update({ contacted: true })
      .eq('phone_number', to)
      .eq('user_id', authenticatedUserId);

    return NextResponse.json({
      success: true,
      messageId: whatsappData.messages?.[0]?.id,
      status: 'sent'
    });

  } catch (error) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check message status
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    }
  );

  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to check message status' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get('messageId');
    const userId = searchParams.get('userId');

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: 'Missing messageId or userId' },
        { status: 400 }
      );
    }

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - User ID mismatch' },
        { status: 403 }
      );
    }

    // Get credentials from env
    const phone_number_id = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const meta_access_token = process.env.META_ACCESS_TOKEN;

    if (!phone_number_id || !meta_access_token) {
      return NextResponse.json(
        { error: 'WhatsApp credentials not found in environment' },
        { status: 400 }
      );
    }

    // Check message status via WhatsApp API
    const statusResponse = await fetch(
      `https://graph.facebook.com/v23.0/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${meta_access_token}`,
        },
      }
    );

    if (!statusResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to check message status' },
        { status: statusResponse.status }
      );
    }

    const statusData = await statusResponse.json();

    return NextResponse.json({
      messageId,
      status: statusData.status,
      timestamp: statusData.timestamp
    });

  } catch (error) {
    console.error('Message status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
