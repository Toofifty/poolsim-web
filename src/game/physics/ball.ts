import { Quaternion } from 'three';
import { properties } from './properties';
import type { Shot } from './shot';
import { PhysicsCushion } from './cushion';
import { randomQuaternion } from '../math';
import type {
  BallBallCollision,
  BallCushionCollision,
  BallPocketCollision,
} from './collision';
import type { PhysicsPocket } from './pocket';
import type { Ball } from '../objects/ball';
import { vec, type Vec } from './vec';
import { Game } from '../game';

export class PhysicsBall {
  public position: Vec;
  public velocity: Vec;
  public angularVelocity: Vec;

  public radius: number;
  public orientation: Quaternion;

  public isStationary = true;

  public pocket?: PhysicsPocket;

  constructor(public owner: Ball, x: number, y: number) {
    this.position = vec.new(x, y, 0);
    this.velocity = vec.new(0, 0, 0);
    this.angularVelocity = vec.new(0, 0, 0);

    this.radius = properties.ballRadius;
    this.orientation = randomQuaternion();
  }

  public clone(newOwner?: Ball) {
    const newBall = new PhysicsBall(
      newOwner ?? this.owner,
      this.position[0],
      this.position[1]
    );
    vec.mcopy(newBall.position, this.position);
    vec.mcopy(newBall.velocity, this.velocity);
    vec.mcopy(newBall.angularVelocity, this.angularVelocity);
    newBall.orientation.copy(this.orientation);
    newBall.isStationary = this.isStationary;
    newBall.pocket = this.pocket;
    return newBall;
  }

  public hit(shot: Shot) {
    vec.madd(this.velocity, vec.from(shot.velocity));
  }

  get isSliding() {
    return vec.lenSq(this.contactVelocity) > properties.epsilon;
  }

  get isRolling() {
    return vec.lenSq(this.velocity) > properties.epsilon;
  }

  get isSpinning() {
    return Math.abs(this.angularVelocity[2]) > 0;
  }

  get isPocketed() {
    return !!this.pocket;
  }

  get contactVelocity() {
    if (this.isPocketed) {
      return vec.zero;
    }

    const contactPoint = vec.new(0, 0, this.radius);
    const relativeVelocity = vec.cross(contactPoint, this.angularVelocity);
    return vec.add(this.velocity, relativeVelocity);
  }

  private zeroVectors() {
    const vEpsilon = 0.01;
    const wEpsilon = 0.01;
    if (Math.abs(this.velocity[0]) < vEpsilon) this.velocity[0] = 0;
    if (Math.abs(this.velocity[1]) < vEpsilon) this.velocity[1] = 0;
    if (Math.abs(this.velocity[2]) < vEpsilon) this.velocity[2] = 0;
    if (Math.abs(this.angularVelocity[0]) < wEpsilon)
      this.angularVelocity[0] = 0;
    if (Math.abs(this.angularVelocity[1]) < wEpsilon)
      this.angularVelocity[1] = 0;
    if (Math.abs(this.angularVelocity[2]) < wEpsilon)
      this.angularVelocity[2] = 0;
  }

  private setAngularVelocityXY(v: Vec) {
    const wt = this.angularVelocity[2];
    vec.mcopy(this.angularVelocity, v);
    this.angularVelocity[2] = wt;
  }

  public update(dt: number = 1 / 60) {
    if (this.isPocketed) {
      this.updatePocket(dt);
      return;
    }

    vec.madd(this.position, vec.mult(this.velocity, dt));
    const contactVelocity = this.contactVelocity;
    if (this.isSliding) {
      // sliding friction
      const dv = vec.mult(
        vec.norm(contactVelocity),
        -Math.min(vec.len(contactVelocity), properties.frictionSlide * dt)
      );

      vec.madd(this.velocity, dv);

      const down = vec.new(0, 0, -1);
      const dOmega = vec.mult(
        vec.cross(contactVelocity, down),
        (properties.frictionSlide * dt) / this.radius
      );

      const omegaIdeal = vec.mult(
        vec.cross(down, this.velocity),
        -1 / this.radius
      );
      const omegaDiff = vec.sub(omegaIdeal, this.angularVelocity);

      if (vec.lenSq(dOmega) > vec.lenSq(omegaDiff)) {
        vec.madd(this.angularVelocity, omegaDiff);
      } else {
        vec.madd(this.angularVelocity, dOmega);
      }
    } else if (this.isRolling) {
      const dv = vec.mult(
        vec.norm(this.velocity),
        -Math.min(vec.len(this.velocity), properties.frictionRoll * dt)
      );

      vec.madd(this.velocity, dv);

      const omegaMag = vec.len(this.velocity) / this.radius;
      const up = vec.new(0, 0, 1);
      const rollAxis = vec.norm(vec.cross(up, this.velocity));

      this.setAngularVelocityXY(vec.mult(rollAxis, omegaMag));
    }

    if (this.isSpinning) {
      const decay = ((5 * properties.frictionSpin) / (2 * this.radius)) * dt;
      if (this.angularVelocity[2] > 0) {
        this.angularVelocity[2] = Math.max(0, this.angularVelocity[2] - decay);
      } else {
        this.angularVelocity[2] = Math.min(0, this.angularVelocity[2] + decay);
      }
    }

    this.isStationary = !this.isSliding && !this.isRolling && !this.isSpinning;

    if (vec.len(this.angularVelocity) > 0) {
      const angle = vec.len(this.angularVelocity) * dt;
      const axis = vec.norm(this.angularVelocity);

      this.orientation = new Quaternion()
        .setFromAxisAngle(vec.toVector3(axis), angle)
        .multiply(this.orientation);
    }

    this.zeroVectors();
  }

