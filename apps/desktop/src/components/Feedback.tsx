import { createContext, useCallback, useContext, useState } from 'react';

// ------------------------------------------------------------------
// Inline banners
// ------------------------------------------------------------------

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <div className="banner banner-error" role="alert">
            <span>{message}</span>
            {onRetry && <button className="btn btn-quiet" onClick={onRetry}>Try again</button>}
        </div>
    );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
    return <div className="empty">{children}</div>;
}

export function Loading({ label = 'Loading' }: { label?: string }) {
    return <div className="loading" role="status">{label}…</div>;
}

// ------------------------------------------------------------------
// Toasts - short confirmations like "User deleted."
// ------------------------------------------------------------------

interface Toast { id: number; message: string; tone: 'success' | 'error' }

const ToastContext = createContext<(message: string, tone?: Toast['tone']) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((message: string, tone: Toast['tone'] = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((t) => [...t, { id, message, tone }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }, []);

    return (
        <ToastContext.Provider value={show}>
            {children}
            <div className="toasts" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.tone}`}>{t.message}</div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);

// ------------------------------------------------------------------
// Status pills
// ------------------------------------------------------------------

export function Pill({ tone, children }: { tone: 'good' | 'warn' | 'neutral' | 'accent'; children: React.ReactNode }) {
    return <span className={`pill pill-${tone}`}>{children}</span>;
}
