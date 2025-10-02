import { Mesh, Object3D, TorusGeometry } from 'three';
import { Game } from '../game';
import { createMaterial } from '../rendering/create-material';
import type { Ball } from './ball';

export class BallHighlight extends Object3D {
  private billboard: Object3D;
  private ring: Mesh;

  constructor(private ball: Ball) {
    super();

    this.billboard = new Object3D();

    this.ring = new Mesh(
      new TorusGeometry(ball.radius * 1.2, ball.radius * 0.1),
      createMaterial({ roughness: 0.1, metalness: 0 })
    );
    this.ring.renderOrder = 9999;
    this.billboard.add(this.ring);
    this.add(this.billboard);
    Game.add(this);
  }

  public update() {
    this.billboard.quaternion.copy(Game.instance.camera.quaternion);
    this.position.copy(this.ball.position);
  }

  public dispose() {
    Game.remove(this);
    Game.dispose(this, this.ring, this.billboard);
  }
}
