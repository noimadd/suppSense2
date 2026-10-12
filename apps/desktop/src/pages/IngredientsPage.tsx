import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createAdminIngredient, deleteAdminIngredient, listAdminIngredients, updateAdminIngredient } from '@suppsense/api-client';
import type { AdminIngredient, AdminIngredientPatch } from '@suppsense/shared-types';
import { request } from '../lib/session';
import { useDebounced, useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, plural } from '../lib/format';
import { PageHeader } from '../components/Layout';
import { EmptyState, ErrorBanner, Loading, Pill, useToast } from '../components/Feedback';
import { ConfirmDialog, Modal } from '../components/Dialog';
import { PAGE_SIZE, Pagination } from '../components/Pagination';

type Filter = 'all' | 'review' | 'verified';

const FILTER_VALUE: Record<Filter, boolean | undefined> = { all: undefined, review: false, verified: true };

export default function IngredientsPage() {
    const toast = useToast();
    const [params, setParams] = useSearchParams();
    const selectedId = params.get('id');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [offset, setOffset] = useState(0);
    const debounced = useDebounced(search);
    const list = useLoad(
        () => listAdminIngredients({ search: debounced, verified: FILTER_VALUE[filter], limit: PAGE_SIZE, offset }),
        [debounced, filter, offset]
    );
    const [creating, setCreating] = useState(false);
    const [dirty, setDirty] = useState(false);

    const items = list.data?.items ?? [];
    const selected = items.find((i) => i.id === selectedId) ?? null;
    const select = (id: string | null) => setParams(id ? { id } : {}, { replace: true });

    useEffect(() => {
        if (list.data && !selected && items.length) { select(items[0].id); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [list.data]);

    function trySelect(id: string) {
        if (id === selectedId) { return; }
        if (dirty && !window.confirm(`Discard your changes to "${selected?.name}"?`)) { return; }
        setDirty(false);
        select(id);
    }

    function replaceItem(updated: AdminIngredient) {
        if (list.data) {
            list.setData({ ...list.data, items: items.map((i) => (i.id === updated.id ? updated : i)) });
        }
    }

    return (
        <>
            <PageHeader
                title="Ingredient Management"
                subtitle={list.data ? `${plural(list.data.total, 'ingredient')} found` : undefined}
                actions={<button className="btn btn-primary" onClick={() => setCreating(true)}>New ingredient</button>}
            />

            {list.error && <ErrorBanner message={list.error} onRetry={list.reload} />}

            <div className="split">
                <section className="split-list" aria-label="Ingredients">
                    <input
                        type="search"
                        className="search"
                        placeholder="Search ingredients"
                        aria-label="Search ingredients"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                    />
                    <div className="segmented" role="group" aria-label="Filter by status">
                        {(['all', 'review', 'verified'] as Filter[]).map((f) => (
                            <button key={f} className={filter === f ? 'is-active' : ''} aria-pressed={filter === f} onClick={() => { setFilter(f); setOffset(0); }}>
                                {f === 'all' ? 'All' : f === 'review' ? 'Needs review' : 'Verified'}
                            </button>
                        ))}
                    </div>

                    {list.loading && !list.data && <Loading />}
                    {list.data && items.length === 0 && <EmptyState>No ingredients match.</EmptyState>}
                    <ul className="pick-list">
                        {items.map((i) => (
                            <li key={i.id}>
                                <button className={`pick${i.id === selectedId ? ' is-selected' : ''}`} onClick={() => trySelect(i.id)} aria-current={i.id === selectedId}>
                                    <span className="pick-title">{i.name}</span>
                                    <span className="pick-meta">
                                        {i.verified ? 'Verified' : i.description ? 'Needs review' : 'No summary yet'}, {plural(i.product_count, 'product')}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {list.data && <Pagination total={list.data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />}
                </section>

                <section className="split-detail" aria-label="Ingredient details">
                    {selected ? (
                        <IngredientEditor
                            key={selected.id}
                            ingredient={selected}
                            onDirtyChange={setDirty}
                            onSaved={(updated) => { replaceItem(updated); setDirty(false); toast('Changes saved.'); }}
                            onDeleted={() => { toast(`"${selected.name}" deleted.`); setDirty(false); select(null); list.reload(); }}
                        />
                    ) : (
                        list.data && items.length > 0 && <EmptyState>Select an ingredient to review it.</EmptyState>
                    )}
                </section>
            </div>

            {creating && (
                <NewIngredientDialog
                    onClose={() => setCreating(false)}
                    onCreated={(created) => {
                        setCreating(false);
                        toast(`"${created.name}" created.`);
                        setSearch(created.name);
                        setFilter('all');
                        setOffset(0);
                        select(created.id);
                    }}
                />
            )}
        </>
    );
}

interface EditorProps {
    ingredient: AdminIngredient;
    onDirtyChange: (dirty: boolean) => void;
    onSaved: (updated: AdminIngredient) => void;
    onDeleted: () => void;
}

function formFrom(i: AdminIngredient) {
    return {
        name: i.name,
        description: i.description ?? '',
        recommended_dosage: i.recommended_dosage ?? '',
        maximum_dosage: i.maximum_dosage ?? '',
        paper_url: i.paper_url ?? '',
        image_url: i.image_url ?? '',
        verified: i.verified,
    };
}

function IngredientEditor({ ingredient, onDirtyChange, onSaved, onDeleted }: EditorProps) {
    const [form, setForm] = useState(() => formFrom(ingredient));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const original = formFrom(ingredient);
    const changed = (Object.keys(form) as (keyof typeof form)[]).filter((k) => form[k] !== original[k]);
    const dirty = changed.length > 0;

    useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) { setError('The ingredient needs a name.'); return; }
        const patch: AdminIngredientPatch = {};
        for (const key of changed) {
            (patch as Record<string, unknown>)[key] = typeof form[key] === 'string' ? (form[key] as string).trim() : form[key];
        }
        setBusy(true);
        setError(null);
        try {
            const updated = await request(() => updateAdminIngredient(ingredient.id, patch));
            setForm(formFrom(updated));
            onSaved(updated);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
        <form className="detail" onSubmit={save}>
            <header className="detail-header">
                <h2>{ingredient.name}</h2>
                <p className="detail-status">
                    {ingredient.verified
                        ? <Pill tone="good">Human verified</Pill>
                        : ingredient.description ? <Pill tone="warn">AI summary, not yet reviewed</Pill> : <Pill tone="neutral">No summary yet</Pill>}
                    <span className="muted small">Used in {plural(ingredient.product_count, 'product')}. Updated {formatDateTime(ingredient.date_updated)}.</span>
                </p>
            </header>

            <fieldset disabled={busy}>
                <div className="field">
                    <label htmlFor="ing-name">Name</label>
                    <input id="ing-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="field">
                    <label htmlFor="ing-desc">Summary</label>
                    <textarea id="ing-desc" rows={10} value={form.description} onChange={(e) => set('description', e.target.value)} />
                    <p className="hint">Shown to users on the ingredient screen. Check it against the source before marking it verified.</p>
                </div>
                <div className="field-grid">
                    <div className="field">
                        <label htmlFor="ing-rec">Recommended dose</label>
                        <input id="ing-rec" placeholder="e.g. 5g" value={form.recommended_dosage} onChange={(e) => set('recommended_dosage', e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="ing-max">Maximum dose</label>
                        <input id="ing-max" placeholder="e.g. 20g" value={form.maximum_dosage} onChange={(e) => set('maximum_dosage', e.target.value)} />
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="ing-paper">Source</label>
                    <div className="input-with-link">
                        <input id="ing-paper" type="url" placeholder="https://" value={form.paper_url} onChange={(e) => set('paper_url', e.target.value)} />
                        {/^https?:\/\//.test(form.paper_url) && <a href={form.paper_url} target="_blank" rel="noreferrer noopener">Open</a>}
                    </div>
                </div>
                <div className="field">
                    <label htmlFor="ing-img">Image URL</label>
                    <input id="ing-img" type="url" placeholder="https://" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
                </div>

                <label className="check check-verify">
                    <input type="checkbox" checked={form.verified} onChange={(e) => set('verified', e.target.checked)} />
                    Mark as human verified
                </label>
            </fieldset>

            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="detail-actions">
                <button type="button" className="btn btn-danger-outline btn-push-left" onClick={() => setDeleting(true)} disabled={busy}>Delete</button>
                <button type="button" className="btn" onClick={() => { setForm(formFrom(ingredient)); setError(null); }} disabled={busy || !dirty}>Discard changes</button>
                <button type="submit" className="btn btn-primary" disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</button>
            </div>
        </form>

            {deleting && (
                <ConfirmDialog
                    title={`Delete "${ingredient.name}"?`}
                    confirmLabel="Delete ingredient"
                    requirePassword
                    onClose={() => setDeleting(false)}
                    onConfirm={async (password) => {
                        await request(() => deleteAdminIngredient(ingredient.id, password));
                        onDeleted();
                    }}
                >
                    {ingredient.product_count > 0 ? (
                        <p>
                            <strong>{ingredient.name}</strong> is listed in {plural(ingredient.product_count, 'product')}. Deleting it removes it
                            from all of them, so users will no longer see it on those products.
                        </p>
                    ) : (
                        <p><strong>{ingredient.name}</strong> isn't used by any products.</p>
                    )}
                    <p>This can't be undone.</p>
                </ConfirmDialog>
            )}
        </>
    );
}

function NewIngredientDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (created: AdminIngredient) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function create(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) { return; }
        setBusy(true);
        setError(null);
        try {
            onCreated(await request(() => createAdminIngredient({ name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) })));
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    }

    return (
        <Modal
            title="New ingredient"
            onClose={busy ? () => {} : onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
                    <button type="submit" form="new-ingredient" className="btn btn-primary" disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create ingredient'}</button>
                </>
            }
        >
            <form id="new-ingredient" onSubmit={create}>
                <fieldset disabled={busy}>
                    <div className="field">
                        <label htmlFor="new-ing-name">Name</label>
                        <input id="new-ing-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="field">
                        <label htmlFor="new-ing-desc">Summary (optional)</label>
                        <textarea id="new-ing-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <p className="hint">You can add dosages and a source after creating it.</p>
                    {error && <p className="form-error" role="alert">{error}</p>}
                </fieldset>
            </form>
        </Modal>
    );
}
