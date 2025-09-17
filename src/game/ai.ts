import { properties } from './physics/properties';
import { Shot } from './physics/shot';
import { Simulation, type Result } from './simulation/simulation';
import type { TableState } from './simulation/table-state';
import { ThreadedSimulation } from './simulation/threaded-simulation';

export class AI {
  private precision = 1;
  private accuracy = 100;
  private prefTrickshot = 100;
  private prefMultishot = 100;

  private latestShot?: Shot;

  private simulation: Simulation = new Simulation();
  private threadedSimulation: ThreadedSimulation;

  constructor() {
    this.threadedSimulation = new ThreadedSimulation();
  }

  public findShot(state: TableState) {
    const angleSteps = this.precision * 6;
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

    console.log(
      'starting ai shot',
      angleSteps * (maxForce / forceStep),
      'expected iterations'
    );
    console.time('ai-shot');

    for (
      let angle = -Math.PI / 2;
      angle < (Math.PI * 3) / 2;
      angle += angleStep
    ) {
      anglesChecked++;
      for (let force = minForce; force < maxForce; force += forceStep) {
        const shot = new Shot(angle, force);
        const result = this.simulation.run({
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
    this.latestShot = bestShot;

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

    return result.ballsPotted;
  }
}
