import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          },
          async remove(name: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            });
          },
        },
      }
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
} 