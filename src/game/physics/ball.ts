import { Quaternion, Vector3 } from 'three';
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
import { vec } from './vec';
import { Game } from '../game';

export class PhysicsBall {
  public position: Vector3;
  public velocity: Vector3;
  public angularVelocity: Vector3;

  public radius: number;
  public orientation: Quaternion;

  public isStationary = true;

  public pocket?: PhysicsPocket;

  constructor(public owner: Ball, x: number, y: number) {
    this.position = new Vector3(x, y, 0);
    this.velocity = new Vector3(0, 0, 0);
    this.angularVelocity = new Vector3(0, 0, 0);

    this.radius = properties.ballRadius;
    this.orientation = randomQuaternion();
  }

  public clone() {
    const newBall = new PhysicsBall(
      this.owner,
      this.position.x,
      this.position.y
    );
    newBall.position.copy(this.position);
    newBall.velocity.copy(this.velocity);
    newBall.angularVelocity.copy(this.angularVelocity);
    newBall.orientation.copy(this.orientation);
    newBall.isStationary = this.isStationary;
    newBall.pocket = this.pocket;
    return newBall;
  }

  public hit(shot: Shot) {
    this.velocity.add(shot.velocity);
  }

  get isSliding() {
    return this.contactVelocity.length() > properties.epsilon;
  }

  get isRolling() {
    return this.velocity.length() > properties.epsilon;
  }

  get isSpinning() {
    return Math.abs(this.angularVelocity.z) > 0;
  }

  get isPocketed() {
    return !!this.pocket;
  }

  get contactVelocity() {
    if (this.isPocketed) {
      return new Vector3(0, 0, 0);
    }

    const contactPoint = new Vector3(0, 0, this.radius);
    const relativeVelocity = contactPoint.cross(this.angularVelocity);
    return this.velocity.clone().setZ(0).add(relativeVelocity);
  }

  private zeroVectors() {
    const vEpsilon = 0.01;
    const wEpsilon = 0.01;
    if (Math.abs(this.velocity.x) < vEpsilon) this.velocity.x = 0;
    if (Math.abs(this.velocity.y) < vEpsilon) this.velocity.y = 0;
    if (Math.abs(this.velocity.z) < vEpsilon) this.velocity.z = 0;
    if (Math.abs(this.angularVelocity.x) < wEpsilon) this.angularVelocity.x = 0;
    if (Math.abs(this.angularVelocity.y) < wEpsilon) this.angularVelocity.y = 0;
    if (Math.abs(this.angularVelocity.z) < wEpsilon) this.angularVelocity.z = 0;
  }

  private setAngularVelocityXY(v: Vector3) {
    const wt = this.angularVelocity.z;
    this.angularVelocity.copy(v).setZ(wt);
  }

  public update(dt: number = 1 / 60) {
    if (this.isPocketed) {
      this.updatePocket(dt);
      return;
    }

    if (this.velocity.length() < properties.epsilon) {
      return;
    }

    this.position.add(this.velocity.clone().multiplyScalar(dt));
    const contactVelocity = this.contactVelocity;
    if (this.isSliding) {
      // sliding friction
      const dv = contactVelocity
        .clone()
        .normalize()
        .multiplyScalar(
          -Math.min(contactVelocity.length(), properties.frictionSlide * dt)
        );

      this.velocity.add(dv);

      const down = new Vector3(0, 0, -1);
      const dOmega = contactVelocity
        .clone()
        .cross(down)
        .multiplyScalar((properties.frictionSlide * dt) / this.radius);

      const omegaIdeal = down
        .cross(this.velocity)
        .multiplyScalar(-1 / this.radius);
      const omegaDiff = omegaIdeal.clone().sub(this.angularVelocity);

      if (dOmega.length() > omegaDiff.length()) {
        this.angularVelocity.add(omegaDiff);
      } else {
        this.angularVelocity.add(dOmega);
      }
    } else if (this.isRolling) {
      const dv = this.velocity
        .clone()
        .normalize()
        .multiplyScalar(
          -Math.min(this.velocity.length(), properties.frictionRoll * dt)
        );
      this.velocity.add(dv);

      const omegaMag = this.velocity.length() / this.radius;
      const up = new Vector3(0, 0, 1);
      const rollAxis = up.cross(this.velocity).normalize();

      this.setAngularVelocityXY(rollAxis.multiplyScalar(omegaMag));
    }

    if (this.isSpinning) {
      const decay = ((5 * properties.frictionSpin) / (2 * this.radius)) * dt;
      if (this.angularVelocity.z > 0) {
        this.angularVelocity.z = Math.max(0, this.angularVelocity.z - decay);
      } else {
        this.angularVelocity.z = Math.min(0, this.angularVelocity.z + decay);
      }
    }

    this.isStationary = !this.isSliding && !this.isRolling && !this.isSpinning;

    if (this.angularVelocity.length() > 0) {
      const angle = this.angularVelocity.length() * dt;
      const axis = this.angularVelocity.clone().normalize();

      this.orientation = new Quaternion()
        .setFromAxisAngle(axis, angle)
        .multiply(this.orientation);
    }

    this.zeroVectors();
  }

