import { runSimulation } from '../run';
import type { SentMessage } from './types';

onmessage = ({ data: { fn, key, args } }: SentMessage) => {
  switch (fn) {
    case 'run':
      const result = runSimulation(args);
      postMessage({ fn, key, result });
      break;
  }
};
