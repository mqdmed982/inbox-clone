import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftlyirlmxlojkaltdhze.supabase.co'
const supabaseAnonKey = 'sb_publishable_OmN3XXTNTS8myNIPC-57uA_WfFAdMEL'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)