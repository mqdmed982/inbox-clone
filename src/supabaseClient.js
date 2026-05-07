import { createClient } from '@supabase/supabase-js'

// Had l-ma3loumat tlqahom f Supabase > Settings > API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
