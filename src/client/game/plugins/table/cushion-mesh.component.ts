import type { Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
} from 'three';
import { Renderable } from '../../components/renderable';
import { createCushionGeometry } from '../../models/cushion/create-cushion-geometry';
import { getControlPoints } from '../../models/cushion/get-control-points';
import { createMaterial } from '../../rendering/create-material';
import { makeTheme } from '../../store/theme';
import { toVector3 } from '../../util/three-interop';
import { Cushion } from './cushion.component';

export class CushionMesh extends Renderable {
  public static create(vertices: [Vec, Vec, Vec, Vec]) {
    const theme = makeTheme();

    const geometry = createCushionGeometry(defaultParams, vertices);
    const material = createMaterial({
      color: theme.table.colorCloth,
      roughness: 1,
      metalness: 0,
    });
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const [position, size] = Cushion.computeCollisionBox(
      defaultParams,
      vertices
    );
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

    const [A, B, C, D] = vertices;
    const [AB, BC1, BC2, CD] = getControlPoints(defaultParams, vertices);
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
    controlPoints.position.z = defaultParams.ball.radius + 0.01;

    // todo: debug
    // mesh.add(collisionBoxMesh, controlPoints);
    return new CushionMesh(mesh);
  }
}
