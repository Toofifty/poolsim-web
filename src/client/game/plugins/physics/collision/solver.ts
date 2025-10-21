export const solveLinearSystem = (A: number[][], b: number[]): number[] => {
  const n = A.length;
  const x = new Array(n).fill(0);
  const M = A.map((row, i) => [...row, b[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    const diag = M[i][i];
    if (Math.abs(diag) < 1e-8) continue;

    for (let k = i + 1; k <= n; k++) M[i][k] /= diag;

    for (let j = i + 1; j < n; j++) {
      const f = M[j][i];
      for (let k = i; k <= n; k++) M[j][k] -= f * M[i][k];
    }
  }

  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let k = i + 1; k < n; k++) sum += M[i][k] * x[k];
    x[i] = M[i][n] - sum;
  }

  return x;
};
