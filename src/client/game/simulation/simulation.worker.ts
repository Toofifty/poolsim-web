import { defaultParams } from '../../../common/simulation/physics';
import { Simulation } from '../../../common/simulation/simulation';
import {
  hydrateRunBatchSimulationOptions,
  hydrateRunSimulationOptions,
  hydrateTableState,
} from './hydrate';
import type { SentMessage } from './shared';

// todo: accept new params for worker
const simulation = new Simulation(defaultParams);

onmessage = ({ data: { fn, key, args } }: SentMessage) => {
  switch (fn) {
    case 'run':
      simulation.run(hydrateRunSimulationOptions(args)).then((result) => {
        postMessage({ fn, key, result });
      });
      break;
    case 'runBatch':
      simulation
        .runBatch(
          hydrateRunBatchSimulationOptions(args.args),
          hydrateTableState(args.state)
        )
        .then((result) => {
          postMessage({ fn, key, result });
        });
      break;
  }
};
