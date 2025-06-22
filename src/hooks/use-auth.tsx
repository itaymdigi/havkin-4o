'use client';

import { useUser } from '@clerk/nextjs';

/**
 * Custom hook that provides authentication state using Clerk
 * This replaces the previous Supabase auth hook
 */
export function useAuth() {
  const { user, isSignedIn, isLoaded } = useUser();

  return {
    user,
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    userId: user?.id,
  };
} 