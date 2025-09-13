import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
} from 'three';
import { PhysicsCushion } from '../physics/cushion';
import { flatternVertices, triangulateConvexPolygon } from '../math';

export class Cushion {
  public physics: PhysicsCushion;
  public mesh!: Mesh;

  constructor(physics: PhysicsCushion) {
    this.physics = physics;

    // todo: 3d cushion model
    this.createMesh();
  }

  static fromRelativeVertices2D(...verticesXY: number[]) {
    return new Cushion(PhysicsCushion.fromRelativeVertices(...verticesXY));
  }

  private createMesh() {
    const geometry = new BufferGeometry();
    const vertices = new Float32Array(
      flatternVertices(triangulateConvexPolygon(this.physics.vertices))
    );
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    this.mesh = new Mesh(
      geometry,
      new MeshLambertMaterial({ color: '#227722', side: DoubleSide })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}
