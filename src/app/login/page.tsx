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
  const [loading, setLoading] = useState(false);

  // Get the redirect URL from the query parameters
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

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

  return (
    <div className="container mx-auto p-6">
      <PageHeader title="התחברות למערכת" />
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6">
            <Auth
              supabaseClient={supabase}
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
              }}
              providers={['google']}
              redirectTo={`${window.location.origin}/auth/callback`}
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