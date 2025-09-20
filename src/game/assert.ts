export const assert = (cond: any, message?: string) => {
  if (!cond) {
    throw new Error(message);
  }
};

export const assertEqual = <T>(a: T, b: T, message?: string) =>
  assert(a === b, message);
