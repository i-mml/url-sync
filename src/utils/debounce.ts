export type DebouncedFn = {
  (): void;
  cancel: () => void;
  flush: () => void;
};

export function debounce(fn: () => void, waitMs: number): DebouncedFn {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  const run = () => {
    cancel();
    fn();
  };

  const debounced: DebouncedFn = () => {
    cancel();
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, waitMs);
  };

  debounced.cancel = cancel;
  debounced.flush = run;

  return debounced;
}

/** Debounced history flush, or immediate when `waitMs` is 0. */
export function debounceOrImmediate(fn: () => void, waitMs: number): DebouncedFn {
  if (waitMs > 0) return debounce(fn, waitMs);

  const immediate: DebouncedFn = () => fn();
  immediate.cancel = () => {};
  immediate.flush = () => fn();
  return immediate;
}
