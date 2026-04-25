import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
} from "react";

export type UseLatestAsyncResult<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** Re-runs with a fresh `AbortSignal` (same `deps` semantics as the effect). */
  run: () => void;
};

type AsyncFn0<T> = () => Promise<T>;
type AsyncFn1<T> = (signal: AbortSignal) => Promise<T>;

function invoke<T>(fn: AsyncFn0<T> | AsyncFn1<T>, signal: AbortSignal): Promise<T> {
  return fn.length >= 1 ? (fn as AsyncFn1<T>)(signal) : (fn as AsyncFn0<T>)();
}

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e));
}

export function useLatestAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList
): UseLatestAsyncResult<T>;
export function useLatestAsync<T>(
  fn: () => Promise<T>,
  deps: DependencyList
): UseLatestAsyncResult<T>;
export function useLatestAsync<T>(
  fn: AsyncFn0<T> | AsyncFn1<T>,
  deps: DependencyList
): UseLatestAsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [runTick, setRunTick] = useState(0);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback(() => setRunTick((n) => n + 1), []);

  useEffect(() => {
    const ac = new AbortController();
    let stale = false;

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const value = await invoke(fnRef.current, ac.signal);
        if (stale) return;
        setData(value);
      } catch (e) {
        if (stale) return;
        setError(toError(e));
      } finally {
        if (!stale) setLoading(false);
      }
    })();

    return () => {
      stale = true;
      ac.abort();
    };
  }, [
    runTick,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the public API surface
    ...deps,
  ]);

  return { data, error, loading, run };
}
