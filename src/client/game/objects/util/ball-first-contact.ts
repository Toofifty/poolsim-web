import {
  Color,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  TorusGeometry,
} from 'three';
import type { Vec } from '../../../../common/math';
import { Game } from '../../game';
import { createMaterial } from '../../rendering/create-material';
import { toVector3 } from '../../util/three-interop';
import type { Ball } from '../ball';
import { Billboard } from './billboard';

const width = 0.1;

export class BallFirstContact extends Object3D {
  private billboard: Billboard;
  private ring: Mesh;

  constructor(ball: Ball) {
    super();

    this.ring = new Mesh(
      new TorusGeometry(ball.radius * (1 - width / 2), ball.radius * width),
      createMaterial({ roughness: 0.1, metalness: 0, depthTest: false })
    );
    this.ring.renderOrder = 9999;
    this.billboard = new Billboard().add(this.ring);
    this.add(this.billboard);
    Game.add(this, { outline: true });
    this.visible = false;
  }

  public setPosition(position: Vec) {
    this.position.copy(toVector3(position));
  }

  public setInvalid(invalid: boolean) {
    (this.ring.material as MeshPhysicalMaterial).color = invalid
      ? new Color(0xff0000)
      : new Color(0xffffff);
  }

  public update() {
    this.billboard.update();
  }

  public dispose() {
    Game.remove(this);
    Game.dispose(this, this.ring, this.billboard);
  }
}
