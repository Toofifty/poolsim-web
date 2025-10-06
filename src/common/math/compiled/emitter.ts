import { assert } from '../../util';
import type { Node } from './parser';

const expandVector = (expr: string): [string, string, string] => [
  `${expr}[0]`,
  `${expr}[1]`,
  `${expr}[2]`,
];

export const emit = (node: Node): [string] | [string, string, string] => {
  if (node.type === 'number') return [`${node.value}`];
  if (node.type === 'symbol') {
    const isVec = node.name === node.name.toUpperCase();
    return isVec ? expandVector(node.name) : [node.name];
  }

  if (node.type === 'unary') {
    const inner = emit(node.arg);

    if (node.op === '|') {
      assert(inner.length === 3, 'Expected vector for magnitude op');
      return [
        `Math.sqrt(${inner[0]} ** 2 + ${inner[1]} ** 2 + ${inner[2]} ** 2)`,
      ];
    }

    if (node.op === '~') {
      assert(inner.length === 3, 'Expected vector for unit op');
      const len = `Math.sqrt(${inner[0]} ** 2 + ${inner[1]} ** 2 + ${inner[2]} ** 2)`;
      return [
        `(${len} > 1e-8 ? ${inner[0]} / ${len} : 0)`,
        `(${len} > 1e-8 ? ${inner[1]} / ${len} : 0)`,
        `(${len} > 1e-8 ? ${inner[2]} / ${len} : 0)`,
      ];
    }

    if (node.op === '-') {
      if (inner.length === 1) {
        return [`(-${inner[0]})`];
      } else {
        assert(inner.length === 3, 'Expected vector for negative vector op');
        return [`(-${inner[0]})`, `(-${inner[1]})`, `(-${inner[2]})`];
      }
    }

    throw new Error(`Unexpected unary operator ${node.op}`);
  }

  if (node.type === 'literal') {
    return node.components.map((c) => `${emit(c)[0]}`) as [
      string,
      string,
      string
    ];
  }

  const { op, left, right } = node;

  const L = emit(left);
  const R = emit(right);

  if (op === '.') {
    // Dot product -> scalar
    const expr = `(${L[0]}*${R[0]} + ${L[1]}*${R[1]} + ${L[2]}*${R[2]})`;
    return [expr];
  }

  // Cross product -> vector (per component)
  if (op === 'x') {
    return [
      `(${L[1]}*${R[2]} - ${L[2]}*${R[1]})`,
      `(${L[2]}*${R[0]} - ${L[0]}*${R[2]})`,
      `(${L[0]}*${R[1]} - ${L[1]}*${R[0]})`,
    ];
  }

  const isVec = L.length === 3 || R.length === 3;

  if (isVec) {
    const l = L.length === 3 ? L : [`${L[0]}`, `${L[0]}`, `${L[0]}`];
    const r = R.length === 3 ? R : [`${R[0]}`, `${R[0]}`, `${R[0]}`];
    return [
      `(${l[0]} ${op} ${r[0]})`,
      `(${l[1]} ${op} ${r[1]})`,
      `(${l[2]} ${op} ${r[2]})`,
    ];
  }

  return [`(${L[0]} ${op} ${R[0]})`];
};
