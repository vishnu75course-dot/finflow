import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let rawSupabase = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    rawSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
}

// Proxy wrapper to throw descriptive runtime error when client is used, rather than crashing on module import
/** @type {import('@supabase/supabase-js').SupabaseClient} */
const supabase = new Proxy(/** @type {any} */({}), {
  get(target, prop) {
    if (!rawSupabase) {
      throw new Error("Supabase client is not initialized. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are configured.");
    }
    return rawSupabase[prop];
  }
});

// Factory for standard client auth methods using anon key
export const getAuthClient = () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Supabase URL or Anon Key is missing from environment variables.");
  }
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

export default supabase