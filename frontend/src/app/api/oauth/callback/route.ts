import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_OAUTH_REDIRECT = process.env.NEXT_PUBLIC_META_OAUTH_REDIRECT;

async function exchangeCodeForToken(code: string) {
  const url = `https://graph.facebook.com/v23.0/oauth/access_token`;
  const params = new URLSearchParams({
    client_id: META_APP_ID!,
    client_secret: META_APP_SECRET!,
    redirect_uri: META_OAUTH_REDIRECT!,
    code,
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

async function getLongLivedToken(accessToken: string) {
  const url = `https://graph.facebook.com/v23.0/oauth/access_token`;
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: META_APP_ID!,
    client_secret: META_APP_SECRET!,
    fb_exchange_token: accessToken,
  });

  const response = await fetch(`${url}?${params.toString()}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

async function getBusinessManagerId(accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v23.0/me/businesses?access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.data[0]?.id;
}

async function getBusinessAccountId(accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v23.0/me/accounts?access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.data[0]?.id;
}

async function getPhoneNumberId(wabaId: string, accessToken: string) {
  if (!wabaId) return null;
  const response = await fetch(`https://graph.facebook.com/v23.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
  const data = await response.json();
  if (data.error) {
    // It's possible the account doesn't have WhatsApp, so don't throw an error
    console.warn(`Could not fetch phone number ID: ${data.error.message}`);
    return null;
  }
  return data.data[0]?.id;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = req.cookies.get('meta_oauth_state')?.value;

  // Create Supabase client with cookies for authentication
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // CSRF protection: Validate state parameter
  if (state !== storedState) {
    console.error('OAuth state mismatch - possible CSRF attack');
    return NextResponse.redirect('/onboarding?error=invalid_state');
  }

  if (!code) {
    return NextResponse.redirect('/onboarding?error=missing_code');
  }

  try {
    // Get authenticated user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('User not authenticated:', authError);
      return NextResponse.redirect('/onboarding?error=unauthorized');
    }

    // Exchange OAuth code for tokens and discover credentials
    const shortLivedToken = await exchangeCodeForToken(code);
    const { accessToken: longLivedToken, expiresIn } = await getLongLivedToken(shortLivedToken);

    const businessManagerId = await getBusinessManagerId(longLivedToken);
    const businessAccountId = await getBusinessAccountId(longLivedToken);
    const phoneNumberId = await getPhoneNumberId(businessAccountId, longLivedToken);

    // Save credentials to database with authenticated user ID
    const { data, error } = await supabase
      .from('credentials')
      .upsert(
        {
          user_id: user.id,
          business_manager_id: businessManagerId,
          business_account_id: businessAccountId,
          phone_number_id: phoneNumberId,
          meta_access_token: longLivedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Redirect to success page
    return NextResponse.redirect('/onboarding?status=connected');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }
}