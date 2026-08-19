import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-application-name, x-supabase-api-version, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

const fingerprint = async (req: Request) => {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const agent = req.headers.get("user-agent") ?? "unknown";
  const bytes = new TextEncoder().encode(`${ip}|${agent}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);
  if (Number(req.headers.get("content-length") ?? "0") > 50_000)
    return json({ error: "Слишком большой запрос" }, 413);

  try {
    const body = await req.json();
    if (!body || typeof body !== "object") return json({ error: "Некорректный запрос" }, 400);
    if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const projectUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !projectUrl) throw new Error("Server configuration is unavailable");
    const admin = createClient(projectUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const fp = await fingerprint(req);

    if (body.action === "lead") {
      const payload = body.payload;
      if (!payload || typeof payload !== "object") return json({ error: "Некорректные данные заявки" }, 400);
      if (typeof payload.full_name !== "string" || typeof payload.phone !== "string" || !Array.isArray(payload.items) || !payload.items.length)
        return json({ error: "Заполните обязательные поля" }, 400);
      const { data, error } = await admin.rpc("create_public_order_v2", {
        p_payload: payload,
        p_fingerprint: fp,
      });
      if (error) throw error;
      return json({ ok: true, result: data });
    }

    if (body.action === "event") {
      const payload = body.payload;
      if (!payload || typeof payload !== "object" || typeof payload.event_name !== "string")
        return json({ error: "Некорректное событие" }, 400);
      const { data, error } = await admin.rpc("record_public_event", {
        p_payload: payload,
        p_fingerprint: fp,
      });
      if (error) throw error;
      return json({ ok: true, id: data });
    }
    return json({ error: "Неизвестное действие" }, 400);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Не удалось обработать запрос";
    console.error("public-shop:", message);
    const safeMessage = /Слишком много|Укажите|Некоррект|Недостаточно|Товар не найден|Добавьте/.test(message)
      ? message
      : "Не удалось отправить данные. Попробуйте ещё раз.";
    return json({ error: safeMessage }, /Слишком много/.test(message) ? 429 : 400);
  }
});
