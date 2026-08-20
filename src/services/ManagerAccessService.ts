import { supabase } from "@/lib/supabase";

export interface ManagerQrInvite {
  id: string;
  joinUrl: string;
  qrSvg: string;
  expiresAt: string;
  fullName: string;
  phone: string;
}

const invoke = async <T>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke("manager-access", { body });
  if (error) {
    let serverMessage = "";
    const context = (error as { context?: Response }).context;
    if (context && typeof context.clone === "function") {
      try {
        const payload = await context.clone().json() as { error?: unknown };
        if (typeof payload.error === "string") serverMessage = payload.error;
      } catch {
        // Keep the SDK message when the response body is not JSON.
      }
    }
    throw new Error(serverMessage || error.message || "Не удалось выполнить операцию");
  }
  if (!data?.ok) throw new Error(data?.error || "Не удалось выполнить операцию");
  return data as T;
};

export const managerAccessService = {
  async createInvite(fullName: string, phone: string): Promise<ManagerQrInvite> {
    const data = await invoke<{
      ok: true;
      id: string;
      join_url: string;
      qr_svg: string;
      expires_at: string;
      full_name: string;
      phone: string;
    }>({
      action: "create",
      full_name: fullName,
      phone,
      origin: window.location.origin,
    });
    return {
      id: data.id,
      joinUrl: data.join_url,
      qrSvg: data.qr_svg,
      expiresAt: data.expires_at,
      fullName: data.full_name,
      phone: data.phone,
    };
  },

  async inspect(token: string) {
    return invoke<{ ok: true; full_name: string; phone: string; expires_at: string }>({
      action: "inspect",
      token,
    });
  },

  async redeem(token: string, password: string) {
    const data = await invoke<{ ok: true; phone: string; user_id: string; login_email: string }>({
      action: "redeem",
      token,
      password,
    });
    return {
      phone: data.phone,
      userId: data.user_id,
      loginEmail: data.login_email,
    };
  },
};
