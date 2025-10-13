import { quat, vec, type Vec } from '../../common/math';
import { params, type Params } from '../../common/simulation/physics';
import type { BallProto } from './objects/ball';
import { makeTheme } from './store/theme';

const gap = 0.001;

const getGap = () => Math.random() * gap;

export type Sandboxes = 'debug' | 'cubicle-troll' | 'newtons-cradle';

export class Rack {
  private static generateFromLayout(tip: Vec, layout: number[][]) {
    const theme = makeTheme();

    const balls: BallProto[] = [];
    const step = params.ball.radius * 2 + gap;
    const rowOffset = (step * Math.sqrt(3)) / 2;

    // cue ball
    balls.push({
      id: 0,
      number: 0,
      color: theme.balls.colors[0],
      position: vec.new(-tip[0], tip[1]),
      orientation: quat.random(),
    });

    for (let row = 0; row < layout.length; row++) {
      const ballsInRow = layout[row].length;
      const yStart = tip[1] - ((ballsInRow - 1) * step) / 2;

      for (let col = 0; col < ballsInRow; col++) {
        const x = tip[0] + row * rowOffset;
        const y = yStart + col * step;
        const number = layout[row][col];

        balls.push({
          id: number,
          number,
          color: theme.balls.colors[number],
          position: vec.new(x + getGap(), y + getGap()),
          orientation: quat.random(),
        });
      }
    }

    return balls;
  }

  static generate8Ball(tip: Vec) {
    return this.generateFromLayout(tip, [
      [1],
      [2, 3],
      [4, 8, 5],
      [6, 7, 9, 10],
      [11, 12, 13, 14, 15],
    ]);
  }

  static generate9Ball(tip: Vec) {
    return this.generateFromLayout(tip, [[1], [2, 3], [4, 9, 5], [6, 7], [8]]);
  }

  static generateDebugGame(tip: Vec) {
    return this.generateFromLayout(tip, [[9]]);
  }

  static getTip(params: Params) {
    return vec.new(params.table.length / 4, 0);
  }

  // sandboxes

  static generateCubicleTroll(params: Params) {
    const theme = makeTheme();

    const edgeGap = params.cushion.width + params.ball.radius * 1.5;

    // diamond-relative
    const positions: [number, number][] = [
      [1.5, 0.5],
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 4],
      [0, 3],
      [1, 3],
      [1, 2],
      [0, 2],
      [8, 3],
      [2, 2],
      [8, 1],
      [2, 4],
      [8, 2],
      [2, 0],
      [4, 2],
    ];

    return positions.map(([x, y], i) => {
      x -= 4;
      x *= params.table.length / 8;
      y -= 2;
      y *= -params.table.width / 4;

      if (x === -params.table.length / 2) x += edgeGap;
      if (x === params.table.length / 2) x -= edgeGap;
      if (y === -params.table.width / 2) y += edgeGap;
      if (y === params.table.width / 2) y -= edgeGap;

      return {
        id: i,
        number: i,
        color: theme.balls.colors[i],
        position: vec.new(x, y),
        orientation: quat.random(),
      };
    });
  }

  static generateNewtonsCradle(params: Params) {
    const theme = makeTheme();

    return [
      {
        id: 0,
        number: 0,
        color: theme.balls.colors[0],
        position: vec.new(-params.table.length / 4, 0),
        orientation: quat.new(),
      },
      ...new Array(5).fill(0).map((_, i) => ({
        id: i + 1,
        number: i + 1,
        color: theme.balls.colors[i + 1],
        position: vec.new(
          params.table.length / 6 + params.ball.radius * 2 * i,
          0
        ),
        orientation: quat.new(),
      })),
    ];
  }

  static generateSandboxGame(params: Params, type: Sandboxes) {
    switch (type) {
      case 'debug':
        return this.generateDebugGame(this.getTip(params));
      case 'cubicle-troll':
        return this.generateCubicleTroll(params);
      case 'newtons-cradle':
        return this.generateNewtonsCradle(params);
    }
  }
}
