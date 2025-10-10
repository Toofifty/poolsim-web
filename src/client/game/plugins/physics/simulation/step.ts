import type { Physics } from '../../../components/physics';

export type SimulationStepParameters = {
  balls: Physics[];
};

export const simulationStep = (parameters: SimulationStepParameters) => {};
