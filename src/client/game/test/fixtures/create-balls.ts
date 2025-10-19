import { quat, vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Physics } from '../../plugins/physics/physics.component';
import type { BallProto } from '../../rack';

const gap = 0.001;

const tip = vec.new(defaultParams.table.length / 4, 0);

// mock of Rack functions to prevent unnecessary imports & random
const generateFromLayout = (layout: number[][]) => {
  const balls: BallProto[] = [];
  const step = defaultParams.ball.radius * 2 + gap;
  const rowOffset = (step * Math.sqrt(3)) / 2;

  // cue ball
  balls.push({
    id: 0,
    number: 0,
    color: 0xffffff,
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
        color: 0xffffff,
        position: vec.new(x + gap, y + gap),
        orientation: quat.new(),
      });
    }
  }

  return balls;
};

export const mock8BallRack = () =>
  generateFromLayout([
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15],
  ]);

export const createBallFixtures = (rack: BallProto[]) => {
  return rack.map((ball) =>
    Physics.create({
      id: ball.id,
      r: ball.position,
      R: defaultParams.ball.radius,
      orientation: ball.orientation,
    })
  );
};
