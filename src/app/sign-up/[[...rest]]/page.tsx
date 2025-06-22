'use client';

import { SignUp } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function SignUpPage() {
  return (
    <div className="container mx-auto p-6">
      <PageHeader title="הרשמה למערכת" />
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 flex justify-center">
            <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  card: "shadow-none border-0",
                  headerTitle: "text-2xl font-bold",
                  headerSubtitle: "text-muted-foreground",
                }
              }}
              redirectUrl="/dashboard"
              signInUrl="/login"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 