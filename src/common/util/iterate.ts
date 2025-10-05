export function* iteratePairs<T>(arr: T[]) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    for (let j = i + 1; j < len; j++) {
      yield [arr[i], arr[j]] as [T, T];
    }
  }
}

export function pairs<T>(arr: T[]) {
  const pairs: [T, T][] = [];
  for (let pair of iteratePairs(arr)) {
    pairs.push(pair);
  }
  return pairs;
}

export function* iterate<T1, T2>(arr1: T1[], arr2: T2[]) {
  const len1 = arr1.length;
  const len2 = arr2.length;
  for (let i = 0; i < len1; i++) {
    for (let j = 0; j < len2; j++) {
      yield [arr1[i], arr2[j]] as [T1, T2];
    }
  }
}

export function iteration<T1, T2>(arr1: T1[], arr2: T2[]) {
  const pairs: [T1, T2][] = [];
  for (let pair of iterate(arr1, arr2)) {
    pairs.push(pair);
  }
  return pairs;
}
