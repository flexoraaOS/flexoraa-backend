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

    // Get user's Facebook Page credentials from env
    // Use Page Access Token for Messenger API (not user access token)
    const page_access_token = process.env.META_PAGE_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

    if (!page_access_token) {
      return NextResponse.json(
        { error: 'Facebook Page Access Token not configured. Set META_PAGE_ACCESS_TOKEN in environment.' },
        { status: 400 }
      );
    }

    // Send message via Facebook Messenger API
    // Messenger has strict 24-hour messaging window policy
    // For messages outside 24h, you need message tags or subscription messaging
    const requestBody = {
      recipient: {
        id: to
      },
      message: {
        text: message
      }
      // messaging_type defaults to RESPONSE which works within 24h window
    };

    console.log('Messenger API Request:', {
      url: 'https://graph.facebook.com/v23.0/me/messages',
      recipient: to
    });

    const messengerResponse = await fetch(
      `https://graph.facebook.com/v23.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...requestBody,
          access_token: page_access_token
        }),
      }
    );

    if (!messengerResponse.ok) {
      const errorData = await messengerResponse.json();
      console.error('Facebook Messenger API error:', errorData);

      // Handle specific error codes
      if (messengerResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      if (messengerResponse.status === 400) {
        if (errorData.error?.code === 100) {
          return NextResponse.json(
            { error: 'Invalid recipient ID or message format' },
            { status: 400 }
          );
        }
        if (errorData.error?.code === 200) {
          return NextResponse.json(
            { error: 'Permission denied. Check your page access token.' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to send Facebook message', details: errorData },
        { status: messengerResponse.status }
      );
    }

    const messengerData = await messengerResponse.json();

    // Store outgoing message in contact_history
    await supabase.from('contact_history').insert({
      user_id: authenticatedUserId,
      lead_id: to,
      direction: 'outbound',
      message_text: message,
      message_type: 'facebook_messenger',
      sent_at: new Date().toISOString()
    });

    // Update lead's last contact time - Note: Messenger uses different identifier
    // This might need adjustment based on how leads are stored
    await supabase
      .from('leads')
      .update({ contacted: true })
      .or(`phone_number.eq.${to},facebook_id.eq.${to}`)
      .eq('user_id', authenticatedUserId);

    return NextResponse.json({
      success: true,
      messageId: messengerData.message_id,
      recipientId: messengerData.recipient_id,
      status: 'sent'
    });

  } catch (error) {
    console.error('Facebook Messenger send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to get user profile info
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
        { error: 'Unauthorized - Please log in to get user profile' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const fbUserId = searchParams.get('fbUserId');

    if (!userId || !fbUserId) {
      return NextResponse.json(
        { error: 'Missing userId or fbUserId' },
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
    const meta_access_token = process.env.META_ACCESS_TOKEN;

    if (!meta_access_token) {
      return NextResponse.json(
        { error: 'Facebook credentials not found in environment' },
        { status: 400 }
      );
    }

    // Get user profile via Facebook Graph API
    const profileResponse = await fetch(
      `https://graph.facebook.com/v23.0/${fbUserId}?fields=first_name,last_name,profile_pic&access_token=${meta_access_token}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: profileResponse.status }
      );
    }

    const profileData = await profileResponse.json();

    return NextResponse.json({
      id: fbUserId,
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      profilePic: profileData.profile_pic,
      fullName: `${profileData.first_name} ${profileData.last_name}`.trim()
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
