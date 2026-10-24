import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useUI } from '../../store/ui';

export function ToastViewport() {
  const toasts = useUI((state) => state.toasts);
  const dismiss = useUI((state) => state.dismissToast);

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`} role="status">
          {toast.tone === 'error' ? (
            <AlertCircle aria-hidden="true" />
          ) : toast.tone === 'success' ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <Info aria-hidden="true" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-button icon-button--ghost"
            style={{ width: 22, height: 22, marginRight: -5 }}
            aria-label="Dismiss message"
            onClick={() => dismiss(toast.id)}
          >
            <X aria-hidden="true" style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}
    </div>
  );
}
