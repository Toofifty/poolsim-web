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

  get key() {
    const angleQ = BigInt(Math.round(this.angle * 1000));
    const forceQ = BigInt(Math.round(this.force * 100));
    const sideQ = BigInt(Math.round((this.sideSpin + 1) * 500));
    const topQ = BigInt(Math.round((this.topSpin + 1) * 500));

    return (
      ((angleQ & 0xfffffn) << 44n) |
      ((forceQ & 0xfffffn) << 24n) |
      ((sideQ & 0xfffn) << 12n) |
      (topQ & 0xfffn)
    );
  }
}
