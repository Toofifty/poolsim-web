import { type Vec } from '../../math';
import type { StaticParams } from './default-params';
import { Polygon } from './polygon';

export type SerializedPhysicsCushion = {
  vertices: readonly [Vec, Vec, Vec, Vec];
  collisionBox: readonly [Vec, Vec];
};

export class PhysicsCushion extends Polygon {
  /**
   * Vertices _must_ be in this order (regardless of orientation):
   *
   *  tl - - - - - - - - - - tr
   *    \                  /      tl -> bl -> br -> tr
   *     bl ->-------->- br
   */
  static fromVertices(
    params: StaticParams,
    ...vertices: [tl: Vec, bl: Vec, br: Vec, tr: Vec]
  ) {
    return new PhysicsCushion(params, vertices);
  }

  public serialize() {
    return {
      collisionBox: this.collisionBox,
      vertices: this.vertices,
    } satisfies SerializedPhysicsCushion;
  }

  public sync(cushion: SerializedPhysicsCushion) {
    this.collisionBox = cushion.collisionBox;
    this.vertices = cushion.vertices;
  }
}
