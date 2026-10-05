import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { signIn, takeSignOutReason, useSession } from '../lib/session';
import { errorMessage } from '../lib/format';

export default function LoginPage() {
    const session = useSession();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(() => takeSignOutReason());

    if (session) {
        const from = (location.state as { from?: string } | null)?.from;
        return <Navigate to={from && from !== '/login' ? from : '/'} replace />;
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await signIn(email, password);
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    }

    return (
        <div className="login">
            <form className="login-card" onSubmit={submit}>
                <h1>SuppSense Admin</h1>
                <p className="page-subtitle">Sign in with your SuppSense admin account.</p>

                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input id="email" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
            </form>
        </div>
    );
}
