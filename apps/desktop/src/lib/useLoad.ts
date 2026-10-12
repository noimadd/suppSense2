import { useCallback, useEffect, useState } from 'react';
import { request } from './session';
import { errorMessage } from './format';

export interface LoadState<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    /** fetch again with the same arguments */
    reload: () => void;
    /** replace the data locally, e.g. after an edit returns the updated row */
    setData: (data: T | null) => void;
}

/**
 * Loads data through request() whenever deps change. Ignores responses that arrive
 * after deps have changed again, so fast typing in a search box can't show stale results.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]): LoadState<T> {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        request(load)
            .then((result) => { if (!cancelled) { setData(result); } })
            .catch((err) => { if (!cancelled) { setError(errorMessage(err)); } })
            .finally(() => { if (!cancelled) { setLoading(false); } });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, reloadKey]);

    const reload = useCallback(() => setReloadKey((k) => k + 1), []);
    return { data, error, loading, reload, setData };
}

/**
 * Returns value once it has stopped changing for `delay` ms (for search boxes)
 */
export function useDebounced<T>(value: T, delay = 250): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}
