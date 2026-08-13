import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);

  try {
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = req.headers.get("Authorization");
    if (!projectUrl || !publishableKey || !serviceKey || !authorization)
      return json({ error: "Требуется авторизация" }, 401);

    const userClient = createClient(projectUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Сессия недействительна" }, 401);

    const admin = createClient(projectUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role,is_active")
      .eq("id", authData.user.id)
      .single();
    if (profileError || profile?.role !== "admin" || !profile.is_active)
      return json({ error: "Только управляющий может приглашать менеджеров" }, 403);

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const fullName = String(body?.full_name ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    if (!emailPattern.test(email)) return json({ error: "Укажите корректный email" }, 400);
    if (fullName.length < 2) return json({ error: "Укажите имя менеджера" }, 400);
    if (phone.replace(/\D/g, "").length < 9) return json({ error: "Укажите корректный телефон" }, 400);

    const requestedOrigin = String(body?.redirect_origin ?? "").replace(/\/$/, "");
    const safeOrigin =
      requestedOrigin === "https://tehno-six.vercel.app" ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestedOrigin)
        ? requestedOrigin
        : "https://tehno-six.vercel.app";

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: safeOrigin,
        data: { full_name: fullName, phone },
      },
    );
    if (inviteError) {
      const message = /already|registered|exists/i.test(inviteError.message)
        ? "Пользователь с таким email уже создан"
        : inviteError.message;
      return json({ error: message }, 400);
    }
    if (!invited.user) return json({ error: "Не удалось создать приглашение" }, 400);

    const { error: activateError } = await admin
      .from("profiles")
      .update({
        role: "manager",
        is_active: true,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invited.user.id);
    if (activateError) throw activateError;

    const { error: managerError } = await admin.from("manager_profiles").upsert(
      { user_id: invited.user.id, accepts_leads: true },
      { onConflict: "user_id" },
    );
    if (managerError) throw managerError;

    return json({ ok: true });
  } catch (cause) {
    console.error("invite-manager:", cause);
    return json({ error: "Не удалось отправить приглашение. Попробуйте ещё раз." }, 400);
  }
});
