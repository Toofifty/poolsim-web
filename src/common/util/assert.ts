export function assert(cond: unknown, message?: string): asserts cond is true {
  if (!cond) {
    throw new Error(message);
  }
}

export const assertEqual = <T>(a: T, b: T, message?: string) =>
  assert(a === b, message);
