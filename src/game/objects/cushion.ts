import { Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { PhysicsCushion } from '../physics/cushion';
import { properties } from '../physics/properties';
import { createCushionGeometry } from '../models/cushion/create-cushion-geometry';
import { vec } from '../physics/vec';
import { subscribe } from 'valtio';
import { settings } from '../settings';
import { createMaterial } from '../rendering/create-material';

export class Cushion {
  public physics: PhysicsCushion;
  public mesh!: Mesh;

  private height = properties.ballRadius;

  constructor(physics: PhysicsCushion) {
    this.physics = physics;
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
      createCushionGeometry(vec.toVector3s(this.physics.vertices), this.height),
      createMaterial({
        color: properties.colorTableCushion,
        flatShading: true,
        roughness: 1,
        metalness: 0,
      })
    );

    const [position, size] = this.physics.collisionBox;
    const collisionBoxMesh = new Mesh(
      new PlaneGeometry(size[0], size[1]),
      new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    collisionBoxMesh.position.x = position[0] + size[0] / 2;
    collisionBoxMesh.position.y = position[1] + size[1] / 2;
    subscribe(settings, () => {
      if (settings.debugCollisionBoxes) {
        this.mesh.add(collisionBoxMesh);
      } else {
        this.mesh.remove(collisionBoxMesh);
      }
    });

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
