import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabaseConfig } from '@/config/supabase';

export async function GET() {
  try {
    // Create a Supabase client for the authenticated user
    const supabase = createServerClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies();
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notifications for the authenticated user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 