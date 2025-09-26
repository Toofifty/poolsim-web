import {
  BackSide,
  Color,
  CylinderGeometry,
  Mesh,
  Object3D,
  Vector2,
} from 'three';
import { PhysicsPocket } from '../physics/pocket';
import { createMaterial } from '../rendering/create-material';
import { createPocketLinerMesh } from '../models/pocket/create-pocket-liner-mesh';

export class Pocket {
  public physics: PhysicsPocket;
  public parent: Object3D;
  public mesh!: Mesh;

  public radius: number;

  constructor(x: number, y: number, z: number, radius: number) {
    this.physics = new PhysicsPocket(x, y, z, radius);
    this.radius = radius;
    this.parent = new Object3D();
    this.createMesh();
  }

  get depth() {
    return this.physics.depth;
  }

  get position() {
    return this.physics.position;
  }

  get mouthDirection() {
    const dir = new Vector2(0, 0);

    // top or bottom
    dir.y = this.position.y > 0 ? -1 : 1;
    // left, middle, right
    dir.x = this.position.x === 0 ? 0 : this.position.x > 0 ? -1 : 1;

    return dir.normalize();
  }

  private createMesh() {
    this.parent.position.copy(this.position);
    this.mesh = new Mesh(
      new CylinderGeometry(this.radius * 1.01, this.radius * 1.01, this.depth),
      createMaterial({ color: new Color('#222'), side: BackSide })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.rotation.x = Math.PI / 2;
    // this.parent.add(this.mesh);
    this.parent.add(createPocketLinerMesh(this));
  }
}
