import { hydrateRunSimulationOptions } from './hydrate';
import type { SentMessage, SimulationWorkerFn } from './shared';
import { Simulation } from './simulation';

const simulation = new Simulation();

onmessage = ({
  data: { fn, key, params },
}: SentMessage<SimulationWorkerFn>) => {
  switch (fn) {
    case 'run':
      simulation.run(hydrateRunSimulationOptions(params)).then((result) => {
        postMessage({ fn, key, result });
      });
      break;
  }
};
