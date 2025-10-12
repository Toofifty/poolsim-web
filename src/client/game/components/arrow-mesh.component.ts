import { vec, type Vec } from '@common/math';
import {
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Vector3,
} from 'three';
import { createMaterial } from '../rendering/create-material';
import { toVector3 } from '../util/three-interop';
import { OverlayRenderable } from './overlay-renderable';

const up = new Vector3(0, 1, 0);
const radius = 0.0025;
const coneRadius = 0.005;
const coneHeight = 0.025;

export class ArrowMesh extends OverlayRenderable {
  constructor(
    private stem: Mesh,
    private cone: Mesh,
    private material: MeshPhysicalMaterial,
    private scale: number
  ) {
    super(new Object3D(), { outline: true, outlineColor: 'dark' });
    this.mesh.add(stem, cone);
    this.mesh.visible = false;
  }

  public setVector(v: Vec) {
    if (vec.isZero(v)) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.quaternion.setFromUnitVectors(up, toVector3(vec.norm(v)));
    const length = vec.len(v) * this.scale;
    this.stem.scale.y = length;
    this.stem.position.y = length / 2;
    this.cone.position.y = length + coneHeight / 2;
  }

  public static create({
    opacity = 1,
    scale = 1,
  }: { opacity?: number; scale?: number } = {}) {
    const material = createMaterial({
      color: 0xffffff,
      depthTest: false,
      depthWrite: false,
      transparent: opacity < 1,
      opacity,
    });
    const stem = new Mesh(new CylinderGeometry(radius, radius, 1), material);
    const cone = new Mesh(new ConeGeometry(coneRadius, coneHeight), material);
    stem.renderOrder = 9999;
    cone.renderOrder = 9999;
    return new ArrowMesh(stem, cone, material, scale);
  }
}
