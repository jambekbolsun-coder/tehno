import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { getManagerAuthEmail, normalizeManagerPhone } from "@/lib/managerAuth";
import { useAppStore } from "@/stores/useAppStore";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const loading = useAppStore((state) => state.loading);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const passwordWasReset = Boolean((location.state as { passwordReset?: boolean } | null)?.passwordReset);

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

      const phone = normalizeManagerPhone(value).e164;
      const email = getManagerAuthEmail(phone);
      try {
        const session = await login(email, password);
        if (session.role !== "manager") {
          await logout();
          throw new Error("Этот номер не связан с рабочим местом менеджера");
        }
        navigate("/crm/manager/dashboard", { replace: true });
      } catch (cause) {
        if (cause instanceof Error && /активирован|отключен|рабочим местом/.test(cause.message))
          throw cause;
        throw new Error("Неверный номер телефона или пароль");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка входа");
    }
  };

  const busy = loading;

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
          {passwordWasReset && <div className="login-success" role="status">Пароль изменён. Теперь войдите с новым паролем.</div>}
          <div className="field">
            <label htmlFor="login-identifier">Email или номер телефона</label>
            <input
              id="login-identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="admin@mail.com или +996 700 123 456"
              autoComplete="username"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-error" : undefined}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="login-password">{t("password")}</label>
              <Link to="/forgot-password">Забыли пароль?</Link>
            </div>
            <div className="password-input">
              <input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} required/>
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          </div>
          {error && <div id="login-error" className="login-error" role="alert"><ShieldAlert size={17}/>{error}</div>}
          <Button type="submit" block size="lg" disabled={busy}>{busy ? "Вход…" : t("signIn")}</Button>
        </form>
      </main>
    </div>
  );
}
