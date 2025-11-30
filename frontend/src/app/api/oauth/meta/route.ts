import { NextRequest, NextResponse } from 'next/server';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_META_OAUTH_REDIRECT!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  // Build Meta OAuth URL with all required scopes
  const scopes = [
    'business_management',
    'whatsapp_business_management',
    'whatsapp_business_messaging',
    'instagram_basic',
    'instagram_manage_messages',
    'pages_messaging',
    'pages_manage_metadata',
    'pages_read_engagement',
  ].join(',');

  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const metaAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${state}&response_type=code`;

  return NextResponse.redirect(metaAuthUrl);
}
