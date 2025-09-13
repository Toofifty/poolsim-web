import { Vector3 } from 'three';

export class Shot {
  private angle: number;
  private force: number;
  private sideSpin: number;
  private topSpin: number;

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
