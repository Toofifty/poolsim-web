export const constrain = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));
