'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

// Client component for the login form
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');

  // Get error from URL if present
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Get the redirect URL from the query parameters
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Set mounted state after component mounts to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Updated auth state effect with loading
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        try {
          await router.push(redirectTo);
        } catch (error) {
          console.error('Navigation error:', error);
          setError('Error during navigation');
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  // Don't render Auth component until after mount to avoid hydration issues
  if (!mounted) return null;

  return (
    <Card>
      <CardContent className="p-6 relative">
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <div className="flex justify-center space-x-4 mb-6 rtl:space-x-reverse">
            <button
              onClick={() => setView('sign_in')}
              className={`px-4 py-2 ${
                view === 'sign_in'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => setView('sign_up')}
              className={`px-4 py-2 ${
                view === 'sign_up'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500'
              }`}
            >
              הרשמה
            </button>
          </div>
          <Auth
            supabaseClient={supabase}
            view={view}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#000000',
                    brandAccent: '#333333',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
                label: 'auth-label',
              },
            }}
            theme="dark"
            showLinks={true}
            providers={['google']}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'אימייל',
                  password_label: 'סיסמה',
                  button_label: 'התחבר',
                  loading_button_label: 'מתחבר...',
                  social_provider_text: 'התחבר באמצעות {{provider}}',
                  link_text: 'אין לך חשבון? הירשם',
                },
                sign_up: {
                  email_label: 'אימייל',
                  password_label: 'סיסמה',
                  button_label: 'הרשמה',
                  loading_button_label: 'נרשם...',
                  social_provider_text: 'הירשם באמצעות {{provider}}',
                  link_text: 'כבר יש לך חשבון? התחבר',
                },
              },
            }}
          />
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="ברוכים הבאים" />
      <div className="max-w-md mx-auto">
        <Suspense fallback={
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </CardContent>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
} 