import { Check, Copy, Phone, Power, QrCode, Trash2, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CrmEmpty, CrmPageHeader, StatusBadge } from "@/components/crm/CrmUI";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { managerAccessService, type ManagerQrInvite } from "@/services/ManagerAccessService";
import { useAppStore } from "@/stores/useAppStore";

export function ManagersQrSection() {
  const managers = useAppStore((state) => state.managers);
  const deleteManager = useAppStore((state) => state.deleteManager);
  const toggleDistribution = useAppStore((state) => state.toggleManagerDistribution);
  const showToast = useAppStore((state) => state.showToast);
  const loading = useAppStore((state) => state.loading);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+996 ");
  const [invite, setInvite] = useState<ManagerQrInvite | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setFullName("");
    setPhone("+996 ");
    setInvite(null);
    setCopied(false);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const nextInvite = await managerAccessService.createInvite(fullName.trim(), phone.trim());
      setInvite(nextInvite);
      showToast("QR-код менеджера создан");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Не удалось создать QR-код", "error");
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.joinUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="crm-page managers-section manager-qr-section">
      <CrmPageHeader
        title="Менеджеры"
        text="Создавайте доступ без email: ФИО + телефон → одноразовый QR → пароль → рабочее место."
        actions={
          <Button icon={<UserPlus size={17} />} onClick={() => setOpen(true)}>
            Добавить менеджера
          </Button>
        }
      />

      <section className="crm-panel manager-access-note">
        <QrCode size={24} />
        <div>
          <strong>Без писем и ручной регистрации</strong>
          <p>QR действует 24 часа и только один раз. После сканирования менеджер создаёт пароль и дальше входит по номеру телефона.</p>
        </div>
      </section>

      <div className="manager-cards">
        {managers.map((manager) => (
          <article className="manager-card" key={manager.id}>
            <header>
              <span className="manager-avatar">
                {manager.name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("")}
              </span>
              <div>
                <h3>{manager.name}</h3>
                <a href={`tel:${manager.phone}`}><Phone size={14} />{manager.phone || "Телефон не указан"}</a>
              </div>
              <StatusBadge status={manager.status} />
            </header>
            <div className="manager-card__stats">
              <div><span>Заявки</span><strong>{manager.leadCount}</strong></div>
              <div><span>Продажи</span><strong>{manager.salesCount}</strong></div>
              <div><span>Обработано</span><strong>{manager.processedLeadCount}</strong></div>
            </div>
            <footer>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={manager.acceptsLeads}
                  onChange={() => void toggleDistribution(manager.id)}
                />
                <span><Power size={14} /> Принимать заявки</span>
              </label>
              <button
                className="danger"
                disabled={loading}
                onClick={() => {
                  if (window.confirm(`Удалить менеджера ${manager.name}? После этого он потеряет доступ к рабочему месту.`))
                    void deleteManager(manager.id);
                }}
                title="Удалить менеджера"
              >
                <Trash2 size={16} /> Удалить
              </button>
            </footer>
          </article>
        ))}
      </div>
      {!managers.length && <CrmEmpty title="Менеджеров пока нет" text="Создайте первый QR-код для сотрудника." />}

      <Modal open={open} onClose={close} title={invite ? "QR-доступ менеджера" : "Новый менеджер"} size="md" className="manager-qr-modal">
        {!invite ? (
          <form className="crm-form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="manager-name-qr">ФИО менеджера</label>
              <input
                id="manager-name-qr"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Например: Азамат Токтосунов"
                autoComplete="name"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="manager-phone-qr">Номер телефона</label>
              <input
                id="manager-phone-qr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+996 700 123 456"
                autoComplete="tel"
                required
              />
            </div>
            <p className="form-hint">Email не нужен. После создания покажите QR менеджеру или отправьте ему ссылку.</p>
            <footer className="modal-form-actions">
              <Button type="button" variant="ghost" onClick={close}>Отмена</Button>
              <Button type="submit" icon={<QrCode size={17} />} disabled={creating}>
                {creating ? "Создаём…" : "Создать QR-код"}
              </Button>
            </footer>
          </form>
        ) : (
          <div className="manager-qr-result">
            <div className="manager-qr-person">
              <span>{invite.fullName}</span>
              <strong>{invite.phone}</strong>
            </div>
            <div className="manager-qr-code" dangerouslySetInnerHTML={{ __html: invite.qrSvg }} />
            <p>Менеджер сканирует этот QR камерой телефона, придумывает пароль и сразу попадает в своё рабочее место.</p>
            <small>QR одноразовый. Действует до {new Date(invite.expiresAt).toLocaleString("ru-RU")}.</small>
            <div className="manager-qr-link">
              <input readOnly value={invite.joinUrl} aria-label="Ссылка приглашения" />
              <Button type="button" variant="secondary" icon={copied ? <Check size={17} /> : <Copy size={17} />} onClick={copy}>
                {copied ? "Скопировано" : "Копировать"}
              </Button>
            </div>
            <Button type="button" block onClick={close}>Готово</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
