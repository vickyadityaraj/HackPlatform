import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a lazy client to prevent build-time crashes when env vars are missing
let supabaseClient: any = null;

function getSupabaseClient() {
    if (!supabaseClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // During build-time (or if credentials are not configured yet),
            // use a valid-looking dummy URL/key to avoid initialization crashes.
            supabaseClient = createClient(
                'https://placeholder-project.supabase.co',
                'placeholder-anon-key'
            );
        } else {
            supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        }
    }
    return supabaseClient;
}

export const supabase = new Proxy({} as any, {
    get(target, prop) {
        const client = getSupabaseClient();
        const value = client[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

