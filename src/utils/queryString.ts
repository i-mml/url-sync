export type FlatQuery = Record<string, string | undefined>;

export function parseQuery(input: string): FlatQuery {
  const qs = input.trim().replace(/^\?/, "");
  if (!qs) return {};

  const params = new URLSearchParams(qs);
  const out: FlatQuery = {};

  // `forEach` avoids needing `lib: ["DOM.Iterable"]` for `.entries()`.
  params.forEach((value, key) => {
    out[key] = value;
  });

  return out;
}

export function stringifyQuery(values: FlatQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) params.set(key, value);
  }
  return params.toString();
}
