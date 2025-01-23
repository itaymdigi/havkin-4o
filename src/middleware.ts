import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/auth/callback',
  '/register',
  '/_next',
  '/api/auth',
  '/favicon.ico',
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Create supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return req.cookies.get(name)?.value;
          },
          set(name, value, options) {
            res.cookies.set(name, value, options);
          },
          remove(name, options) {
            res.cookies.delete(name);
          },
        },
      }
    );

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname.startsWith(route) || 
      req.nextUrl.pathname === '/'
    );

    // Skip auth check for public routes and static files
    if (isPublicRoute || req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
      return res;
    }

    const { data: { session } } = await supabase.auth.getSession();

    // If there's no session and the route isn't public, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return res;

  } catch (error) {
    console.error('Middleware error:', error);
    // On critical errors, redirect to login
    if (!req.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return res;
  }
}

// Update matcher to exclude static files and api routes
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 