import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '@/config/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

interface CookieOptions {
  name: string
  value: string
  maxAge?: number
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

interface CookieHandlers {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove: (name: string, options: CookieOptions) => void
}

export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = cookies()

  const cookieHandlers: CookieHandlers = {
    get(name: string): string | undefined {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions): void {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        console.error('Error setting cookie:', getErrorMessage(error))
      }
    },
    remove(name: string, options: CookieOptions): void {
      try {
        cookieStore.set({ name, value: '', ...options })
      } catch (error) {
        console.error('Error removing cookie:', getErrorMessage(error))
      }
    },
  }

  return createServerClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      cookies: cookieHandlers,
    }
  )
} 