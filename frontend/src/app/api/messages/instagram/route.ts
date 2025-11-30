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

    // Get user's Instagram credentials from env
    // Use META_INSTAGRAM_ACCOUNT_ID (not META_BUSINESS_ACCOUNT_ID which is for WhatsApp)
    const instagram_account_id = process.env.META_INSTAGRAM_ACCOUNT_ID;
    const meta_access_token = process.env.META_ACCESS_TOKEN;

    if (!instagram_account_id || !meta_access_token) {
      return NextResponse.json(
        { error: 'Instagram credentials not configured in environment. Set META_INSTAGRAM_ACCOUNT_ID.' },
        { status: 400 }
      );
    }

    // Send message via Instagram Messaging API
    // Instagram uses the Instagram Graph API for messaging
    // The recipient must have messaged your business account first
    const requestBody = {
      recipient: {
        id: to
      },
      message: {
        text: message
      }
    };

    console.log('Instagram API Request:', {
      url: `https://graph.facebook.com/v23.0/${instagram_account_id}/messages`,
      body: requestBody
    });

    const instagramResponse = await fetch(
      `https://graph.facebook.com/v23.0/${instagram_account_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${meta_access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!instagramResponse.ok) {
      const errorData = await instagramResponse.json();
      console.error('Instagram API error:', {
        status: instagramResponse.status,
        error: errorData
      });

      // Handle specific error codes
      if (instagramResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (instagramResponse.status === 400) {
        const errorCode = errorData.error?.code;
        const errorMessage = errorData.error?.message;
        
        if (errorCode === 100) {
          return NextResponse.json(
            { 
              error: 'Invalid recipient ID. The user may not have messaged your business account yet.',
              details: errorMessage,
              hint: 'Instagram requires the recipient to initiate conversation first (24-hour messaging window)'
            },
            { status: 400 }
          );
        }
        
        if (errorCode === 10) {
          return NextResponse.json(
            { 
              error: 'Permission denied. Your access token may not have instagram_manage_messages permission.',
              details: errorMessage
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { 
            error: 'Instagram API error',
            details: errorMessage || 'Invalid request format',
            errorCode: errorCode
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to send Instagram message', details: errorData },
        { status: instagramResponse.status }
      );
    }

    const instagramData = await instagramResponse.json();

    // Store outgoing message in contact_history
    await supabase.from('contact_history').insert({
      user_id: authenticatedUserId,
      lead_id: to,
      direction: 'outbound',
      message_text: message,
      message_type: 'instagram',
      sent_at: new Date().toISOString()
    });

    // Update lead's last contact time - Note: Instagram uses different identifier
    // This might need adjustment based on how leads are stored
    await supabase
      .from('leads')
      .update({ contacted: true })
      .or(`phone_number.eq.${to},instagram_id.eq.${to}`)
      .eq('user_id', authenticatedUserId);

    return NextResponse.json({
      success: true,
      messageId: instagramData.message_id,
      recipientId: instagramData.recipient_id,
      status: 'sent'
    });

  } catch (error) {
    console.error('Instagram send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check conversation details
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
        { error: 'Unauthorized - Please log in to check conversation details' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: 'Missing conversationId or userId' },
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
    const instagram_account_id = process.env.META_INSTAGRAM_ACCOUNT_ID;
    const meta_access_token = process.env.META_ACCESS_TOKEN;

    if (!instagram_account_id || !meta_access_token) {
      return NextResponse.json(
        { error: 'Instagram credentials not found in environment' },
        { status: 400 }
      );
    }

    // Get conversation details via Instagram API
    const conversationResponse = await fetch(
      `https://graph.facebook.com/v23.0/${conversationId}?fields=id,participants,updated_time`,
      {
        headers: {
          'Authorization': `Bearer ${meta_access_token}`,
        },
      }
    );

    if (!conversationResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get conversation details' },
        { status: conversationResponse.status }
      );
    }

    const conversationData = await conversationResponse.json();

    return NextResponse.json({
      conversationId,
      participants: conversationData.participants?.data || [],
      updatedTime: conversationData.updated_time,
      status: 'active'
    });

  } catch (error) {
    console.error('Conversation details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
