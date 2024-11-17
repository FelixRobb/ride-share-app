import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance === null) {
    try {
      supabaseInstance = createClient(supabaseUrl!, supabaseKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
      console.log('Supabase client created successfully');
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      throw new Error('Failed to create Supabase client');
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      throw error;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Helper function for logging errors
export function logError(context: string, error: any) {
  console.error(`Error in ${context}:`, error);
  console.error('Error details:', JSON.stringify(error, null, 2));
}