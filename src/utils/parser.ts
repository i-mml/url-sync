import type { FlatQuery } from "./queryString";

export type UrlStateSeedScalar = string | number | boolean;
export type UrlStateSeedValue = UrlStateSeedScalar | readonly string[];

export type InferUrlState<T extends Record<string, UrlStateSeedValue>> = {
  [K in keyof T]: [T[K]] extends [readonly unknown[]]
    ? string[]
    : T[K] extends number
      ? number
      : T[K] extends boolean
        ? boolean
        : T[K] extends string
          ? string
          : never;
};

export function parseQueryValue(
  raw: string | undefined,
  seed: string
): string;
export function parseQueryValue(
  raw: string | undefined,
  seed: number
): number;
export function parseQueryValue(
  raw: string | undefined,
  seed: boolean
): boolean;
export function parseQueryValue(
  raw: string | undefined,
  seed: readonly string[]
): string[];
export function parseQueryValue(
  raw: string | undefined,
  seed: UrlStateSeedValue
): string | number | boolean | string[] {
  if (Array.isArray(seed)) {
    if (raw === undefined || raw === "") return [...seed];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof seed === "number") {
    if (raw === undefined || raw === "") return seed;
    const n = Number(raw);
    return Number.isFinite(n) ? n : seed;
  }

  if (typeof seed === "boolean") {
    if (raw === undefined || raw === "") return seed;
    const v = raw.toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return seed;
  }

  const strSeed = seed as string;
  if (raw === undefined) return strSeed;
  return raw;
}

export function serializeQueryValue(value: string | number | boolean | string[]): string {
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function mergeUrlStateFromFlatQuery<T extends Record<string, UrlStateSeedValue>>(
  initial: T,
  flat: FlatQuery
): InferUrlState<T> {
  const out = {} as InferUrlState<T>;
  for (const key of Object.keys(initial) as (keyof T)[]) {
    const seed = initial[key];
    const raw = flat[String(key)];
    if (Array.isArray(seed)) {
      out[key] = parseQueryValue(raw, seed) as InferUrlState<T>[keyof T];
    } else if (typeof seed === "number") {
      out[key] = parseQueryValue(raw, seed) as InferUrlState<T>[keyof T];
    } else if (typeof seed === "boolean") {
      out[key] = parseQueryValue(raw, seed) as InferUrlState<T>[keyof T];
    } else if (typeof seed === "string") {
      out[key] = parseQueryValue(raw, seed) as InferUrlState<T>[keyof T];
    }
  }
  return out;
}
