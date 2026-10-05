import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { acceptSubmission, listSubmissions, rejectSubmission, updateSubmission } from '@suppsense/api-client';
import type { AdminProduct } from '@suppsense/shared-types';
import { request } from '../lib/session';
import { useDebounced, useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, plural, searchSuffix, timeAgo } from '../lib/format';
import { PageHeader } from '../components/Layout';
import { EmptyState, ErrorBanner, Loading, useToast } from '../components/Feedback';
import { ConfirmDialog } from '../components/Dialog';
import { PAGE_SIZE, Pagination } from '../components/Pagination';
import { ProductDraft, ProductForm, draftFromProduct, draftToPatch, isDraftChanged, validateDraft } from '../components/ProductForm';

export default function SubmissionsPage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('id');
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const debounced = useDebounced(search);
    const list = useLoad(() => listSubmissions({ search: debounced, limit: PAGE_SIZE, offset }), [debounced, offset]);

    const [draft, setDraft] = useState<ProductDraft | null>(null);
    const items = list.data?.items ?? [];
    const selected = items.find((s) => s.id === selectedId) ?? null;
    const dirty = !!(selected && draft && isDraftChanged(draft, selected));

    const select = (id: string | null) => setParams(id ? { id } : {}, { replace: true });

    // open the oldest submission automatically, and reset the form when the selection changes
    useEffect(() => {
        if (!list.data) { return; }
        if (!selected) {
            if (items.length) { select(items[0].id); } else { setDraft(null); }
            return;
        }
        setDraft(draftFromProduct(selected));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected?.id, list.data]);

    function trySelect(id: string) {
        if (id === selectedId) { return; }
        if (dirty && !window.confirm(`Discard your changes to "${selected?.name}"?`)) { return; }
        select(id);
    }

    /** after accept/reject: drop it from the list and move to the next one */
    function removeFromQueue(id: string) {
        const index = items.findIndex((s) => s.id === id);
        const next = items[index + 1] ?? items[index - 1] ?? null;
        select(next?.id ?? null);
        list.reload();
    }

    return (
        <>
            <PageHeader
                title="Supplement Admission"
                subtitle={list.data ? `${plural(list.data.total, 'pending submission')}${searchSuffix(list.data.total, debounced)}` : undefined}
            />

            {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}

            <div className="split">
                <section className="split-list" aria-label="Pending submissions">
                    <input
                        type="search"
                        className="search"
                        placeholder="Search submissions"
                        aria-label="Search submissions"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                    />
                    {list.loading && !list.data && <Loading />}
                    {list.data && items.length === 0 && (
                        <EmptyState>{debounced ? `No submissions match "${debounced}".` : 'The queue is empty. New user submissions will appear here.'}</EmptyState>
                    )}
                    <ul className="pick-list">
                        {items.map((s) => (
                            <li key={s.id}>
                                <button className={`pick${s.id === selectedId ? ' is-selected' : ''}`} onClick={() => trySelect(s.id)} aria-current={s.id === selectedId}>
                                    <span className="pick-title">{s.name}</span>
                                    <span className="pick-meta">{s.submitter_username ?? 'Deleted user'}, {timeAgo(s.date_added)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {list.data && <Pagination total={list.data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />}
                </section>

                <section className="split-detail" aria-label="Submission details">
                    {selected && draft ? (
                        <SubmissionReview
                            key={selected.id}
                            submission={selected}
                            draft={draft}
                            onDraftChange={setDraft}
                            dirty={dirty}
                            onSaved={(updated) => { list.setData(list.data && { ...list.data, items: items.map((s) => (s.id === updated.id ? updated : s)) }); toast('Changes saved.'); }}
                            onAccepted={() => { toast(`"${draft.name.trim()}" accepted and published.`); removeFromQueue(selected.id); }}
                            onRejected={() => { toast(`"${selected.name}" rejected.`); removeFromQueue(selected.id); }}
                        />
                    ) : (
                        list.data && items.length > 0 && <EmptyState>Select a submission to review it.</EmptyState>
                    )}
                </section>
            </div>
        </>
    );
}

interface ReviewProps {
    submission: AdminProduct;
    draft: ProductDraft;
    onDraftChange: (draft: ProductDraft) => void;
    dirty: boolean;
    onSaved: (updated: AdminProduct) => void;
    onAccepted: () => void;
    onRejected: () => void;
}

function SubmissionReview({ submission, draft, onDraftChange, dirty, onSaved, onAccepted, onRejected }: ReviewProps) {
    const [busy, setBusy] = useState<'save' | 'accept' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rejecting, setRejecting] = useState(false);

    async function run(action: 'save' | 'accept') {
        const problem = validateDraft(draft);
        if (problem) { setError(problem); return; }

        setBusy(action);
        setError(null);
        try {
            const patch = draftToPatch(draft);
            if (action === 'accept') {
                await request(() => acceptSubmission(submission.id, patch));
                onAccepted();
            } else {
                onSaved(await request(() => updateSubmission(submission.id, patch)));
                setBusy(null);
            }
        } catch (err) {
            setError(errorMessage(err));
            setBusy(null);
        }
    }

    return (
        <div className="detail">
            <header className="detail-header">
                <h2>{submission.name}</h2>
                <p className="muted small">
                    Submitted by {submission.submitter_username
                        ? <>{submission.submitter_username} ({submission.submitter_email})</>
                        : 'a user who has since been deleted'} on {formatDateTime(submission.date_added)}
                </p>
            </header>

            <ProductForm draft={draft} onChange={(d) => { setError(null); onDraftChange(d); }} disabled={busy !== null} />

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="detail-actions">
                <button className="btn btn-danger-outline btn-push-left" onClick={() => setRejecting(true)} disabled={busy !== null}>Reject</button>
                <button className="btn" onClick={() => run('save')} disabled={busy !== null || !dirty}>{busy === 'save' ? 'Saving…' : 'Save changes'}</button>
                <button className="btn btn-primary" onClick={() => run('accept')} disabled={busy !== null}>
                    {busy === 'accept' ? 'Accepting…' : dirty ? 'Save and accept' : 'Accept'}
                </button>
            </div>
            <p className="hint">Accepting publishes this product to every SuppSense user.</p>

            {rejecting && (
                <ConfirmDialog
                    title={`Reject "${submission.name}"?`}
                    confirmLabel="Reject submission"
                    onClose={() => setRejecting(false)}
                    onConfirm={async () => {
                        await request(() => rejectSubmission(submission.id));
                        onRejected();
                    }}
                >
                    <p>The submission is discarded and removed from the submitter's libraries. This can't be undone.</p>
                </ConfirmDialog>
            )}
        </div>
    );
}
