import { Link } from 'react-router-dom';
import { getAdminActivity, getAdminStats } from '@suppsense/api-client/';
import { useLoad } from '../lib/useLoad';
import { PageHeader } from '../components/Layout';
import { ErrorBanner, Loading } from '../components/Feedback';
import { BarChart } from '../components/BarChart';

const CHART_DAYS = 14;

export default function DashboardPage() {
    const stats = useLoad(() => getAdminStats(), []);
    const activity = useLoad(() => getAdminActivity(CHART_DAYS), []);

    const cards = stats.data && [
        { to: '/users', value: stats.data.registered_users, label: 'Registered users' },
        { to: '/submissions', value: stats.data.pending_submissions, label: 'Pending submissions', attention: stats.data.pending_submissions > 0 },
        { to: '/products', value: stats.data.products_tracked, label: 'Products tracked' },
        { to: '/ingredients', value: stats.data.ingredients_tracked, label: 'Ingredients tracked' },
    ];

    return (
        <>
            <PageHeader title="Dashboard" subtitle="Overview of platform activity" />

            {stats.error && <ErrorBanner message={stats.error} onRetry={stats.reload} />}
            {stats.loading && !stats.data && <Loading />}
            {cards && (
                <div className="stat-row">
                    {cards.map((card) => (
                        <Link key={card.to} to={card.to} className={`stat${card.attention ? ' stat-attention' : ''}`}>
                            <span className="stat-value">{card.value.toLocaleString('en-NZ')}</span>
                            <span className="stat-label">{card.label}</span>
                        </Link>
                    ))}
                </div>
            )}

            {activity.error && <ErrorBanner message={activity.error} onRetry={activity.reload} />}
            {activity.data && (
                <div className="chart-row">
                    <BarChart title="New submissions" data={activity.data.map((d) => ({ day: d.day, value: d.new_submissions }))} />
                    <BarChart title="New users" data={activity.data.map((d) => ({ day: d.day, value: d.new_users }))} />
                </div>
            )}
        </>
    );
}
