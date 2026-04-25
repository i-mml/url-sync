# use-param-sync

[![npm](https://img.shields.io/npm/v/use-param-sync?style=flat-square)](https://www.npmjs.com/package/use-param-sync)
[![license](https://img.shields.io/npm/l/use-param-sync?style=flat-square)](https://www.npmjs.com/package/use-param-sync)
[![peer](https://img.shields.io/npm/dependency-version/use-param-sync/peer/react?style=flat-square)](https://react.dev/)

**Type-safe URL query state and latest-wins async for React 18+** — small surface area, no extra runtime beyond React, ESM + CJS, full TypeScript types.

---

## Why this exists

Most libraries optimize for **either** keeping UI state in the URL **or** making async effects safe when inputs change. This one does **both** with two hooks that compose naturally: drive fetches from URL-backed filters without race conditions or stale responses.

---

## Features

|                  |                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| **URL sync**     | React state ↔ query string (`pushState` / `replaceState`, no full reload)                                           |
| **Navigation**   | `popstate` (back/forward) updates state                                                                             |
| **Debouncing**   | Optional debounce on **history writes** only; UI state stays snappy                                                 |
| **Types**        | Inferred state from `initialState`; supports `string`, `number`, `boolean`, `string[]` (comma-separated in the URL) |
| **Async safety** | `AbortController` + ignore stale results; pass `AbortSignal` when your function accepts it                          |
| **Bundle**       | `sideEffects: false`, tree-shakable exports                                                                         |

---

## Installation

```bash
npm install use-param-sync
```

```bash
pnpm add use-param-sync
```

```bash
yarn add use-param-sync
```

**Peer dependency:** `react` >= 18.

---

## Quick start

### `useUrlState`

Keeps selected keys in sync with the query string. Arrays are serialized as comma-separated values (e.g. `tags=react,js`).

```ts
const [filters, setFilters] = useUrlState({
  search: "",
  page: 1,
  tags: [] as string[],
});

// Example URL:
// ?search=react&page=2&tags=react,js
```

```ts
useUrlState(initialState, {
  debounce: 300, // ms; debounces history updates, not React setState
  history: "replace", // "replace" | "push"
});
```

### `useLatestAsync`

Runs when `deps` change; aborts the previous run. If `fn.length >= 1`, an `AbortSignal` is passed (ideal for `fetch`).

```ts
const { data, error, loading, run } = useLatestAsync(
  (signal) =>
    fetch(`/api?q=${encodeURIComponent(filters.search)}`, { signal }).then(
      (r) => r.json(),
    ),
  [filters],
);
```

`run()` triggers a manual refetch with the same dependency semantics.

---

## Full example

```tsx
"use client";

import { useLatestAsync, useUrlState } from "use-param-sync";

export function UsersExplorer() {
  const [filters, setFilters] = useUrlState(
    { search: "", page: 1 },
    { debounce: 300, history: "replace" },
  );

  const { data, loading, error } = useLatestAsync(
    (signal) =>
      fetch(
        `/api/users?search=${encodeURIComponent(filters.search)}&page=${filters.page}`,
        { signal },
      ).then((res) => res.json()),
    [filters],
  );

  return (
    <>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
      />
      <button
        type="button"
        onClick={() => setFilters({ page: filters.page + 1 })}
      >
        Next page
      </button>
      {loading && <p>Loading…</p>}
      {error && <p>{error.message}</p>}
      {/* render data */}
    </>
  );
}
```

For a local reference implementation, see [`examples/demo-users.tsx`](examples/demo-users.tsx).

---

### `useLatestAsync` with Axios

```tsx
import axios from "axios";

const { data, error, loading } = useLatestAsync(
  (signal) =>
    axios
      .get("/api/users", {
        params: { search: filters.search, page: filters.page },
        signal,
      })
      .then((res) => res.data),
  [filters],
);
```

Axios (v1+) supports `AbortSignal`, so previous requests are canceled automatically when dependencies change.

## Next.js (App Router)

Use hooks in **Client Components** (`"use client"`). The library avoids touching `window` during SSR; hydration follows the usual pattern (initial render matches the server, then the client reads the URL).

---

## API

### `useUrlState(initialState, options?)`

|                        |                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Returns**            | `[state, setState]` — `setState` accepts a partial object or an updater `(prev) => partial \| next` |
| **`options.debounce`** | `number` (ms). Debounces `history` writes only.                                                     |
| **`options.history`**  | `"replace"` (default) or `"push"`                                                                   |

Merges with the current query string so multiple instances can own different keys on the same page.

### `useLatestAsync(fn, deps)`

|             |                                                                               |
| ----------- | ----------------------------------------------------------------------------- |
| **`fn`**    | `() => Promise<T>` or `(signal: AbortSignal) => Promise<T>`                   |
| **`deps`**  | Same idea as `useEffect` — when they change, the previous request is aborted. |
| **Returns** | `{ data, error, loading, run }`                                               |

---

## Exports

```ts
export { useUrlState, useLatestAsync };
export type { UseUrlStateOptions, UseLatestAsyncResult };
```

---

## License

MIT
