'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Get the redirect URL from the query parameters
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  // Set mounted state after component mounts to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect after successful login
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push(redirectTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, redirectTo]);

  // Don't render Auth component until after mount to avoid hydration issues
  if (!mounted) return null;

  return (
    <div className="container mx-auto p-6">
      <PageHeader title="התחברות למערכת" />
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 