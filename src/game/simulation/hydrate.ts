import { PhysicsBall } from '../physics/ball';
import { PhysicsCushion } from '../physics/cushion';
import { PhysicsPocket } from '../physics/pocket';
import { Result } from '../physics/result';
import { Shot } from '../physics/shot';
import { Profiler } from '../profiler';
import { type RunSimulationOptions } from './simulation';
import { TableState } from './table-state';

const hydrateTableState = (state: TableState) => {
  Object.setPrototypeOf(state, TableState.prototype);

  state.balls.forEach((ball) => {
    Object.setPrototypeOf(ball, PhysicsBall.prototype);
  });
  state.cushions.forEach((cushion) => {
    Object.setPrototypeOf(cushion, PhysicsCushion.prototype);
  });
  state.pockets.forEach((pocket) => {
    Object.setPrototypeOf(pocket, PhysicsPocket.prototype);
  });
  return state;
};

export const hydrateRunSimulationOptions = (params: RunSimulationOptions) => {
  hydrateTableState(params.state);
  Object.setPrototypeOf(params.shot, Shot.prototype);
  // todo
  params.profiler = Profiler.none;

  return params;
};

export const hydrateResult = (result: Result) => {
  Object.setPrototypeOf(result, Result.prototype);
  if (result.state) hydrateTableState(result.state);

  return result;
};
