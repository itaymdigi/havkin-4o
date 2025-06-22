import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "@/config/supabase";

export const supabase = createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