  private updatePocket(dt: number) {
    // move the ball in the pocket
    this.velocity.z -= properties.gravity;
    this.position.add(this.velocity.clone().multiplyScalar(dt));

    this.isStationary =
      this.velocity.length() - properties.gravity <= properties.epsilon;
  }

  public collideBall(other: PhysicsBall): BallBallCollision | undefined {
    const dist = this.position.distanceTo(other.position);

    if (dist > 0 && dist < this.radius + other.radius) {
      const normal = this.position.clone().sub(other.position).normalize();
      const rv = this.velocity.clone().sub(other.velocity).dot(normal);

      const overlap = this.radius + other.radius - dist;
      if (overlap > 0) {
        const correction = normal.clone().multiplyScalar(overlap / 2);
        this.position.add(correction);
        other.position.sub(correction);
      }

      if (rv > 0) {
        // balls are already moving away from each other
        return undefined;
      }

      const j = ((1 + properties.restitutionBallBall) * rv) / 2;
      const impulse = normal.clone().multiplyScalar(j);

      this.velocity.sub(impulse);
      other.velocity.add(impulse);

      this.setAngularVelocityXY(
        this.angularVelocity.clone().multiplyScalar(0.5)
      );
      other.setAngularVelocityXY(
        other.angularVelocity.clone().multiplyScalar(0.5)
      );

      // todo: spin transfer
      return {
        type: 'ball-ball',
        initiator: this,
        other,
        position: this.position
          .clone()
          .add(normal.clone().multiplyScalar(this.radius)),
        impulse,
      };
    }

    return undefined;
  }

  public collideCushion(
    cushion: PhysicsCushion
  ): BallCushionCollision | undefined {
    const position = vec.from(this.position);
    const velocity = vec.from(this.velocity);
    const angularVelocity = vec.from(this.angularVelocity);

    if (!cushion.inBounds(position)) {
      return undefined;
    }

    const endClosestPoint = Game.profiler.startProfile('closestPoint');
    const closestPoint = cushion.findClosestPoint(position);
    endClosestPoint();

    const diff = vec.sub(position, closestPoint);
    const dist = vec.len(diff);

    if (dist < this.radius) {
      const normal = vec.norm(diff);

      const overlap = this.radius - dist;
      this.position.add(vec.toVector3(vec.mult(normal, overlap)));

      const rv = vec.dot(velocity, normal);
      if (rv > 0) {
        return undefined;
      }

      const j = -(1 + properties.restitutionBallCushion) * rv;
      const impulse = vec.mult(normal, j);
      this.velocity.add(vec.toVector3(impulse));

      const spinAlongNormal = vec.dot(angularVelocity, normal);
      const correction = vec.mult(normal, spinAlongNormal * 0.9);
      this.setAngularVelocityXY(
        vec.toVector3(vec.sub(angularVelocity, correction))
      );

      // todo: spin transfer
      return {
        type: 'ball-cushion',
        initiator: this,
        other: cushion,
        position: vec.toVector3(closestPoint),
        impulse: vec.toVector3(impulse),
      };
    }

    return undefined;
  }

  public collidePocket(
    pocket: PhysicsPocket,
    simulated = false
  ): BallPocketCollision | undefined {
    const dist = this.position
      .clone()
      .setZ(0)
      .distanceTo(pocket.position.clone().setZ(0));

    if (!simulated && this.isPocketed && this.pocket === pocket) {
      // testing collision within the pocket
      if (dist > pocket.radius - this.radius) {
        // edge of pocket
        const normal = this.position
          .clone()
          .sub(pocket.position)
          .setZ(0)
          .normalize();

        const overlap = dist - (pocket.radius - this.radius);
        this.position.sub(normal.clone().multiplyScalar(overlap));

        const vn = this.velocity.dot(normal);
        if (vn > 0) {
          this.velocity.sub(normal.clone().multiplyScalar(2 * vn));
          this.velocity.multiplyScalar(0.5);
          if (this.velocity.length() < properties.epsilon) {
            this.velocity.multiplyScalar(0);
          }
        }
      }

      const bottomZ = pocket.position.z - pocket.depth / 2;
      if (this.position.z - this.radius < bottomZ) {
        const overlap = bottomZ - this.position.z + this.radius;
        this.position.z += overlap;

        if (this.velocity.z < 0) {
          this.velocity.z = -this.velocity.z * properties.restitutionBallPocket;
        }

        this.velocity.multiplyScalar(0.9);
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
        position: this.position.clone(),
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
