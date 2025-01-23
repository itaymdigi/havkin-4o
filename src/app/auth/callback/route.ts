import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/dashboard';
    const redirectTo = requestUrl.searchParams.get('redirectTo') || next;

    if (!code) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting error
              console.error('Error setting cookie:', error);
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options, maxAge: -1 });
            } catch (error) {
              // Handle cookie removal error
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Auth error:', error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
      }

      // Ensure we have a session before redirecting
      if (!data.session) {
        return NextResponse.redirect(new URL('/login?error=No+session+created', request.url));
      }

      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (error) {
      console.error('Exchange code error:', error);
      return NextResponse.redirect(new URL('/login?error=Authentication+failed', request.url));
    }
  } catch (error) {
    console.error('Callback route error:', error);
    return NextResponse.redirect(new URL('/login?error=Server+error', request.url));
  }
} 