import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.3";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
const normalizePhone = (value: unknown) => {
  const raw = String(value ?? "").trim();
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `996${digits.slice(1)}`;
  if (digits.length === 9) digits = `996${digits}`;
  return { normalized: digits, e164: digits ? `+${digits}` : "" };
};
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};
const safeOrigin = (value: unknown) => {
  const origin = String(value ?? "").replace(/\/$/, "");
  if (origin === "https://tehno-six.vercel.app") return origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
  return "https://tehno-six.vercel.app";
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается" }, 405);
  try {
    const projectUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!projectUrl || !publishableKey || !serviceKey) return json({ error: "Сервис временно недоступен" }, 503);
    const admin = createClient(projectUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Некорректный запрос" }, 400);
    const payload = body as Record<string, unknown>;
    const action = String(payload.action ?? "");

    if (action === "create") {
      const authorization = req.headers.get("Authorization");
      if (!authorization) return json({ error: "Требуется авторизация" }, 401);
      const userClient = createClient(projectUrl, publishableKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: authData, error: authError } = await userClient.auth.getUser();
      if (authError || !authData.user) return json({ error: "Сессия недействительна" }, 401);
      const { data: profile } = await admin.from("profiles").select("role,is_active").eq("id", authData.user.id).maybeSingle();
      if (profile?.role !== "admin" || !profile.is_active) return json({ error: "Только управляющий может создавать менеджеров" }, 403);
      const fullName = String(payload.full_name ?? "").trim();
      const phone = normalizePhone(payload.phone);
      if (fullName.length < 2 || fullName.length > 120) return json({ error: "Укажите ФИО менеджера" }, 400);
      if (phone.normalized.length < 11 || phone.normalized.length > 15) return json({ error: "Укажите корректный номер телефона" }, 400);
      await admin.from("manager_join_tokens").update({ revoked_at: new Date().toISOString() }).eq("phone_normalized", phone.normalized).is("used_at", null).is("revoked_at", null);
      const token = randomToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const inserted = await admin.from("manager_join_tokens").insert({
        token_hash: tokenHash,
        created_by: authData.user.id,
        expires_at: expiresAt,
        full_name: fullName,
        phone: phone.e164,
        phone_normalized: phone.normalized,
      }).select("id").single();
      if (inserted.error) throw inserted.error;
      const joinUrl = `${safeOrigin(payload.origin)}/#/manager/join?token=${encodeURIComponent(token)}`;
      const qrSvg = await QRCode.toString(joinUrl, { type: "svg", width: 320, margin: 1, errorCorrectionLevel: "M" });
      return json({ ok: true, id: inserted.data.id, join_url: joinUrl, qr_svg: qrSvg, expires_at: expiresAt, full_name: fullName, phone: phone.e164 });
    }

    if (action === "inspect" || action === "redeem") {
      const token = String(payload.token ?? "").trim();
      if (token.length < 30 || token.length > 100) return json({ error: "QR-код недействителен" }, 400);
      const tokenHash = await sha256(token);
      const { data: invite, error: inviteError } = await admin.from("manager_join_tokens")
        .select("id,user_id,full_name,phone,phone_normalized,expires_at,used_at,revoked_at")
        .eq("token_hash", tokenHash).maybeSingle();
      if (inviteError) throw inviteError;
      if (!invite || invite.revoked_at || invite.used_at || new Date(invite.expires_at).getTime() <= Date.now()) return json({ error: "QR-код недействителен или уже использован" }, 410);
      if (action === "inspect") return json({ ok: true, full_name: invite.full_name, phone: invite.phone, expires_at: invite.expires_at });
      const password = String(payload.password ?? "");
      if (password.length < 8) return json({ error: "Пароль должен содержать минимум 8 символов" }, 400);
      const phoneValue = String(invite.phone ?? "");
      if (!phoneValue) return json({ error: "В приглашении отсутствует номер телефона" }, 400);
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        phone: phoneValue,
        password,
        phone_confirm: true,
        app_metadata: { role: "manager" },
        user_metadata: { full_name: invite.full_name },
      });
      if (createError || !created.user) {
        const message = /already|registered|exists|duplicate/i.test(createError?.message ?? "") ? "Менеджер с таким номером уже существует" : (createError?.message || "Не удалось создать аккаунт менеджера");
        return json({ error: message }, 400);
      }
      const userId = created.user.id;
      const profileResult = await admin.from("profiles").upsert({ id: userId, role: "manager", full_name: invite.full_name, phone: phoneValue, is_active: true, updated_at: new Date().toISOString() }, { onConflict: "id" });
      if (profileResult.error) { await admin.auth.admin.deleteUser(userId); throw profileResult.error; }
      const managerResult = await admin.from("manager_profiles").upsert({ user_id: userId, accepts_leads: true }, { onConflict: "user_id" });
      if (managerResult.error) { await admin.auth.admin.deleteUser(userId); throw managerResult.error; }
      const used = await admin.from("manager_join_tokens").update({ user_id: userId, used_at: new Date().toISOString() }).eq("id", invite.id).is("used_at", null);
      if (used.error) { await admin.auth.admin.deleteUser(userId); throw used.error; }
      const audit = await admin.from("audit_logs").insert({ actor_id: null, table_name: "profiles", record_id: userId, action: "RPC", metadata: { function: "manager-access", event: "MANAGER_QR_REDEEM", invite_id: invite.id } });
      if (audit.error) console.warn("manager-access audit warning:", audit.error.message);
      return json({ ok: true, phone: phoneValue, user_id: userId });
    }
    return json({ error: "Неизвестное действие" }, 400);
  } catch (cause) {
    console.error("manager-access:", cause);
    return json({ error: "Не удалось выполнить операцию. Попробуйте ещё раз." }, 400);
  }
});
