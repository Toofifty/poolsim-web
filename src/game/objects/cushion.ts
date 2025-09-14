import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial,
  Vector3,
} from 'three';
import { PhysicsCushion } from '../physics/cushion';
import { flatternVertices, triangulateConvexPolygon } from '../math';
import { properties } from '../physics/properties';
import { createCushionGeometry } from '../create-cushion-geometry';

export class Cushion {
  public physics: PhysicsCushion;
  public mesh!: Mesh;

  private height = properties.ballRadius;

  constructor(physics: PhysicsCushion) {
    this.physics = physics;

    // todo: 3d cushion model
    this.createMesh();
  }

  static fromRelativeVertices2D(...verticesXY: number[]) {
    return new Cushion(PhysicsCushion.fromRelativeVertices(...verticesXY));
  }

  public reverseVertices() {
    this.physics.vertices = [
      this.physics.vertices[1],
      this.physics.vertices[0],
      this.physics.vertices[3],
      this.physics.vertices[2],
    ];
    this.createMesh();
    return this;
  }

  private createMesh() {
    this.mesh = new Mesh(
      createCushionGeometry(this.physics.vertices, this.height),
      new MeshLambertMaterial({
        color: '#228822',
        flatShading: true,
      })
    );
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}
