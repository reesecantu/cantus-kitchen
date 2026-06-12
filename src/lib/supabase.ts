import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Cookie-backed client so the session is shared with server loaders/actions.
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
