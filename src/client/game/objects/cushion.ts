import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three';
import { subscribe } from 'valtio';
import { vec, type Vec } from '../../../common/math';
import { PhysicsCushion } from '../../../common/simulation/physics/cushion';
import { params } from '../../../common/simulation/physics/params';
import { properties } from '../../../common/simulation/physics/properties';
import { Game } from '../game';
import { createCushionGeometry } from '../models/cushion/create-cushion-geometry';
import { createTableClothNormalTexture } from '../models/table/create-table-cloth-texture';
import { createMaterial } from '../rendering/create-material';
import { settings } from '../store/settings';
import { themed } from '../store/theme';

export class Cushion extends Object3D {
  public physics: PhysicsCushion;
  private mesh!: Mesh;

  constructor(physics: PhysicsCushion) {
    super();
    this.physics = physics;
    this.createMesh();
  }

  static fromRelativeVertices2D(...verticesXY: number[]) {
    return new Cushion(PhysicsCushion.fromRelativeVertices(...verticesXY));
  }

  static fromVertices(...vertices: [tl: Vec, bl: Vec, br: Vec, tr: Vec]) {
    return new Cushion(PhysicsCushion.fromVertices(...vertices));
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

  private get isVertical() {
    return this.physics.vertices[0][0] === this.physics.vertices[3][0];
  }

  private get isLeft() {
    return (
      this.isVertical &&
      this.physics.vertices[0][1] < this.physics.vertices[3][1]
    );
  }

  private createNormalTexture(geometry: BufferGeometry) {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox!;
    const scale = 2;

    const texture = createTableClothNormalTexture(
      scale * Math.abs(bbox.max.x - bbox.min.x),
      scale * Math.abs(bbox.max.y - bbox.min.y)
    );

    if (this.isVertical) {
      texture.flipY = false;
      texture.rotation = (Math.PI / 2) * (this.isLeft ? -1 : 1);
    }

    return texture;
  }

  private createMesh() {
    const geometry = createCushionGeometry(this.physics.vertices);
    const normalMap = this.createNormalTexture(geometry);
    themed((theme) => {
      if (this.mesh) {
        Game.dispose(this.mesh);
        this.remove(this.mesh);
      }

      this.mesh = new Mesh(
        geometry,
        createMaterial({
          normalMap: settings.highDetail ? normalMap : null,
          color: theme.table.colorCloth,
          roughness: 1,
          metalness: 0,
        })
      );

      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.add(this.mesh);
    });

    const [position, size] = this.physics.collisionBox;
    const collisionBoxMesh = new Mesh(
      new PlaneGeometry(size[0], size[1]),
      new MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    collisionBoxMesh.position.x = position[0] + size[0] / 2;
    collisionBoxMesh.position.y = position[1] + size[1] / 2;
    subscribe(settings, () => {
      if (settings.debugCollisionBoxes) {
        this.add(collisionBoxMesh);
      } else {
        this.remove(collisionBoxMesh);
      }
    });
  }
}

export const createCushions = () => {
  const { tableLength, tableWidth } = properties;
  const {
    cushion: { width },
    pocket: { edge, corner },
  } = params;

  const t = vec.new(0, tableWidth / 2);
  const b = vec.new(0, -tableWidth / 2);
  /** top-left */
  const tl = vec.new(-tableLength / 2, tableWidth / 2);
  /** bottom-left */
  const bl = vec.new(-tableLength / 2, -tableWidth / 2);
  /** bottom-right */
  const br = vec.new(tableLength / 2, -tableWidth / 2);
  /** top-right */
  const tr = vec.new(tableLength / 2, tableWidth / 2);

  const cushions: Cushion[] = [];

  // left
  cushions.push(
    Cushion.fromVertices(
      vec.addY(bl, corner.radius),
      vec.addXY(bl, width, width + corner.radius + corner.girth),
      vec.subXY(tl, -width, width + corner.radius + corner.girth),
      vec.subY(tl, corner.radius)
    )
  );

  // top-left
  cushions.push(
    Cushion.fromVertices(
      vec.addX(tl, corner.radius),
      vec.addXY(tl, width + corner.radius + corner.girth, -width),
      vec.subXY(t, edge.radius + edge.girth, width),
      vec.subX(t, edge.radius)
    )
  );

  // top-right
  cushions.push(
    Cushion.fromVertices(
      vec.addX(t, edge.radius),
      vec.addXY(t, edge.radius + edge.girth, -width),
      vec.subXY(tr, width + corner.radius + corner.girth, width),
      vec.subX(tr, corner.radius)
    )
  );

  // right
  cushions.push(
    Cushion.fromVertices(
      vec.subY(tr, corner.radius),
      vec.subXY(tr, width, width + corner.radius + corner.girth),
      vec.addXY(br, -width, width + corner.radius + corner.girth),
      vec.addY(br, corner.radius)
    )
  );

  // bottom-right
  cushions.push(
    Cushion.fromVertices(
      vec.subX(br, corner.radius),
      vec.subXY(br, width + corner.radius + corner.girth, -width),
      vec.addXY(b, edge.radius + edge.girth, width),
      vec.addX(b, edge.radius)
    )
  );

  // bottom-left
  cushions.push(
    Cushion.fromVertices(
      vec.subX(b, edge.radius),
      vec.subXY(b, edge.radius + edge.girth, -width),
      vec.addXY(bl, width + corner.radius + corner.girth, width),
      vec.addX(bl, corner.radius)
    )
  );

  return cushions;
};
