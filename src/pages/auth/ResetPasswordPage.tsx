import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import {
  clearPendingPasswordRecovery,
  hasPendingPasswordRecovery,
  supabase,
} from "@/lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setReady(Boolean(data.session) && hasPendingPasswordRecovery());
      setChecking(false);
    };
    void check();
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Пароль должен содержать минимум 8 символов");
    if (password !== confirmPassword) return setError("Пароли не совпадают");
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      clearPendingPasswordRecovery();
      await supabase.auth.signOut();
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось изменить пароль");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page password-recovery-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise" />
        <div className="login-brand-content">
          <Logo inverted />
          <span className="login-ai-pill"><KeyRound size={16} />Новый пароль</span>
          <h1>Создайте новый пароль для рабочего пространства.</h1>
          <p>После сохранения все дальнейшие входы будут выполняться уже с новым паролем.</p>
          <div className="invite-benefits">
            <span><CheckCircle2 size={18} />Минимум 8 символов</span>
            <span><CheckCircle2 size={18} />Ссылка используется только для восстановления</span>
          </div>
        </div>
      </div>
      <main className="login-form-panel">
        {checking ? (
          <div className="login-form manager-join-loading" role="status"><KeyRound size={32} /><h2>Проверяем ссылку…</h2></div>
        ) : !ready ? (
          <div className="login-form invite-expired">
            <div className="login-form__icon"><ShieldAlert size={25} /></div>
            <h2>Ссылка недействительна</h2>
            <p>Срок ссылки истёк или она уже была использована. Запросите новое письмо.</p>
            <Link to="/forgot-password"><Button block>Запросить новую ссылку</Button></Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit} aria-busy={saving}>
            <div className="login-form__icon"><KeyRound size={25} /></div>
            <span className="eyebrow">TEHNO OPERATIONS</span>
            <h2>Новый пароль</h2>
            <p>Придумайте пароль и повторите его для проверки.</p>
            <div className="field">
              <label htmlFor="reset-password">Новый пароль</label>
              <div className="password-input">
                <input id="reset-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} aria-invalid={Boolean(error)} aria-describedby={error ? "reset-password-error" : undefined} required autoFocus />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="reset-password-confirm">Повторите пароль</label>
              <input id="reset-password-confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} aria-invalid={Boolean(error)} aria-describedby={error ? "reset-password-error" : undefined} required />
            </div>
            {error && <div id="reset-password-error" className="login-error" role="alert"><ShieldAlert size={17} />{error}</div>}
            <Button type="submit" block size="lg" disabled={saving}>{saving ? "Сохраняем…" : "Сохранить новый пароль"}</Button>
          </form>
        )}
      </main>
    </div>
  );
}
