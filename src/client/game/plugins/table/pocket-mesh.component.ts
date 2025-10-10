import { vec, type Vec } from '@common/math';
import { defaultParams } from '@common/simulation/physics';
import { BackSide, CylinderGeometry, Mesh, Object3D } from 'three';
import { Renderable } from '../../components/renderable';
import { createPocketLinerMesh } from '../../models/pocket/create-pocket-liner-mesh';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';

export class PocketMesh extends Renderable {
  public static create({
    position,
    radius,
  }: {
    position: Vec;
    radius: number;
  }) {
    const centrePosition = vec.subZ(position, defaultParams.pocket.depth / 2);

    const parent = new Object3D();
    parent.position.copy(toVector3(centrePosition));
    parent.add(createPocketLinerMesh({ position: centrePosition, radius }));

    const debugMesh = new Mesh(
      new CylinderGeometry(
        radius * 1.01,
        radius * 1.01,
        defaultParams.pocket.depth
      ),
      createMaterial({ color: 0x222222, side: BackSide, wireframe: true })
    );
    debugMesh.rotation.x = Math.PI / 2;

    parent.add(debugMesh);
    return new Renderable(parent);
  }
}
