import {
  ConeGeometry,
  CylinderGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Vector3,
  type MeshPhysicalMaterialParameters,
} from 'three';
import { vec, type Vec } from '../../../../common/math';
import { Game } from '../../game';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';

const up = new Vector3(0, 1, 0);

export class CurvedArrow extends Object3D {
  private radius = 0.0025;
  private coneRadius = 0.005;
  private coneHeight = 0.025;
  private tangentLength = 0.25;

  private tangent: Object3D;
  private cone: Mesh;

  constructor(
    public ref: { position: Vector3 },
    {
      color,
      factor = 1,
      opacity = 1,
    }: {
      color: MeshPhysicalMaterialParameters['color'];
      factor?: number;
      opacity?: number;
    }
  ) {
    super();
    const material = createMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      transparent: opacity < 1,
      opacity,
    });
    this.tangent = createTangentLine(this.radius, material);
    this.cone = new Mesh(
      new ConeGeometry(this.coneRadius, this.coneHeight),
      material
    );
    this.tangent.scale.y = this.tangentLength;
    this.tangent.renderOrder = 9999;
    this.cone.renderOrder = 9999;
    this.cone.visible = false;
    this.add(this.tangent, this.cone);
    this.position.copy(ref.position);
    this.visible = false;
    Game.add(this, { outline: true });
  }

  public setVectors(velocity: Vec) {
    if (vec.isZero(velocity)) {
      this.visible = false;
      return;
    }
    velocity[2] = 0;
    this.visible = true;
    this.quaternion.setFromUnitVectors(up, toVector3(vec.norm(velocity)));
    this.cone.position.y = length + this.coneHeight / 2;
  }

  public update() {
    this.position.copy(this.ref.position);
  }

  public dispose() {
    Game.remove(this);
    this.tangent.traverse(Game.dispose);
    Game.dispose(this);
  }
}

const SEGMENTS = 7 * 2;

const createTangentLine = (
  radius: number,
  material: MeshPhysicalMaterial
): Object3D => {
  const parent = new Object3D();

  for (let i = 0; i < SEGMENTS + 1; i++) {
    if (i % 2 === 1) continue;

    const mesh = new Mesh(
      new CylinderGeometry(radius, radius, 1 / SEGMENTS),
      material
    );
    mesh.position.y = (i + 0.5) / SEGMENTS;
    parent.add(mesh);
  }

  return parent;
};
