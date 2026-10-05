import { useState } from 'react';
import { deleteAdminUser, listAdminUsers, resetAdminUserPassword, updateAdminUser } from '@suppsense/api-client';
import type { AdminUser, AdminUserPatch } from '@suppsense/shared-types';
import { request, useSession } from '../lib/session';
import { useDebounced, useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, plural, searchSuffix, timeAgo } from '../lib/format';
import { PageHeader } from '../components/Layout';
import { EmptyState, ErrorBanner, Loading, Pill, useToast } from '../components/Feedback';
import { ConfirmDialog, Modal } from '../components/Dialog';
import { PAGE_SIZE, Pagination } from '../components/Pagination';

export default function UsersPage() {
    const session = useSession();
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const debounced = useDebounced(search);
    const users = useLoad(() => listAdminUsers({ search: debounced, limit: PAGE_SIZE, offset }), [debounced, offset]);

    const [editing, setEditing] = useState<AdminUser | null>(null);
    const [deleting, setDeleting] = useState<AdminUser | null>(null);

    const isSelf = (user: AdminUser) => user.id === session?.userId;

    return (
        <>
            <PageHeader
                title="User Management"
                subtitle={users.data ? `${plural(users.data.total, 'registered account')}${searchSuffix(users.data.total, debounced)}` : undefined}
            />

            <div className="toolbar">
                <input
                    type="search"
                    className="search"
                    placeholder="Search by name, username or email"
                    aria-label="Search users"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                />
            </div>

            {users.error && <ErrorBanner message={users.error} onRetry={users.reload} />}
            {users.loading && !users.data && <Loading />}

            {users.data && users.data.items.length === 0 && (
                <EmptyState>{debounced ? `No users match "${debounced}".` : 'No users have registered yet.'}</EmptyState>
            )}

            {users.data && users.data.items.length > 0 && (
                <div className={`table-wrap${users.loading ? ' is-loading' : ''}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.items.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div>{user.first_name} {user.last_name}{isSelf(user) && <span className="muted"> (you)</span>}</div>
                                        <div className="muted small">@{user.username}</div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.user_type === 'admin' ? <Pill tone="accent">Admin</Pill> : 'User'}</td>
                                    <td>{user.email_verified ? <Pill tone="good">Verified</Pill> : <Pill tone="warn">Unverified</Pill>}</td>
                                    <td title={formatDateTime(user.created_at)}>{timeAgo(user.created_at)}</td>
                                    <td className="actions-col">
                                        <button className="btn btn-link" onClick={() => setEditing(user)}>Edit</button>
                                        <button
                                            className="btn btn-link btn-link-danger"
                                            onClick={() => setDeleting(user)}
                                            disabled={isSelf(user)}
                                            title={isSelf(user) ? 'You cannot delete your own account' : undefined}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {users.data && <Pagination total={users.data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />}

            {editing && (
                <EditUserDialog
                    user={editing}
                    isSelf={isSelf(editing)}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); toast('User updated.'); users.reload(); }}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title={`Delete ${deleting.first_name} ${deleting.last_name}?`}
                    confirmLabel="Delete user"
                    requirePassword
                    onClose={() => setDeleting(null)}
                    onConfirm={async (password) => {
                        await request(() => deleteAdminUser(deleting.id, password));
                        toast('User deleted.');
                        users.reload();
                    }}
                >
                    <p>
                        This permanently deletes <strong>{deleting.email}</strong>, their product libraries and any submissions still
                        waiting for review, and signs them out everywhere. Products of theirs that were already approved stay.
                    </p>
                    <p>This can't be undone.</p>
                </ConfirmDialog>
            )}
        </>
    );
}

function EditUserDialog({ user, isSelf, onClose, onSaved }: { user: AdminUser; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
    const toast = useToast();
    const [form, setForm] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        user_type: user.user_type,
        email_verified: user.email_verified,
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

    async function save(e: React.FormEvent) {
        e.preventDefault();
        // only send what changed, so an untouched email doesn't sign the user out
        const patch: AdminUserPatch = {};
        for (const key of Object.keys(form) as (keyof typeof form)[]) {
            const value = typeof form[key] === 'string' ? (form[key] as string).trim() : form[key];
            if (value !== user[key]) { (patch as Record<string, unknown>)[key] = value; }
        }
        if (Object.keys(patch).length === 0) { onClose(); return; }

        setBusy(true);
        setError(null);
        try {
            await request(() => updateAdminUser(user.id, patch));
            onSaved();
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    }

    const signsOut = form.email.trim().toLowerCase() !== user.email || form.user_type !== user.user_type;

    return (
        <>
            <Modal
                title={`Edit ${user.first_name} ${user.last_name}`}
                onClose={busy ? () => {} : onClose}
                footer={
                    <>
                        <button type="button" className="btn btn-push-left" onClick={() => setResetting(true)} disabled={busy}>Reset password</button>
                        <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
                        <button type="submit" form="edit-user" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
                    </>
                }
            >
                <form id="edit-user" onSubmit={save}>
                    <fieldset disabled={busy}>
                        <div className="field-grid">
                            <div className="field">
                                <label htmlFor="u-first">First name</label>
                                <input id="u-first" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
                            </div>
                            <div className="field">
                                <label htmlFor="u-last">Last name</label>
                                <input id="u-last" required value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
                            </div>
                        </div>
                        <div className="field">
                            <label htmlFor="u-username">Username</label>
                            <input id="u-username" required value={form.username} onChange={(e) => set('username', e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="u-email">Email</label>
                            <input id="u-email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
                        </div>
                        <div className="field-grid">
                            <div className="field">
                                <label htmlFor="u-role">Role</label>
                                <select
                                    id="u-role"
                                    value={form.user_type}
                                    disabled={isSelf}
                                    onChange={(e) => set('user_type', e.target.value as 'user' | 'admin')}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                {isSelf && <p className="hint">You can't change your own role.</p>}
                            </div>
                            <div className="field">
                                <span className="label">Email status</span>
                                <label className="check">
                                    <input type="checkbox" checked={form.email_verified} onChange={(e) => set('email_verified', e.target.checked)} />
                                    Email verified
                                </label>
                            </div>
                        </div>
                        {signsOut && <p className="banner banner-warn">Changing the email or role signs this user out of all their devices.</p>}
                        {error && <p className="form-error" role="alert">{error}</p>}
                    </fieldset>
                </form>
                <p className="muted small">Joined {formatDateTime(user.created_at)}. Last signed in {user.last_login ? formatDateTime(user.last_login) : 'never'}.</p>
            </Modal>

            {resetting && (
                <ConfirmDialog
                    title="Reset password?"
                    confirmLabel="Reset password"
                    onClose={() => setResetting(false)}
                    onConfirm={async () => {
                        await request(() => resetAdminUserPassword(user.id));
                        toast(`Temporary password emailed to ${user.email}.`);
                    }}
                >
                    <p>
                        <strong>{user.email}</strong> will be emailed a temporary password and signed out of all their devices.
                        Their current password stops working straight away.
                    </p>
                </ConfirmDialog>
            )}
        </>
    );
}
