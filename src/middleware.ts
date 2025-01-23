import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/auth/callback'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    // Create supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name) {
            const cookie = req.cookies.get(name);
            return cookie?.value;
          },
          async set(name, value, options) {
            res.cookies.set(name, value, options);
          },
          async remove(name) {
            res.cookies.delete(name);
          },
        },
      }
    );

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    // If it's a public route, allow access
    if (isPublicRoute) {
      return res;
    }

    // Check auth user instead of session
    const { data: { user }, error } = await supabase.auth.getUser();

    // If there's no user and the route isn't public, redirect to login
    if (!user && !isPublicRoute) {
      console.log('No authenticated user found, redirecting to login');
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If there is a user, add the user ID to the headers
    if (user) {
      res.headers.set('x-user-id', user.id);
    }

    // Allow access
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On critical errors, still allow access but log the error
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}; 