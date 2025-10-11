export const warn = (cond: any, message?: string) => {
  if (cond) {
    console.warn(message ?? `Condition failed: ${cond}`);
  }
};
