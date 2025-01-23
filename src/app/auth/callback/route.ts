import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';
    const redirectTo = requestUrl.searchParams.get('redirectTo') || next;

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }

    if (!data.session) {
      console.error('No session created');
      return NextResponse.redirect(
        new URL('/login?error=no_session', request.url)
      );
    }

    // Successful login - redirect to the intended page
    return NextResponse.redirect(new URL(redirectTo, request.url));

  } catch (error) {
    console.error('Callback route error:', error);
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    );
  }
} 