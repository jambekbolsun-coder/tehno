import { ArrowLeft, KeyRound, MailCheck, ShieldAlert } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/` },
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось отправить письмо");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page password-recovery-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise" />
        <Link to="/login" className="login-back"><ArrowLeft size={17} />Вернуться ко входу</Link>
        <div className="login-brand-content">
          <Logo inverted />
          <span className="login-ai-pill"><KeyRound size={16} />Восстановление доступа</span>
          <h1>Верните доступ к панели управляющего безопасно.</h1>
          <p>Мы отправим одноразовую ссылку на email управляющего. Менеджеру без email управляющий создаёт новый QR в разделе «Менеджеры».</p>
        </div>
      </div>
      <main className="login-form-panel">
        {sent ? (
          <div className="login-form recovery-success" role="status" aria-live="polite">
            <div className="login-form__icon"><MailCheck size={25} /></div>
            <span className="eyebrow">ПИСЬМО ОТПРАВЛЕНО</span>
            <h2>Проверьте почту</h2>
            <p>Если аккаунт с таким email существует, письмо со ссылкой для смены пароля уже отправлено.</p>
            <Link to="/login"><Button block size="lg">Вернуться ко входу</Button></Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit} aria-busy={loading}>
            <div className="login-form__icon"><KeyRound size={25} /></div>
            <span className="eyebrow">TEHNO OPERATIONS</span>
            <h2>Забыли пароль?</h2>
            <p>Введите email управляющего, который используется для входа.</p>
            <div className="field">
              <label htmlFor="recovery-email">Email управляющего</label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "recovery-error" : "recovery-help"}
                required
                autoFocus
              />
              <small id="recovery-help" className="field-help">Ссылка действует ограниченное время и может быть использована один раз.</small>
            </div>
            {error && <div id="recovery-error" className="login-error" role="alert"><ShieldAlert size={17} />{error}</div>}
            <Button type="submit" block size="lg" disabled={loading}>{loading ? "Отправляем…" : "Отправить ссылку"}</Button>
          </form>
        )}
      </main>
    </div>
  );
}
