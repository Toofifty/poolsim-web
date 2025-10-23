import { type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { Collider } from '../physics/collider.component';

export class Cushion extends Collider {
  constructor(public vertices: [Vec, Vec, Vec, Vec]) {
    super(
      vertices,
      defaultParams.ball.restitutionCushion,
      defaultParams.ball.frictionCushion
    );
  }

  /**
   * Vertices _must_ be in this order (regardless of orientation):
   *
   *  tl - - - - - - - - - - tr
   *    \                  /      tl -> bl -> br -> tr
   *     bl ->-------->- br
   */
  public static create(vertices: [Vec, Vec, Vec, Vec]) {
    return new Cushion(vertices);
  }
}
