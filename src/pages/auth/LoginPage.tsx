import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/useAppStore";

const normalizePhone = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `996${digits.slice(1)}`;
  if (digits.length === 9) digits = `996${digits}`;
  return digits ? `+${digits}` : "";
};

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAppStore((state) => state.login);
  const loading = useAppStore((state) => state.loading);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const value = identifier.trim();
      if (value.includes("@")) {
        const session = await login(value.toLowerCase(), password);
        const requested = (location.state as { from?: string } | null)?.from;
        navigate(
          requested && requested.includes(`/crm/${session.role}`)
            ? requested
            : `/crm/${session.role}/dashboard`,
          { replace: true },
        );
        return;
      }

      const phone = normalizePhone(value);
      if (phone.replace(/\D/g, "").length < 11) throw new Error("Введите корректный номер телефона");
      setPhoneLoading(true);
      const signedIn = await supabase.auth.signInWithPassword({ phone, password });
      if (signedIn.error || !signedIn.data.user) throw new Error("Неверный номер телефона или пароль");
      const profile = await supabase.from("profiles").select("role,is_active").eq("id", signedIn.data.user.id).single();
      if (profile.error || !profile.data?.is_active || profile.data.role !== "manager") {
        await supabase.auth.signOut();
        throw new Error("Учётная запись менеджера отключена управляющим");
      }
      window.location.hash = "#/crm/manager/dashboard";
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка входа");
    } finally {
      setPhoneLoading(false);
    }
  };

  const busy = loading || phoneLoading;

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise"/>
        <Link to="/" className="login-back"><ArrowLeft size={17}/>Вернуться в магазин</Link>
        <div className="login-brand-content">
          <Logo inverted/>
          <span className="login-ai-pill"><Sparkles size={16}/>CRM, склад и продажи в реальном времени</span>
          <h1>Магазин, склад и продажи — в одном рабочем пространстве.</h1>
          <p>Управляющий входит по email, менеджер — по номеру телефона. Доступ проверяется через Supabase и роль сотрудника.</p>
          <div className="login-feature-grid">
            <div><strong>19</strong><span>разделов управляющего</span></div>
            <div><strong>10</strong><span>разделов менеджера</span></div>
            <div><strong>24/7</strong><span>облачная синхронизация</span></div>
          </div>
        </div>
      </div>
      <main className="login-form-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form__icon"><LockKeyhole size={25}/></div>
          <span className="eyebrow">TEHNO OPERATIONS</span>
          <h2>{t("login")}</h2>
          <p>Управляющий: email. Менеджер: номер телефона.</p>
          <div className="field">
            <label htmlFor="login-identifier">Email или номер телефона</label>
            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@mail.com или +996 700 123 456"
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">{t("password")}</label>
            <div className="password-input">
              <input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          </div>
          {error && <div className="login-error" role="alert"><ShieldAlert size={17}/>{error}</div>}
          <Button type="submit" block size="lg" disabled={busy}>{busy ? "Вход…" : t("signIn")}</Button>
        </form>
      </main>
    </div>
  );
}
