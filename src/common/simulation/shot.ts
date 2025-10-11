import type { Cue } from '../../client/game/plugins/cue/cue.component';
import { vec } from '../math';

export class Shot {
  public angle: number;
  public force: number;
  public sideSpin: number;
  public topSpin: number;
  /** 0 - pi/2 */
  public lift: number;

  constructor(
    angle: number,
    force: number,
    sideSpin?: number,
    topSpin?: number,
    lift?: number
  ) {
    this.angle = angle;
    this.force = force;
    this.sideSpin = sideSpin ?? 0;
    this.topSpin = topSpin ?? 0;
    this.lift = lift ?? 0;
  }

  get velocity() {
    return vec.new(
      this.force * Math.cos(this.angle),
      this.force * Math.sin(this.angle)
    );
  }

  get key() {
    const angleQ = BigInt(Math.round(this.angle * 1000)) & 0xffffn;
    const forceQ = BigInt(Math.round(this.force * 100)) & 0xffffn;
    const liftQ =
      BigInt(Math.round((this.lift / (Math.PI / 2)) * 4095)) & 0xfffn;
    const sideQ = BigInt(Math.round((this.sideSpin + 1) * 500)) & 0xfffn;
    const topQ = BigInt(Math.round((this.topSpin + 1) * 255)) & 0xffn;

    return (
      (angleQ << 48n) | (forceQ << 32n) | (liftQ << 20n) | (sideQ << 8n) | topQ
    );
  }

  public static from(cue: Cue) {
    return new Shot(cue.angle, cue.force, cue.side, cue.top, cue.lift);
  }
}
