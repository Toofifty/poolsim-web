export const throttle = <R, A extends any[]>(
  fn: (...args: A) => R,
  delay: number
): ((...args: A) => R | undefined) => {
  let wait = false;
  let timeout: undefined | number;
  let cancelled = false;

  function resetWait() {
    wait = false;
  }

  return (...args: A) => {
    if (cancelled) return;
    if (wait) return;

    const val = fn(...args);
    wait = true;
    timeout = window.setTimeout(resetWait, delay);
    return val;
  };
};
