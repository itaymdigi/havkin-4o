import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
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