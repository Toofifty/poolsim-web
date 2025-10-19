import { Profiler } from '@common/util/profiler';
import { runSimulation } from '../run';
import type { SentMessage } from './types';

const ENABLE_PROFILER = false;
const CONSOLE_TIME = false;

onmessage = ({ data: { fn, key, args } }: SentMessage) => {
  switch (fn) {
    case 'run':
      CONSOLE_TIME && console.time('worker-run');
      const profiler = ENABLE_PROFILER ? new Profiler() : Profiler.none;
      const end = profiler.start('run');
      const result = runSimulation({ ...args, profiler });
      end();
      profiler.dump();
      postMessage({ fn, key, result });
      CONSOLE_TIME && console.timeEnd('worker-run');
      break;
  }
};
