import {
  BackSide,
  Color,
  CylinderGeometry,
  Mesh,
  Object3D,
  Vector2,
} from 'three';
import { snapshot } from 'valtio';
import { type Params } from '../../../common/simulation/physics';
import { PhysicsPocket } from '../../../common/simulation/physics/pocket';
import { createPocketLinerMesh } from '../models/pocket/create-pocket-liner-mesh';
import { createMaterial } from '../rendering/create-material';
import { toVector3 } from '../util/three-interop';

export class Pocket {
  public physics: PhysicsPocket;
  public parent: Object3D;
  public mesh!: Mesh;

  public radius: number;

  constructor(
    private params: Params,
    id: number,
    x: number,
    y: number,
    z: number,
    radius: number
  ) {
    this.physics = new PhysicsPocket(snapshot(params), id, x, y, z, radius);
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
    dir.y = this.position[1] > 0 ? -1 : 1;
    // left, middle, right
    dir.x = this.position[0] === 0 ? 0 : this.position[0] > 0 ? -1 : 1;

    return dir.normalize();
  }

  private createMesh() {
    this.parent.position.copy(toVector3(this.position));
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
