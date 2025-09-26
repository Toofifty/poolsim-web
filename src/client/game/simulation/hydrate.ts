import { PhysicsBall } from '../../../common/simulation/physics/ball';
import { PhysicsCushion } from '../../../common/simulation/physics/cushion';
import { PhysicsPocket } from '../../../common/simulation/physics/pocket';
import { Result } from '../../../common/simulation/result';
import { Shot } from '../../../common/simulation/shot';
import { type RunSimulationOptions } from '../../../common/simulation/simulation';
import { TableState } from '../../../common/simulation/table-state';
import { Profiler } from '../../../common/util/profiler';

export const hydrateTableState = (state: TableState) => {
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

export const hydrateRunBatchSimulationOptions = (
  batchParams: Omit<RunSimulationOptions, 'state'>[]
) => {
  return batchParams.map((params) => {
    Object.setPrototypeOf(params.shot, Shot.prototype);
    // todo
    params.profiler = Profiler.none;
    return params;
  });
};

export const hydrateResult = (result: Result) => {
  Object.setPrototypeOf(result, Result.prototype);
  if (result.state) hydrateTableState(result.state);

  return result;
};

export const hydrateResults = (results: Result[]) => {
  return results.map(hydrateResult);
};
