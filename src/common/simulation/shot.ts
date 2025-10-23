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

  public static getVelocity(shot: Shot) {
    return vec.new(
      shot.force * Math.cos(shot.angle),
      shot.force * Math.sin(shot.angle)
    );
  }

  /** @deprecated */
  get velocity() {
    return Shot.getVelocity(this);
  }

  public static getKey(shot: Shot) {
    const angleQ = BigInt(Math.round(shot.angle * 1000)) & 0xffffn;
    const forceQ = BigInt(Math.round(shot.force * 100)) & 0xffffn;
    const liftQ =
      BigInt(Math.round((shot.lift / (Math.PI / 2)) * 4095)) & 0xfffn;
    const sideQ = BigInt(Math.round((shot.sideSpin + 1) * 500)) & 0xfffn;
    const topQ = BigInt(Math.round((shot.topSpin + 1) * 255)) & 0xffn;

    return (
      (angleQ << 48n) | (forceQ << 32n) | (liftQ << 20n) | (sideQ << 8n) | topQ
    );
  }

  /** @deprecated */
  get key() {
    return Shot.getKey(this);
  }

  public static from(cue: Cue) {
    return new Shot(cue.angle, cue.force, cue.side, cue.top, cue.lift);
  }
}
