import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/api/supabase';
import { getErrorMessage } from '@/lib/types/leadTypes';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Return credentials from environment variables
  const credentials = {
    id: 'env-credentials',
    user_id: userId,
    business_manager_id: process.env.META_BUSINESS_MANAGER_ID,
    business_account_id: process.env.META_BUSINESS_ACCOUNT_ID,
    phone_number_id: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    meta_access_token: process.env.META_ACCESS_TOKEN,
    token_expires_at: null, // Or set a future date
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return NextResponse.json(credentials);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...credentials } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('credentials')
      .upsert({ ...credentials, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, 'Failed to save credentials') }, { status: 500 });
  }
}