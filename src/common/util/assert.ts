type Falsy = false | 0 | '' | null | undefined;

export function assert<T>(
  cond: T | Falsy,
  message?: string
): asserts cond is T {
  if (!cond) {
    throw new Error(message);
  }
}

export function assertExists<T>(
  cond: T | Falsy,
  message?: string
): asserts cond is T {
  if (cond == null) {
    throw new Error(message);
  }
}

export const assertEqual = <T>(a: T, b: T, message?: string) =>
  assert(a === b, message ?? `Expected ${a} to equal ${b}`);
