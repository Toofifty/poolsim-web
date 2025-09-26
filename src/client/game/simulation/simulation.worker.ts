import {
  hydrateRunBatchSimulationOptions,
  hydrateRunSimulationOptions,
  hydrateTableState,
} from './hydrate';
import type { SentMessage } from './shared';
import { Simulation } from '../../../common/simulation/simulation';

const simulation = new Simulation();

onmessage = ({ data: { fn, key, params } }: SentMessage) => {
  switch (fn) {
    case 'run':
      simulation.run(hydrateRunSimulationOptions(params)).then((result) => {
        postMessage({ fn, key, result });
      });
      break;
    case 'runBatch':
      simulation
        .runBatch(
          hydrateRunBatchSimulationOptions(params.params),
          hydrateTableState(params.state)
        )
        .then((result) => {
          postMessage({ fn, key, result });
        });
      break;
  }
};
