import { Vector3 } from 'three';

export class Shot {
  public angle: number;
  public force: number;
  public sideSpin: number;
  public topSpin: number;

  constructor(
    angle: number,
    force: number,
    sideSpin?: number,
    topSpin?: number
  ) {
    this.angle = angle;
    this.force = force;
    this.sideSpin = sideSpin ?? 0;
    this.topSpin = topSpin ?? 0;
  }

  get velocity() {
    return new Vector3(
      this.force * Math.cos(this.angle),
      this.force * Math.sin(this.angle)
    );
  }
}
