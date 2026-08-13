import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { clearPendingInvite } from "@/lib/supabase";
import { useAppStore } from "@/stores/useAppStore";

export default function InvitePage() {
  const navigate = useNavigate();
  const session = useAppStore((state) => state.session);
  const loading = useAppStore((state) => state.loading);
  const completeInvite = useAppStore((state) => state.completeInvite);
  const [name, setName] = useState(session?.name === "Менеджер" ? "" : session?.name ?? "");
  const [phone, setPhone] = useState(session?.phone ?? "+996 ");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    if (!name && session.name !== "Менеджер") setName(session.name);
    if (phone === "+996 " && session.phone) setPhone(session.phone);
  }, [session, name, phone]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8)
      return setError("Пароль должен содержать минимум 8 символов");
    if (password !== confirmPassword)
      return setError("Пароли не совпадают");
    try {
      const nextSession = await completeInvite(password, name.trim(), phone.trim());
      clearPendingInvite();
      navigate(`/crm/${nextSession.role}/dashboard`, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось завершить регистрацию");
    }
  };

  return (
    <div className="login-page invite-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise" />
        <div className="login-brand-content">
          <Logo inverted />
          <span className="login-ai-pill"><UserRound size={16} />Приглашение в команду</span>
          <h1>Создайте пароль и откройте рабочее место менеджера.</h1>
          <p>После активации вы сможете работать с заявками, клиентами, продажами и менять пароль в своём профиле.</p>
          <div className="invite-benefits">
            <span><CheckCircle2 size={18} />Личный защищённый доступ</span>
            <span><CheckCircle2 size={18} />Только назначенные заявки</span>
            <span><CheckCircle2 size={18} />История действий сохраняется</span>
          </div>
        </div>
      </div>
      <main className="login-form-panel">
        {!session ? (
          <div className="login-form invite-expired">
            <div className="login-form__icon"><ShieldAlert size={25} /></div>
            <h2>Ссылка недействительна</h2>
            <p>Откройте последнюю ссылку из письма. Если она устарела, попросите управляющего отправить приглашение повторно.</p>
            <Link to="/login"><Button block>Перейти ко входу</Button></Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <div className="login-form__icon"><KeyRound size={25} /></div>
            <span className="eyebrow">TEHNO OPERATIONS</span>
            <h2>Завершение регистрации</h2>
            <p>Укажите свои данные и придумайте новый пароль.</p>
            <div className="field">
              <label htmlFor="invite-name">Имя и фамилия</label>
              <input id="invite-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="invite-phone">Телефон</label>
              <input id="invite-phone" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required />
            </div>
            <div className="field">
              <label htmlFor="invite-password">Новый пароль</label>
              <div className="password-input">
                <input id="invite-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="invite-password-confirm">Повторите пароль</label>
              <input id="invite-password-confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
            </div>
            {error && <div className="login-error" role="alert"><ShieldAlert size={17} />{error}</div>}
            <Button type="submit" block size="lg" disabled={loading}>{loading ? "Сохраняем…" : "Создать пароль и войти"}</Button>
          </form>
        )}
      </main>
    </div>
  );
}
