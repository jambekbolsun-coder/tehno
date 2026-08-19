import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);
  try {
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = req.headers.get("Authorization");
    if (!projectUrl || !publishableKey || !authorization) return json({ error: "Требуется авторизация" }, 401);
    const client = createClient(projectUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return json({ error: "Сессия недействительна" }, 401);
    const { data: profile } = await client.from("profiles").select("role,is_active").eq("id", authData.user.id).single();
    if (profile?.role !== "admin" || !profile.is_active) return json({ error: "Нет доступа" }, 403);

    const body = await req.json();
    if (body?.action === "delete_offline_sale") {
      const orderId = String(body.order_id ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Некорректный идентификатор продажи" }, 400);
      const { data, error } = await client.rpc("delete_offline_sale", {
        p_order_id: orderId,
        p_reason: String(body.reason ?? "Удалено управляющим").slice(0, 500),
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, result: data });
    }
    return json({ error: "Неизвестная операция" }, 400);
  } catch (cause) {
    console.error("admin-operations:", cause);
    return json({ error: "Не удалось выполнить операцию" }, 400);
  }
});
