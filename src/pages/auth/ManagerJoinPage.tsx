import { CheckCircle2, Eye, EyeOff, KeyRound, QrCode, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { managerAccessService } from "@/services/ManagerAccessService";
import { useAppStore } from "@/stores/useAppStore";

export default function ManagerJoinPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token")?.trim() ?? "", [params]);
  const login = useAppStore((state) => state.login);
  const logout = useAppStore((state) => state.logout);
  const [invite, setInvite] = useState<{ full_name: string; phone: string; expires_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) {
        setError("В QR-коде нет ключа доступа");
        setLoading(false);
        return;
      }
      try {
        const data = await managerAccessService.inspect(token);
        if (active) setInvite(data);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "QR-код недействителен");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [token]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!invite) return;
    if (password.length < 8) return setError("Пароль должен содержать минимум 8 символов");
    if (password !== confirmPassword) return setError("Пароли не совпадают");
    setSaving(true);
    try {
      const redeemed = await managerAccessService.redeem(token, password);
      const session = await login(redeemed.loginEmail, password);
      if (session.role !== "manager") {
        await logout();
        throw new Error("Рабочее место менеджера не найдено");
      }
      navigate("/crm/manager/dashboard", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось активировать рабочее место");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="login-page manager-join-page">
      <div className="login-brand-panel">
        <div className="login-brand-panel__noise" />
        <div className="login-brand-content">
          <Logo inverted />
          <span className="login-ai-pill"><QrCode size={16} />Доступ по QR</span>
          <h1>Ваше рабочее место менеджера готово к активации.</h1>
          <p>Создайте личный пароль. После этого QR больше не сработает, а вход будет выполняться по номеру телефона и паролю.</p>
          <div className="invite-benefits">
            <span><CheckCircle2 size={18} />QR используется только один раз</span>
            <span><CheckCircle2 size={18} />Личный пароль хранится в Supabase Auth</span>
            <span><CheckCircle2 size={18} />Удалённый менеджер теряет доступ</span>
          </div>
        </div>
      </div>
      <main className="login-form-panel">
        {loading ? (
          <div className="login-form manager-join-loading"><QrCode size={32} /><h2>Проверяем QR…</h2></div>
        ) : !invite ? (
          <div className="login-form invite-expired">
            <div className="login-form__icon"><ShieldAlert size={25} /></div>
            <h2>QR недействителен</h2>
            <p>{error || "Попросите управляющего создать новый QR-код."}</p>
            <Link to="/login"><Button block>Перейти ко входу</Button></Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <div className="login-form__icon"><KeyRound size={25} /></div>
            <span className="eyebrow">TEHNO OPERATIONS</span>
            <h2>{invite.full_name}</h2>
            <p>Ваш логин: <strong>{invite.phone}</strong></p>
            <div className="field">
              <label htmlFor="manager-join-password">Придумайте пароль</label>
              <div className="password-input">
                <input
                  id="manager-join-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "manager-join-error" : undefined}
                  minLength={8}
                  required
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="manager-join-confirm">Повторите пароль</label>
              <input
                id="manager-join-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "manager-join-error" : undefined}
                minLength={8}
                required
              />
            </div>
            {error && <div id="manager-join-error" className="login-error" role="alert"><ShieldAlert size={17} />{error}</div>}
            <Button type="submit" block size="lg" disabled={saving}>{saving ? "Активируем…" : "Создать пароль и войти"}</Button>
          </form>
        )}
      </main>
    </div>
  );
}
