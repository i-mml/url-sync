import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type DebouncedFn, debounceOrImmediate } from "../utils/debounce";
import {
  type InferUrlState,
  type UrlStateSeedValue,
  mergeUrlStateFromFlatQuery,
  serializeQueryValue,
} from "../utils/parser";
import { parseQuery, stringifyQuery, type FlatQuery } from "../utils/queryString";

export type UseUrlStateOptions = {
  /** Debounces `history` writes only; React state updates stay immediate. */
  debounce?: number;
  history?: "push" | "replace";
};

function shallowEqualRecords<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const keys = Object.keys(a) as (keyof T)[];
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (Array.isArray(av) || Array.isArray(bv)) {
      if (!Array.isArray(av) || !Array.isArray(bv) || av.length !== bv.length) return false;
      for (let i = 0; i < av.length; i++) if (av[i] !== bv[i]) return false;
      continue;
    }
    if (av !== bv) return false;
  }
  return true;
}

function stateToFlatQuery<T extends Record<string, UrlStateSeedValue>>(
  state: InferUrlState<T>
): FlatQuery {
  const flat: FlatQuery = {};
  for (const key of Object.keys(state) as (keyof InferUrlState<T>)[]) {
    const v = state[key];
    flat[String(key)] = serializeQueryValue(v as string | number | boolean | string[]);
  }
  return flat;
}

export function useUrlState<const T extends Record<string, UrlStateSeedValue>>(
  initialState: T,
  options?: UseUrlStateOptions
): readonly [
  InferUrlState<T>,
  (
    update:
      | Partial<InferUrlState<T>>
      | ((prev: InferUrlState<T>) => Partial<InferUrlState<T>> | InferUrlState<T>)
  ) => void
] {
  const historyMode = options?.history ?? "replace";
  const debounceMs = options?.debounce ?? 0;

  const initialRef = useRef(initialState);
  initialRef.current = initialState;

  const [state, setState] = useState<InferUrlState<T>>(() =>
    mergeUrlStateFromFlatQuery(initialRef.current, {})
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const [hydrated, setHydrated] = useState(false);
  const skipNextHistorySyncRef = useRef(false);
  const scheduleRef = useRef<DebouncedFn | undefined>(undefined);

  const commitQueryString = useCallback(
    (queryString: string) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.search = queryString ? `?${queryString}` : "";
      const href = `${url.pathname}${url.search}${url.hash}`;
      if (historyMode === "push") window.history.pushState(window.history.state, "", href);
      else window.history.replaceState(window.history.state, "", href);
    },
    [historyMode]
  );

  const writeHistoryFromState = useCallback(
    (next: InferUrlState<T>) => {
      if (typeof window === "undefined") return;
      const merged: FlatQuery = { ...parseQuery(window.location.search), ...stateToFlatQuery<T>(next) };
      commitQueryString(stringifyQuery(merged));
    },
    [commitQueryString]
  );

  const scheduleHistorySync = useMemo(
    () => debounceOrImmediate(() => writeHistoryFromState(stateRef.current), debounceMs),
    [debounceMs, writeHistoryFromState]
  );

  scheduleRef.current = scheduleHistorySync;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStateFromLocation = () => {
      const next = mergeUrlStateFromFlatQuery(initialRef.current, parseQuery(window.location.search));
      setState((prev) => {
        if (shallowEqualRecords(prev, next)) return prev;
        skipNextHistorySyncRef.current = true;
        return next;
      });
    };

    syncStateFromLocation();
    setHydrated(true);

    const onPopState = () => {
      scheduleRef.current?.cancel();
      syncStateFromLocation();
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;

    if (skipNextHistorySyncRef.current) {
      skipNextHistorySyncRef.current = false;
      return;
    }

    scheduleRef.current?.();
    return () => scheduleRef.current?.cancel();
  }, [state, hydrated]);

  const setUrlState = useCallback(
    (
      update:
        | Partial<InferUrlState<T>>
        | ((prev: InferUrlState<T>) => Partial<InferUrlState<T>> | InferUrlState<T>)
    ) => {
      setState((prev) => {
        const patch = typeof update === "function" ? update(prev) : update;
        const next = { ...prev, ...patch } as InferUrlState<T>;
        return shallowEqualRecords(prev, next) ? prev : next;
      });
    },
    []
  );

  return [state, setUrlState] as const;
}
