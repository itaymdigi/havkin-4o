"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Wait for Clerk to load user state
    if (!isLoaded) return;

    // Redirect based on authentication state
    if (isSignedIn) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );
}
