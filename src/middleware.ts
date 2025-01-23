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
            const cookie = req.cookies.get(name);
            return cookie?.value;
          },
          set(name, value, options) {
            res.cookies.set(name, value, options);
          },
          remove(name) {
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

    // Special handling for auth callback route
    if (req.nextUrl.pathname === '/auth/callback') {
      return res;
    }

    // Get the user session
    const { data: { user } } = await supabase.auth.getUser();

    // If it's the login page and user is authenticated, redirect to dashboard
    if (req.nextUrl.pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If it's a public route, allow access
    if (isPublicRoute) {
      return res;
    }

    // If there's no user and the route isn't public, redirect to login
    if (!user) {
      const redirectUrl = new URL('/login', req.url);
      // Only add redirectTo for non-API routes
      if (!req.nextUrl.pathname.startsWith('/api/')) {
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Add user context to headers for server components
    res.headers.set('x-user-id', user.id);
    return res;

  } catch (error) {
    console.error('Middleware error:', error);
    // On critical errors, redirect to login only if not already on login page
    if (req.nextUrl.pathname !== '/login') {
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }
}

// Update matcher to exclude static files and api routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files with extensions (.svg, .jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 