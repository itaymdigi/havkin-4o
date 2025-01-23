import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from '@/config/supabase';

export const supabase = createBrowserClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    cookies: {
      get(name: string) {
        return document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: { path?: string; maxAge?: number }) {
        document.cookie = `${name}=${value}${options.path ? `;path=${options.path}` : ''}${
          options.maxAge ? `;max-age=${options.maxAge}` : ''
        }`
      },
      remove(name: string, options?: { path?: string }) {
        document.cookie = `${name}=;max-age=0${options?.path ? `;path=${options.path}` : ''}`
      },
    },
  }
); 