import { createServerClient as createClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient(cookieStore: ReturnType<typeof cookies>) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        async remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )
} 