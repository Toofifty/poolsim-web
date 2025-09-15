import { Color } from 'three';
import { properties } from './physics/properties';
import { Ball } from './objects/ball';

const gap = properties.ballRadius / 16;
const colors = [
  new Color('#FFFFFF'),
  new Color('#FFB200'),
  new Color('#002564'),
  new Color('#990100'),
  new Color('#60067f'),
  new Color('#eb5300'),
  new Color('#005900'),
  new Color('#500003'),
  new Color('#010101'),
  new Color('#FFB200'),
  new Color('#002564'),
  new Color('#990100'),
  new Color('#60067f'),
  new Color('#eb5300'),
  new Color('#005900'),
  new Color('#500003'),
];

export class Rack {
  private static generateFromLayout(
    tipX: number,
    tipY: number,
    layout: number[][]
  ) {
    const balls: Ball[] = [];
    const step = properties.ballRadius * 2 + gap;
    const rowOffset = (step * Math.sqrt(3)) / 2;

    for (let row = 0; row < layout.length; row++) {
      const ballsInRow = layout[row].length;
      const yStart = tipY - ((ballsInRow - 1) * step) / 2;

      for (let col = 0; col < ballsInRow; col++) {
        const x = tipX + row * rowOffset;
        const y = yStart + col * step;
        const number = layout[row][col];
        const color = colors[number];

        balls.push(new Ball(x, y, color, number));
      }
    }

    return balls;
  }

  static generate8Ball(tipX: number, tipY: number) {
    return this.generateFromLayout(tipX, tipY, [
      [1],
      [2, 3],
      [4, 8, 5],
      [6, 7, 9, 10],
      [11, 12, 13, 14, 15],
    ]);
  }

  static generate9Ball(tipX: number, tipY: number) {
    return this.generateFromLayout(tipX, tipY, [
      [1],
      [2, 3],
      [4, 9, 5],
      [6, 7],
      [8],
    ]);
  }

  static generateDebugGame(tipX: number, tipY: number) {
    return this.generateFromLayout(tipX, tipY, [[9]]);
  }
}