  private updatePocket(dt: number) {
    const gravity = properties.gravity * 5;
    // move the ball in the pocket
    this.velocity[2] -= gravity;
    vec.madd(this.position, vec.mult(this.velocity, dt));

    this.isStationary = vec.len(this.velocity) - gravity <= properties.epsilon;
  }

  public collideBall(other: PhysicsBall): BallBallCollision | undefined {
    const dist = vec.dist(this.position, other.position);

    if (dist > 0 && dist < this.radius + other.radius) {
      const normal = vec.norm(vec.sub(this.position, other.position));
      const rv = vec.dot(vec.sub(this.velocity, other.velocity), normal);

      const overlap = this.radius + other.radius - dist;
      if (overlap > 0) {
        const correction = vec.mult(normal, overlap / 2);
        vec.madd(this.position, correction);
        vec.msub(other.position, correction);
      }

      if (rv > 0) {
        // balls are already moving away from each other
        return undefined;
      }

      const j = ((1 + properties.restitutionBallBall) * rv) / 2;
      const impulse = vec.mult(normal, j);

      vec.msub(this.velocity, impulse);
      vec.madd(other.velocity, impulse);

      this.setAngularVelocityXY(vec.mult(this.angularVelocity, 0.5));
      other.setAngularVelocityXY(vec.mult(other.angularVelocity, 0.5));

      // todo: spin transfer
      return {
        type: 'ball-ball',
        initiator: this,
        other,
        position: vec.add(this.position, vec.mult(normal, this.radius)),
        impulse,
      };
    }

    return undefined;
  }

  public collideCushion(
    cushion: PhysicsCushion
  ): BallCushionCollision | undefined {
    if (!cushion.inBounds(this.position)) {
      return undefined;
    }

    const endClosestPoint = Game.profiler.startProfile('closestPoint');
    const closestPoint = cushion.findClosestPoint(this.position);
    endClosestPoint();

    const diff = vec.sub(this.position, closestPoint);
    const dist = vec.len(diff);

    if (dist < this.radius) {
      const normal = vec.norm(diff);

      const overlap = this.radius - dist;
      vec.madd(this.position, vec.mult(normal, overlap));

      const rv = vec.dot(this.velocity, normal);
      if (rv > 0) {
        return undefined;
      }

      const j = -(1 + properties.restitutionBallCushion) * rv;
      const impulse = vec.mult(normal, j);
      vec.madd(this.velocity, impulse);

      const spinAlongNormal = vec.dot(this.angularVelocity, normal);
      const correction = vec.mult(normal, spinAlongNormal * 0.9);
      this.setAngularVelocityXY(vec.sub(this.angularVelocity, correction));

      // todo: spin transfer
      return {
        type: 'ball-cushion',
        initiator: this,
        other: cushion,
        position: closestPoint,
        impulse,
      };
    }

    return undefined;
  }

  public collidePocket(
    pocket: PhysicsPocket,
    simulated = false
  ): BallPocketCollision | undefined {
    const dist = vec.dist(
      vec.setZ(this.position, 0),
      vec.setZ(vec.from(pocket.position), 0)
    );

    if (!simulated && this.isPocketed && this.pocket === pocket) {
      // testing collision within the pocket
      if (dist > pocket.radius - this.radius) {
        // edge of pocket
        const normal = vec.norm(
          vec.sub(this.position, vec.setZ(vec.from(pocket.position), 0))
        );

        // todo: skipping overlap fix for now since it applies
        // as soon as the ball touches the pocket
        // const overlap = dist - (pocket.radius - this.radius);
        // vec.msub(this.position, vec.mult(normal, overlap));

        const vn = vec.dot(this.velocity, normal);
        if (vn > 0) {
          const vz = this.velocity[2];
          vec.msub(this.velocity, vec.mult(normal, 2 * vn));
          vec.mmult(this.velocity, 0.5);
          if (vec.lenSq(this.velocity) < properties.epsilon) {
            vec.mmult(this.velocity, 0);
          }
          this.velocity[2] = vz;
        }
      }

      const bottomZ = pocket.position.z - pocket.depth / 2;
      if (this.position[2] - this.radius < bottomZ) {
        const overlap = bottomZ - this.position[2] + this.radius;
        this.position[2] += overlap;

        if (this.velocity[2] < 0) {
          this.velocity[2] =
            -this.velocity[2] * properties.restitutionBallPocket;
        }

        vec.mmult(this.velocity, 0.5);
      }
      return undefined;
    }

    if (dist < pocket.radius) {
      this.pocket = pocket;
      if (!simulated) {
        pocket.addBall(this);
      }
      return {
        type: 'ball-pocket',
        initiator: this,
        other: pocket,
        position: this.position,
      };
    }

    return undefined;
  }

  public removeFromPocket() {
    if (!this.pocket) {
      return;
    }

    this.pocket.removeBall(this);
    this.pocket = undefined;
  }
}
