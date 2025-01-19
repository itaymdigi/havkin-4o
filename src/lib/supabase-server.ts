import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

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
            sameSite: sameSite as ResponseCookie['sameSite']
          })
        },
        async remove(name: string, options: CookieOptions) {
          // Convert options to compatible format
          const { sameSite, ...rest } = options
          const cookieStore = await cookies()
          cookieStore.set(name, '', {
            ...rest,
            sameSite: sameSite as ResponseCookie['sameSite'],
            maxAge: 0
          })
        }
      }
    }
  )
} 