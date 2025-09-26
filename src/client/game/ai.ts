import { assert } from '../../common/util/assert';
import { Game } from './game';
import { properties } from '../../common/simulation/physics/properties';
import type { Result } from './physics/result';
import { Shot } from '../../common/simulation/shot';
import {
  Simulation,
  type ISimulation,
} from '../../common/simulation/simulation';
import type { TableState } from '../../common/simulation/table-state';
import { ThreadedSimulation } from './simulation/threaded-simulation';
import { gameStore } from './store/game';
import { chunk } from './util/chunk';

const createSimulationPool = () =>
  new Array(navigator.hardwareConcurrency)
    .fill(0)
    .map(() => new ThreadedSimulation());

export class AI {
  private angleSteps = 120;
  private forceSteps = 10;
  // todo: only vary lift, sideSpin, topSpin if other shots fail
  private liftSteps = 7;
  /** must be odd */
  private sideSpinSteps = 1;
  private accuracy = 100;
  private prefTrickshot = 100;
  private prefMultishot = 100;

  private simulation: ISimulation = new Simulation();
  private simulationPool: ISimulation[] = properties.useWorkerForAI
    ? createSimulationPool()
    : [];

  private generateShots(state: TableState, topSpin?: number) {
    const shots: Shot[] = [];

    let angleSteps = this.angleSteps;
    const angleStep = (Math.PI * 2) / angleSteps;
    const minAngle = -Math.PI / 2;
    let maxAngle = (Math.PI * 3) / 2;

    if (state.isBreak) {
      angleSteps /= 2;
      maxAngle = Math.PI / 2;
    }

    const minForce = properties.cueMaxForce / this.forceSteps;
    const maxForce = properties.cueMaxForce;
    const forceStep = (maxForce - minForce) / this.forceSteps;

    const minLift = 0;
    const maxLift = Math.PI / 2;
    const liftStep = maxLift / this.liftSteps;

    let minSideSpin = 0;
    const maxSideSpin = 1;
    const sideSpinStep = 2 / this.sideSpinSteps;
    if (this.sideSpinSteps > 1) {
      minSideSpin = -1;
    }

    for (let angle = minAngle; angle < maxAngle; angle += angleStep) {
      for (let force = minForce; force < maxForce; force += forceStep) {
        for (let lift = minLift; lift < maxLift; lift += liftStep) {
          for (
            let sideSpin = minSideSpin;
            sideSpin < maxSideSpin;
            sideSpin += sideSpinStep
          ) {
            shots.push(new Shot(angle, force, sideSpin, topSpin, lift));
          }
        }
      }
    }

    return shots;
  }

  private async runSearch(shots: Shot[], state: TableState) {
    const results: Result[] = [];
    const shotsLength = shots.length;
    for (let i = 0; i < shotsLength; i++) {
      const shot = shots[i];
      gameStore.analysisProgress = (100 * i) / shotsLength;
      results.push(
        await this.simulation.run({ shot, state, trackPath: false })
      );
    }

    return results;
  }

  private async runPooledSearch(shots: Shot[], state: TableState) {
    const batchPromises: Promise<Result[]>[] = [];
    const chunks = chunk(shots, this.simulationPool.length);
    assert(
      chunks.length === this.simulationPool.length,
      `invalid chunk length ${chunks.length}, expected ${this.simulationPool.length}`
    );

    for (let i = 0; i < this.simulationPool.length; i++) {
      const simulation = this.simulationPool[i];
      const chunk = chunks[i];

      batchPromises.push(
        simulation
          .runBatch(
            chunk.map((shot) => ({ shot, trackPath: false })),
            state
          )
          .then((results) => {
            gameStore.analysisProgress += (100 * results.length) / shots.length;
            return results;
          })
      );
    }

    return (await Promise.all(batchPromises)).flat();
  }

  public async findShot(state: TableState, topSpin?: number) {
    let bestScore = -Infinity;
    let bestResult: Result | undefined = undefined;
    let bestShot: Shot | undefined = undefined;

    let iterations = 0;
    let stepIterations = 0;

    gameStore.analysisProgress = 0;

    const endProfile = Game.profiler.start('ai-shot');
    const startTime = performance.now();

    const shots = this.generateShots(state, topSpin);

    const results = properties.useWorkerForAI
      ? await this.runPooledSearch(shots, state)
      : await this.runSearch(shots, state);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const score = this.score(result);

      if (score > bestScore || !bestShot) {
        bestScore = score;
        bestResult = result;
        bestShot = shots[i];
      }

      iterations++;
      stepIterations += result.stepIterations;
    }

    endProfile();

    console.log({
      time: performance.now() - startTime,
      iterations,
      stepIterations,
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
