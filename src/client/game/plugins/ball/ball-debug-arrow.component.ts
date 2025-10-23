import { ArrowMesh } from '../../components/arrow-mesh.component';

export class BallDebugUArrow extends ArrowMesh {
  public static create() {
    return super.create({ color: 0xffff00, scale: 0.2 });
  }
}

export class BallDebugWArrow extends ArrowMesh {
  public static create() {
    return super.create({ color: 0xff00ff, scale: 0.001 });
  }
}

export class BallDebugVArrow extends ArrowMesh {
  public static create() {
    return super.create({ color: 0x0000ff, scale: 0.2 });
  }
}
