import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from './supabase-server';

/**
 * Get the current authenticated user from Clerk and return both Clerk user ID and Supabase client
 * This allows us to use Clerk for authentication while keeping Supabase for data operations
 */
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Create Supabase client for data operations
  const supabase = await createServerSupabaseClient();
  
  return {
    userId,
    supabase
  };
} 