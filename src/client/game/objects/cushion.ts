import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Points,
  PointsMaterial,
} from 'three';
import { type Vec } from '../../../common/math';
import { type Params } from '../../../common/simulation/physics';
import { PhysicsCushion } from '../../../common/simulation/physics/cushion';
import { Game } from '../game';
import { createCushionGeometry } from '../models/cushion/create-cushion-geometry';
import { getControlPoints } from '../models/cushion/get-control-points';
import { createTableClothNormalTexture } from '../models/table/create-table-cloth-texture';
import { createMaterial } from '../rendering/create-material';
import { settings } from '../store/settings';
import { themed } from '../store/theme';
import { snapshot, subscribe } from '../util/subscribe';
import { toVector3 } from '../util/three-interop';

export class Cushion extends Object3D {
  public physics: PhysicsCushion;
  private mesh!: Mesh;

  constructor(private params: Params, physics: PhysicsCushion) {
    super();
    this.physics = physics;
    this.createMesh();
  }

  static fromVertices(
    params: Params,
    ...vertices: [tl: Vec, bl: Vec, br: Vec, tr: Vec]
  ) {
    return new Cushion(
      params,
      PhysicsCushion.fromVertices(snapshot(params), ...vertices)
    );
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
      this.params,
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
    const geometry = createCushionGeometry(this.params, this.physics.vertices);
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
      new MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        depthTest: false,
      })
    );
    collisionBoxMesh.position.x = position[0] + size[0] / 2;
    collisionBoxMesh.position.y = position[1] + size[1] / 2;
    collisionBoxMesh.renderOrder = 9999;

    const [A, B, C, D] = this.physics.vertices;
    const [AB, BC1, BC2, CD] = getControlPoints(this.params, [A, B, C, D]);
    const controlPoints = new Points(
      new BufferGeometry().setFromPoints(
        [A, AB, B, BC1, BC2, C, CD, D].map(toVector3)
      ),
      new PointsMaterial({
        color: 0xffffff,
        size: 0.01,
        depthTest: false,
      })
    );
    controlPoints.renderOrder = 9999;
    controlPoints.position.z = 0.01;

    subscribe(settings, () => {
      if (settings.debugCushions) {
        this.add(collisionBoxMesh, controlPoints);
      } else {
        this.remove(collisionBoxMesh, controlPoints);
      }
    });
  }

  public dispose() {
    this.traverse(Game.dispose);
  }
}
