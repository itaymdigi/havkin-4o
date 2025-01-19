import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function createServerSupabaseClient(): SupabaseClient<Database> {
  return createServerClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: {
        async get(name: string) {
          const cookie = (await cookies()).get(name)
          return cookie?.value ?? ''
        },
        async set(name: string, value: string, options: CookieOptions) {
          // Convert options to compatible format
          const { sameSite, ...rest } = options
          const cookieStore = await cookies()
          cookieStore.set(name, value, {
            ...rest,
            // @ts-ignore - Next.js types are not up to date
            sameSite: sameSite
          })
        },
        async remove(name: string, options: CookieOptions) {
          // Convert options to compatible format
          const { sameSite, ...rest } = options
          const cookieStore = await cookies()
          cookieStore.set(name, '', {
            ...rest,
            // @ts-ignore - Next.js types are not up to date
            sameSite: sameSite,
            maxAge: 0
          })
        }
      }
    }
  )
} 