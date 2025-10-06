import { assert, assertEqual } from '../../util';
import type { Vec } from '../vec';
import { emit } from './emitter';
import { parse, tokenize } from './parser';

type NumberOrVec<T extends string> = T extends Uppercase<T> ? Vec : number;
type ComputeParameters<T extends readonly string[]> = T extends readonly [
  infer U,
  ...infer R
]
  ? U extends string
    ? [NumberOrVec<U>, ...(R extends string[] ? ComputeParameters<R> : never)]
    : never
  : [];

export const compile = <
  T extends readonly string[],
  TReturn extends number | Vec
>(
  expr: string,
  args: T,
  returnType: TReturn
): ((...args: ComputeParameters<T>) => TReturn) => {
  const ast = parse(tokenize(expr));
  const exprs = emit(ast);

  if (exprs.length === 1) {
    assertEqual(typeof returnType, 'number', 'Return type was not a number');
    return new Function(...args, `return ${exprs[0]};`) as any;
  }

  assert(Array.isArray(returnType), 'Return type was not a vector');
  const fn = new Function(
    ...args,
    `return [${exprs[0]}, ${exprs[1]}, ${exprs[2]}];`
  );

  return fn as any;
};
