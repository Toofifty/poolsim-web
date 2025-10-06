export type Node =
  | { type: 'symbol'; name: string }
  | { type: 'number'; value: number }
  | { type: 'unary'; op: string; arg: Node }
  | { type: 'literal'; components: [Node, Node, Node] }
  | { type: 'binary'; op: string; left: Node; right: Node };

export const tokenize = (expr: string) => {
  const tokens: string[] = [];
  const re = /\s*([A-Za-z_]\w*|\d*\.?\d+|[()+\-*/x.~|,\[\]])\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr))) tokens.push(m[1]);
  return tokens;
};

export const parse = (tokens: string[], minPrec = 0): Node => {
  let node = parsePrimary(tokens);

  while (tokens.length) {
    const op = tokens[0];
    const prec = getPrecedence(op);
    if (prec < minPrec || op === ')' || op === '|') {
      break;
    }

    tokens.shift(); // consume op
    const rhs = parse(tokens, prec + 1);
    node = { type: 'binary', op, left: node, right: rhs };
  }

  return node;
};

const parsePrimary = (tokens: string[]): Node => {
  const t = tokens.shift();
  if (!t) throw new Error('Unexpected end of expression');

  if (t === '(') {
    const node = parse(tokens);
    if (tokens.shift() !== ')') throw new Error('Missing )');
    return node;
  }

  if (t === '[') {
    const x = parsePrimary(tokens);
    if (tokens.shift() !== ',') throw new Error('Expected , after x component');
    const y = parsePrimary(tokens);
    if (tokens.shift() !== ',') throw new Error('Expected , after y component');
    const z = parsePrimary(tokens);
    if (tokens.shift() !== ']') throw new Error('Expected closing ]');
    return { type: 'literal', components: [x, y, z] };
  }

  if (t === '~') {
    const node = parsePrimary(tokens);
    return { type: 'unary', op: '~', arg: node };
  }

  if (t === '-') {
    const node = parsePrimary(tokens);
    return { type: 'unary', op: '-', arg: node };
  }

  if (t === '|') {
    const node = parse(tokens);
    if (tokens.shift() !== '|') throw new Error('Missing |');
    return { type: 'unary', op: '|', arg: node };
  }

  if (/^\d/.test(t)) return { type: 'number', value: parseFloat(t) };
  if (/^\w/.test(t)) return { type: 'symbol', name: t };
  throw new Error(`Unexpected symbol ${t}`);
};

const getPrecedence = (op: string): number => {
  switch (op) {
    case '.':
    case 'x':
      return 3;
    case '*':
    case '/':
      return 2;
    case '+':
    case '-':
      return 1;
    default:
      return 0;
  }
};
