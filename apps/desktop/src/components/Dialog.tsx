import { useEffect, useId, useRef, useState } from 'react';
import { errorMessage } from '../lib/format';

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    tone?: 'default' | 'danger';
    wide?: boolean;
}

/**
 * Modal built on <dialog>, so focus trapping and Escape-to-close come from the browser.
 */
export function Modal({ title, onClose, children, footer, tone = 'default', wide }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (dialog && !dialog.open) { dialog.showModal(); }
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className={`modal modal-${tone}${wide ? ' modal-wide' : ''}`}
            aria-labelledby={titleId}
            onCancel={(e) => { e.preventDefault(); onClose(); }}
        >
            <header className="modal-header">
                <h2 id={titleId}>{title}</h2>
                <button className="btn btn-quiet modal-close" onClick={onClose} aria-label="Close">✕</button>
            </header>
            <div className="modal-body">{children}</div>
            {footer && <footer className="modal-footer">{footer}</footer>}
        </dialog>
    );
}

interface ConfirmProps {
    title: string;
    /** what will happen - be specific about what is lost */
    children: React.ReactNode;
    confirmLabel: string;
    /** ask the admin to re-enter their own password (for permanent deletes) */
    requirePassword?: boolean;
    tone?: 'default' | 'danger';
    onConfirm: (password: string) => Promise<void>;
    onClose: () => void;
}

/**
 * Confirmation for risky actions. Shows the consequence, optionally asks for the admin's password,
 * and keeps the dialog open with the server's error if the action fails.
 */
export function ConfirmDialog({ title, children, confirmLabel, requirePassword, tone = 'danger', onConfirm, onClose }: ConfirmProps) {
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const passwordId = useId();

    async function confirm(e: React.FormEvent) {
        e.preventDefault();
        // React events bubble through the component tree, not the DOM, so without this a confirm
        // dialog rendered inside another form would also submit that form
        e.stopPropagation();
        if (requirePassword && !password) { return; }
        setBusy(true);
        setError(null);
        try {
            await onConfirm(password);
            onClose();
        } catch (err) {
            setError(errorMessage(err));
            setPassword('');
            setBusy(false);
        }
    }

    return (
        <Modal title={title} onClose={busy ? () => {} : onClose} tone={tone}>
            <form onSubmit={confirm} className="confirm">
                <div className="confirm-body">{children}</div>
                {requirePassword && (
                    <div className="field">
                        <label htmlFor={passwordId}>Enter your password to confirm</label>
                        <input
                            id={passwordId}
                            type="password"
                            autoComplete="current-password"
                            autoFocus
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                )}
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="modal-footer">
                    <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
                    <button
                        type="submit"
                        className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                        disabled={busy || (requirePassword && !password)}
                        autoFocus={!requirePassword}
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
