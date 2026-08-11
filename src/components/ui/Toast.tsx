import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function ToastRegion() {
  const toast = useAppStore((state) => state.toast);
  const clear = useAppStore((state) => state.clearToast);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clear, 3400);
    return () => window.clearTimeout(timer);
  }, [toast, clear]);
  if (!toast) return <div className="toast-region" aria-live="polite" />;
  const Icon = toast.kind === "success" ? CheckCircle2 : toast.kind === "error" ? CircleAlert : Info;
  return (
    <div className="toast-region" aria-live="polite">
      <div className={`toast toast--${toast.kind}`} role="status">
        <Icon size={20} />
        <span>{toast.message}</span>
        <button className="toast__close" onClick={clear} aria-label="Закрыть уведомление"><X size={16} /></button>
      </div>
    </div>
  );
}
