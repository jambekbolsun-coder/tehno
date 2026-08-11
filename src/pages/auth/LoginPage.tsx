import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppStore } from "@/stores/useAppStore";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAppStore((state) => state.login);
  const loading = useAppStore((state) => state.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const session = await login(email.trim(), password);
      const requested = (location.state as { from?: string } | null)?.from;
      navigate(
        requested && requested.includes(`/crm/${session.role}`)
          ? requested
          : `/crm/${session.role}/dashboard`,
        { replace: true },
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка входа");
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise"/>
        <Link to="/" className="login-back"><ArrowLeft size={17}/>Вернуться в магазин</Link>
        <div className="login-brand-content">
          <Logo inverted/>
          <span className="login-ai-pill"><Sparkles size={16}/>CRM, склад и продажи в реальном времени</span>
          <h1>Магазин, склад и продажи — в одном рабочем пространстве.</h1>
          <p>Защищённый вход для управляющего и менеджеров. Данные синхронизируются с Supabase и доступны согласно роли сотрудника.</p>
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
          <p>Введите данные сотрудника, созданного в Supabase Authentication.</p>
          <div className="field">
            <label htmlFor="login-email">{t("email")}</label>
            <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required autoFocus/>
          </div>
          <div className="field">
            <label htmlFor="login-password">{t("password")}</label>
            <div className="password-input">
              <input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          </div>
          {error && <div className="login-error" role="alert"><ShieldAlert size={17}/>{error}</div>}
          <Button type="submit" block size="lg" disabled={loading}>{loading ? "Вход…" : t("signIn")}</Button>
        </form>
      </main>
    </div>
  );
}
