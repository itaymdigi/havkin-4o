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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setLoading(true);
        // Use async/await instead of .then() since router.push returns void
        const handleRedirect = async () => {
          await router.push(redirectTo);
          setLoading(false);
        };
        handleRedirect();
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
      <CardContent className={`p-6 ${loading ? 'opacity-50' : ''}`}>
        <Auth
          supabaseClient={supabase}
          view="sign_in"
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
          showLinks={false}
          providers={['google']}
          redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
          localization={{
            variables: {
              sign_in: {
                email_label: 'אימייל',
                password_label: 'סיסמה',
                button_label: 'התחבר',
                loading_button_label: 'מתחבר...',
                social_provider_text: 'התחבר באמצעות {{provider}}',
                link_text: 'כבר יש לך חשבון? התחבר',
              },
            },
          }}
        />
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
      <PageHeader title="התחברות למערכת" />
      <div className="max-w-md mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
} 