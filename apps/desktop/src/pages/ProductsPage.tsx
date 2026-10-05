import { useState } from 'react';
import { deleteAdminProduct, listAdminProducts, updateAdminProduct } from '@suppsense/api-client';
import type { AdminProduct } from '@suppsense/shared-types';
import { request } from '../lib/session';
import { useDebounced, useLoad } from '../lib/useLoad';
import { errorMessage, formatDateTime, plural, searchSuffix, timeAgo } from '../lib/format';
import { PageHeader } from '../components/Layout';
import { EmptyState, ErrorBanner, Loading, useToast } from '../components/Feedback';
import { ConfirmDialog, Modal } from '../components/Dialog';
import { PAGE_SIZE, Pagination } from '../components/Pagination';
import { ProductDraft, ProductForm, draftFromProduct, draftToPatch, isDraftChanged, validateDraft } from '../components/ProductForm';

export default function ProductsPage() {
    const toast = useToast();
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const debounced = useDebounced(search);
    const products = useLoad(() => listAdminProducts({ search: debounced, limit: PAGE_SIZE, offset }), [debounced, offset]);

    const [editing, setEditing] = useState<AdminProduct | null>(null);
    const [deleting, setDeleting] = useState<AdminProduct | null>(null);

    return (
        <>
            <PageHeader
                title="Supplement Management"
                subtitle={products.data ? `${plural(products.data.total, 'product')}${debounced ? searchSuffix(products.data.total, debounced) : ' in the public database'}` : undefined}
            />

            <div className="toolbar">
                <input
                    type="search"
                    className="search"
                    placeholder="Search by name, brand or barcode"
                    aria-label="Search products"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                />
            </div>

            {products.error && <ErrorBanner message={products.error} onRetry={products.reload} />}
            {products.loading && !products.data && <Loading />}

            {products.data && products.data.items.length === 0 && (
                <EmptyState>{debounced ? `No products match "${debounced}".` : 'No products yet. Accepted submissions will appear here.'}</EmptyState>
            )}

            {products.data && products.data.items.length > 0 && (
                <div className={`table-wrap${products.loading ? ' is-loading' : ''}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Brand</th>
                                <th>Barcode</th>
                                <th>Ingredients</th>
                                <th>Updated</th>
                                <th className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.items.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.brand ?? <span className="muted">None</span>}</td>
                                    <td className="numeric">{p.barcode}</td>
                                    <td>{p.ingredients.length}</td>
                                    <td title={formatDateTime(p.date_updated)}>{timeAgo(p.date_updated)}</td>
                                    <td className="actions-col">
                                        <button className="btn btn-link" onClick={() => setEditing(p)}>Edit</button>
                                        <button className="btn btn-link btn-link-danger" onClick={() => setDeleting(p)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {products.data && <Pagination total={products.data.total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />}

            {editing && (
                <EditProductDialog
                    product={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); toast('Product updated.'); products.reload(); }}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title={`Delete "${deleting.name}"?`}
                    confirmLabel="Delete product"
                    requirePassword
                    onClose={() => setDeleting(null)}
                    onConfirm={async (password) => {
                        await request(() => deleteAdminProduct(deleting.id, password));
                        toast('Product deleted.');
                        products.reload();
                    }}
                >
                    <p>
                        This permanently removes <strong>{deleting.name}</strong> (barcode {deleting.barcode}) from the public database
                        and from every user's libraries. Scanning its barcode will show "not found".
                    </p>
                    <p>This can't be undone.</p>
                </ConfirmDialog>
            )}
        </>
    );
}

function EditProductDialog({ product, onClose, onSaved }: { product: AdminProduct; onClose: () => void; onSaved: () => void }) {
    const [draft, setDraft] = useState<ProductDraft>(() => draftFromProduct(product));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dirty = isDraftChanged(draft, product);

    function close() {
        if (busy) { return; }
        if (dirty && !window.confirm('Discard your changes?')) { return; }
        onClose();
    }

    async function save() {
        const problem = validateDraft(draft);
        if (problem) { setError(problem); return; }
        setBusy(true);
        setError(null);
        try {
            await request(() => updateAdminProduct(product.id, draftToPatch(draft)));
            onSaved();
        } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
        }
    }

    return (
        <Modal
            title={`Edit ${product.name}`}
            wide
            onClose={close}
            footer={
                <>
                    <button className="btn" onClick={close} disabled={busy}>Cancel</button>
                    <button className="btn btn-primary" onClick={save} disabled={busy || !dirty}>{busy ? 'Saving…' : 'Save changes'}</button>
                </>
            }
        >
            <ProductForm draft={draft} onChange={(d) => { setError(null); setDraft(d); }} disabled={busy} />
            {error && <p className="form-error" role="alert">{error}</p>}
            <p className="muted small">
                Added {formatDateTime(product.date_added)}
                {product.submitter_username && <>, submitted by {product.submitter_username}</>}.
            </p>
        </Modal>
    );
}
