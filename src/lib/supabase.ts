import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const INVITE_FLOW_KEY = "tehno-center-invite-flow";
const PASSWORD_RECOVERY_FLOW_KEY = "tehno-center-password-recovery-flow";

if (typeof window !== "undefined") {
  const callback = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (callback.get("type") === "invite")
    window.sessionStorage.setItem(INVITE_FLOW_KEY, "1");
  if (callback.get("type") === "recovery")
    window.sessionStorage.setItem(PASSWORD_RECOVERY_FLOW_KEY, "1");
}

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
export const hasPendingInvite = () =>
  typeof window !== "undefined" &&
  window.sessionStorage.getItem(INVITE_FLOW_KEY) === "1";
export const clearPendingInvite = () =>
  window.sessionStorage.removeItem(INVITE_FLOW_KEY);
export const hasPendingPasswordRecovery = () =>
  typeof window !== "undefined" &&
  window.sessionStorage.getItem(PASSWORD_RECOVERY_FLOW_KEY) === "1";
export const clearPendingPasswordRecovery = () =>
  window.sessionStorage.removeItem(PASSWORD_RECOVERY_FLOW_KEY);
