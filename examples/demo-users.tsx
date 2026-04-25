"use client";

import { useLatestAsync, useUrlState } from "../src/index";

/**
 * Demo wiring from the library brief: URL filters + latest-wins fetch.
 * Drop into a Next.js App Router page (or any React app) behind `"use client"`.
 */
export function DemoUsersFromUrl() {
  const [filters, setFilters] = useUrlState(
    {
      search: "",
      page: 1,
    },
    { debounce: 300, history: "replace" }
  );

  const { data, loading, error } = useLatestAsync(
    (signal) =>
      fetch(`/api/users?search=${encodeURIComponent(filters.search)}&page=${filters.page}`, {
        signal,
      }).then((res) => res.json()),
    [filters]
  );

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search"
      />
      <button type="button" onClick={() => setFilters({ page: filters.page + 1 })}>
        Next page
      </button>
      {loading ? <p>Loading…</p> : null}
      {error ? <p>{error.message}</p> : null}
      <pre>{JSON.stringify({ filters, data }, null, 2)}</pre>
    </div>
  );
}
