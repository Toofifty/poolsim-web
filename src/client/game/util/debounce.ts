export const debounce = <T extends (...args: any[]) => any>(
  callback: T,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    timeout && clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback(...args);
    }, waitFor);
  };
};
