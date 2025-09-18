import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  Object3D,
  Vector3,
} from 'three';
import { createMaterial } from '../rendering/create-material';

const up = new Vector3(0, 1, 0);

export class Arrow extends Object3D {
  private radius = 0.0025;
  private coneRadius = 0.005;
  private coneHeight = 0.025;

  private stem: Mesh;
  private cone: Mesh;

  private factor: number;

  constructor({
    color,
    factor = 1,
    opacity = 1,
  }: {
    color: Color;
    factor?: number;
    opacity?: number;
  }) {
    super();
    this.factor = factor;
    const material = createMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      transparent: opacity < 1,
      opacity,
    });
    this.stem = new Mesh(
      new CylinderGeometry(this.radius, this.radius, 1),
      material
    );
    this.cone = new Mesh(
      new ConeGeometry(this.coneRadius, this.coneHeight),
      material
    );
    this.stem.castShadow = true;
    this.stem.renderOrder = 9999;
    this.cone.castShadow = true;
    this.cone.renderOrder = 9999;
    this.setVector(new Vector3(0, 0, 0));
    this.add(this.stem, this.cone);
  }

  public setVector(vector: Vector3) {
    const length = vector.length() * this.factor;
    if (length === 0) {
      this.visible = false;
      return;
    }
    this.visible = true;
    this.quaternion.setFromUnitVectors(up, vector.clone().normalize());
    this.stem.scale.y = length;
    this.stem.position.y = length / 2;
    this.cone.position.y = length + this.coneHeight / 2;
  }
}
