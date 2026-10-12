export const PAGE_SIZE = 25;

export function Pagination({ total, limit, offset, onChange }: { total: number; limit: number; offset: number; onChange: (offset: number) => void }) {
    if (total <= limit) { return null; }
    const page = Math.floor(offset / limit) + 1;
    const pages = Math.ceil(total / limit);

    return (
        <nav className="pagination" aria-label="Pages">
            <button className="btn" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className="btn" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>Next</button>
        </nav>
    );
}
