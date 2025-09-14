import { Mesh, MeshLambertMaterial } from 'three';
import { PhysicsCushion } from '../physics/cushion';
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

export const createCushions = () => {
  const {
    tableLength,
    tableWidth,
    pocketCornerRadius,
    pocketEdgeRadius,
    pocketOverlap,
    pocketCornerOverlap,
    bumperWidth,
  } = properties;

  const leftBound = -tableLength / 2;
  const rightBound = tableLength / 2;
  const topBound = -tableWidth / 2;
  const bottomBound = tableWidth / 2;

  const vBumperHeight = tableWidth - pocketCornerRadius * 2;
  const hBumperWidth = tableLength / 2 - pocketCornerRadius - pocketEdgeRadius;

  return [
    // left
    Cushion.fromRelativeVertices2D(
      leftBound,
      topBound + pocketCornerRadius - pocketCornerOverlap,
      0,
      vBumperHeight + pocketCornerOverlap * 2,
      bumperWidth,
      -bumperWidth,
      0,
      -vBumperHeight + bumperWidth * 2 - pocketCornerOverlap * 2
    ).reverseVertices(),
    // right
    Cushion.fromRelativeVertices2D(
      rightBound,
      topBound + pocketCornerRadius - pocketCornerOverlap,
      0,
      vBumperHeight + pocketCornerOverlap * 2,
      -bumperWidth,
      -bumperWidth,
      0,
      -vBumperHeight + bumperWidth * 2 - pocketCornerOverlap * 2
    ),
    // top-left
    Cushion.fromRelativeVertices2D(
      leftBound + pocketCornerRadius - pocketCornerOverlap,
      bottomBound,
      hBumperWidth + pocketOverlap + pocketCornerOverlap,
      0,
      -bumperWidth / 2,
      -bumperWidth,
      -hBumperWidth +
        (bumperWidth * 3) / 2 -
        pocketOverlap -
        pocketCornerOverlap,
      0
    ).reverseVertices(),
    // top-right
    Cushion.fromRelativeVertices2D(
      rightBound - pocketCornerRadius + pocketCornerOverlap,
      bottomBound,
      -hBumperWidth - pocketOverlap - pocketCornerOverlap,
      0,
      bumperWidth / 2,
      -bumperWidth,
      hBumperWidth -
        (bumperWidth * 3) / 2 +
        pocketOverlap +
        pocketCornerOverlap,
      0
    ),
    // bottom-left
    Cushion.fromRelativeVertices2D(
      leftBound + pocketCornerRadius - pocketCornerOverlap,
      topBound,
      hBumperWidth + pocketOverlap + pocketCornerOverlap,
      0,
      -bumperWidth / 2,
      bumperWidth,
      -hBumperWidth +
        (bumperWidth * 3) / 2 -
        pocketOverlap -
        pocketCornerOverlap,
      0
    ),
    // bottom-right
    Cushion.fromRelativeVertices2D(
      rightBound - pocketCornerRadius + pocketCornerOverlap,
      topBound,
      -hBumperWidth - pocketOverlap - pocketCornerOverlap,
      0,
      bumperWidth / 2,
      bumperWidth,
      hBumperWidth -
        (bumperWidth * 3) / 2 +
        pocketOverlap +
        pocketCornerOverlap,
      0
    ).reverseVertices(),
  ];
};
