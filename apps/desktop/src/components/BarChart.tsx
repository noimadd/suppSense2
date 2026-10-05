import { shortDay } from '../lib/format';

/**
 * Small dependency-free bar chart for the dashboard's per-day counts.
 */
export function BarChart({ title, data }: { title: string; data: { day: string; value: number }[] }) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <figure className="chart">
            <figcaption>
                <span className="chart-title">{title}</span>
                <span className="chart-total">{total.toLocaleString('en-NZ')} in the last {data.length} days</span>
            </figcaption>
            <div className="chart-plot" role="img" aria-label={`${title}: ${data.map((d) => `${shortDay(d.day)} ${d.value}`).join(', ')}`}>
                {data.map((d) => (
                    <div key={d.day} className="chart-col" title={`${shortDay(d.day)}: ${d.value}`}>
                        <span className="chart-value">{d.value > 0 ? d.value : ''}</span>
                        <div className="chart-bar" style={{ height: `${(d.value / max) * 100}%` }} />
                    </div>
                ))}
            </div>
            <div className="chart-axis" aria-hidden="true">
                {data.map((d, i) => (
                    <span key={d.day}>{i % 2 === 0 || data.length <= 8 ? shortDay(d.day) : ''}</span>
                ))}
            </div>
        </figure>
    );
}
