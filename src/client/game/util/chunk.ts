export const chunk = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0) throw new Error('n must be greater than 0');
  const result: T[][] = [];
  const size = Math.ceil(arr.length / n);

  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }

  while (result.length < n) {
    result.push([]);
  }

  return result;
};
