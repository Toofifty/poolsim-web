import { Color, Mesh, MeshPhongMaterial, SphereGeometry } from 'three';
import { PhysicsBall } from '../physics/ball';
import type { Shot } from '../physics/shot';
import { Cushion } from './cushion';
import { createBallTexture } from '../create-ball-texture';
import type { Collision } from '../physics/collision';

export class Ball {
  private physics: PhysicsBall;

  private color: Color;
  private number: number;

  private mesh!: Mesh;

  constructor(x: number, y: number, color: Color, number: number = -1) {
    this.physics = new PhysicsBall(x, y);
    this.color = color;
    this.number = number;
    this.createMesh();
  }

  private createMesh() {
    const geometry = new SphereGeometry(this.physics.radius);
    const material = new MeshPhongMaterial({
      map: createBallTexture({
        color: `#${this.color.getHexString()}`,
        number: this.number,
      }),
      specular: new Color('#888'),
      shininess: 200,
    });
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.add(this.physics.position);
    this.mesh.castShadow = true;
  }

  get position() {
    return this.physics.position;
  }

  get isStationary() {
    return this.physics.isStationary;
  }

  get isPocketed() {
    return this.physics.isPocketed;
  }

  public hit(shot: Shot) {
    this.physics.hit(shot);
  }

  public collide(object: Ball | Cushion): Collision | undefined {
    if (object instanceof Ball) {
      return this.physics.collideBall(object.physics);
    }
    if (object instanceof Cushion) {
      return this.physics.collideCushion(object.physics);
    }
    return undefined;
  }

  public getMesh() {
    return this.mesh;
  }

  public update() {
    this.physics.update();
    this.mesh.rotation.setFromQuaternion(this.physics.orientation);
    this.mesh.position.sub(this.mesh.position);
    this.mesh.position.add(this.physics.position);
  }
}
