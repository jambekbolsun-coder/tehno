import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env.local",
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { "x-application-name": "tehno-center-2" },
    },
  },
);

export const publicFunctionUrl = `${supabaseUrl}/functions/v1/public-shop`;
export const publishableKey = supabasePublishableKey;
