import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Create Supabase admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User exists, sign them in
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: firstName || email.split('@')[0],
          last_name: lastName || '',
          role: 'admin',
          has_leados_access: true,
          has_agentos_access: true,
          auto_registered: true,
        },
      });

      if (createError) throw createError;
      if (!newUser.user) throw new Error('Failed to create user');

      userId = newUser.user.id;
      isNewUser = true;

      // Create profile entry
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          first_name: firstName || email.split('@')[0],
          last_name: lastName || '',
          role: 'admin',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      // Initialize empty credentials row for Meta OAuth
      const { error: credentialsError } = await supabaseAdmin
        .from('credentials')
        .insert({
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (credentialsError) {
        console.error('Credentials initialization error:', credentialsError);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      isNewUser,
      message: isNewUser ? 'User registered successfully' : 'User already exists',
    });

  } catch (error) {
    console.error('Auto-register error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
