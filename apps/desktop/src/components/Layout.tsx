import { NavLink, Outlet } from 'react-router-dom';
import { signOut, useSession } from '../lib/session';

const NAV = [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/users', label: 'User Management' },
    { to: '/submissions', label: 'Supplement Admission' },
    { to: '/products', label: 'Supplement Management' },
    { to: '/ingredients', label: 'Ingredient Management' },
];

export default function Layout() {
    const session = useSession();

    return (
        <div className="shell">
            <aside className="sidebar">
                <div className="sidebar-brand">SuppSense Admin</div>
                <nav aria-label="Admin sections">
                    {NAV.map((item) => (
                        <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-foot">
                    <span className="sidebar-user" title={session?.email}>{session?.email}</span>
                    <button className="btn btn-quiet" onClick={() => signOut()}>Sign out</button>
                </div>
            </aside>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
    return (
        <header className="page-header">
            <div>
                <h1>{title}</h1>
                {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
        </header>
    );
}
