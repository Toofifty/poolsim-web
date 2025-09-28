import { quat, vec } from '../../common/math';
import { properties } from '../../common/simulation/physics/properties';
import type { BallProto } from './objects/ball';
import { makeTheme } from './store/theme';

const gap = properties.ballRadius / 8;
const tipX = properties.tableLength / 4;
const tipY = 0;

const randomGap = () => ((Math.random() * 2 - 1) * gap) / 2;

export class Rack {
  private static generateFromLayout(layout: number[][]) {
    const theme = makeTheme();

    const balls: BallProto[] = [];
    const step = properties.ballRadius * 2 + gap;
    const rowOffset = (step * Math.sqrt(3)) / 2;

    // cue ball
    balls.push({
      id: 0,
      number: 0,
      color: theme.balls.colors[0],
      position: vec.new(-tipX, tipY),
      orientation: quat.random(),
    });

    for (let row = 0; row < layout.length; row++) {
      const ballsInRow = layout[row].length;
      const yStart = tipY - ((ballsInRow - 1) * step) / 2;

      for (let col = 0; col < ballsInRow; col++) {
        const x = tipX + row * rowOffset;
        const y = yStart + col * step;
        const number = layout[row][col];

        balls.push({
          id: number,
          number,
          color: theme.balls.colors[number],
          position: vec.new(x + randomGap(), y + randomGap()),
          orientation: quat.random(),
        });
      }
    }

    return balls;
  }

  static generate8Ball() {
    return this.generateFromLayout([
      [1],
      [2, 3],
      [4, 8, 5],
      [6, 7, 9, 10],
      [11, 12, 13, 14, 15],
    ]);
  }

  static generate9Ball() {
    return this.generateFromLayout([[1], [2, 3], [4, 9, 5], [6, 7], [8]]);
  }

  static generateDebugGame() {
    return this.generateFromLayout([[9]]);
  }
}
