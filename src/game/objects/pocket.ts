import {
  BackSide,
  Color,
  CylinderGeometry,
  Mesh,
  MeshPhongMaterial,
} from 'three';
import { PhysicsPocket } from '../physics/pocket';

export class Pocket {
  public physics: PhysicsPocket;
  public mesh!: Mesh;

  public radius: number;

  constructor(x: number, y: number, z: number, radius: number) {
    this.physics = new PhysicsPocket(x, y, z, radius);
    this.radius = radius;
    this.createMesh();
  }

  get depth() {
    return this.physics.depth;
  }

  get position() {
    return this.physics.position;
  }

  private createMesh() {
    this.mesh = new Mesh(
      new CylinderGeometry(this.radius, this.radius, this.depth),
      new MeshPhongMaterial({ color: new Color('#222'), side: BackSide })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.position.copy(this.position);
  }
}
