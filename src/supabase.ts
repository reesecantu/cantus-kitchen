import { createClient } from '@supabase/supabase-js'
import { Database } from './schema'

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_ANON_KEY as string
);

export default supabase;