import { properties } from './physics/properties';
import type { Result } from './physics/result';
import { Shot } from './physics/shot';
import { Simulation, type ISimulation } from './simulation/simulation';
import type { TableState } from './simulation/table-state';
import { ThreadedSimulation } from './simulation/threaded-simulation';
import { gameStore } from './store/game';

export class AI {
  private precision = 20;
  private accuracy = 100;
  private prefTrickshot = 100;
  private prefMultishot = 100;

  private simulation: ISimulation = properties.useWorkerForAI
    ? new ThreadedSimulation()
    : new Simulation();

  public async findShot(
    state: TableState,
    sideSpin?: number,
    topSpin?: number,
    lift?: number
  ) {
    let angleSteps = this.precision * 6;
    const angleStep = (Math.PI * 2) / angleSteps;

    const minForce = properties.cueMaxForce / 10;
    const maxForce = properties.cueMaxForce;
    const forceStep = (maxForce - minForce) / 10;

    let bestScore = -Infinity;
    let bestResult: Result | undefined = undefined;
    let bestShot: Shot | undefined = undefined;

    let iterations = 0;
    let stepIterations = 0;
    let anglesChecked = 0;

    gameStore.analysisProgress = 0;
    console.time('ai-shot');

    const startAngle = -Math.PI / 2;
    let maxAngle = (Math.PI * 3) / 2;

    if (state.isBreak) {
      angleSteps /= 2;
      maxAngle = Math.PI / 2;
    }

    for (let angle = startAngle; angle < maxAngle; angle += angleStep) {
      anglesChecked++;
      gameStore.analysisProgress = (100 * anglesChecked) / angleSteps;
      for (let force = minForce; force < maxForce; force += forceStep) {
        const shot = new Shot(angle, force, sideSpin, topSpin, lift);
        const result = await this.simulation.run({
          shot,
          state,
        });
        const score = this.score(result);

        if (score > bestScore || !bestShot) {
          bestScore = score;
          bestResult = result;
          bestShot = shot;
        }

        iterations++;
        stepIterations += result.stepIterations;
      }
    }

    console.timeEnd('ai-shot');

    console.log({
      iterations,
      stepIterations,
      anglesChecked,
      bestScore,
      bestShot,
    });

    return bestShot;
  }

  private score(result: Result) {
    if (result.hasFoul()) {
      return -Infinity;
    }

    if (result.collisions.length > 200) {
      // found a physics bug :)
      return -Infinity;
    }

    if (result.state?.isGameOver) {
      return 1000 - result.collisions.length;
    }

    return result.ballsPotted * 100 - result.collisions.length;
  }
}
