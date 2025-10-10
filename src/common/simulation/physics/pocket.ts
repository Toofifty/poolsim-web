import { vec, type Vec } from '../../math';
import type { StaticParams } from './default-params';

export type SerializedPhysicsPocket = {
  id: number;
  position: Vec;
  radius: number;
  depth: number;
};

export class PhysicsPocket {
  public position: Vec;
  public radius: number;
  public depth: number;

  constructor(
    private params: StaticParams,
    public id: number,
    x: number,
    y: number,
    z: number,
    radius: number
  ) {
    this.depth = params.pocket.depth;
    this.position = vec.new(x, y, z - this.depth / 2);
    this.radius = radius;
  }

  public serialize() {
    return {
      id: this.id,
      position: this.position,
      radius: this.radius,
      depth: this.depth,
    } satisfies SerializedPhysicsPocket;
  }

  public sync(pocket: SerializedPhysicsPocket) {
    this.id = pocket.id;
    this.position = pocket.position;
    this.radius = pocket.radius;
    this.depth = pocket.depth;
  }
}
