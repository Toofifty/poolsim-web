import { Mesh, Object3D, TorusGeometry } from 'three';
import { Game } from '../game';
import { createMaterial } from '../rendering/create-material';
import type { Ball } from './ball';
import { Billboard } from './util/billboard';

export class BallHighlight extends Object3D {
  private billboard: Billboard;
  private ring: Mesh;

  constructor(private ball: Ball) {
    super();

    this.ring = new Mesh(
      new TorusGeometry(ball.radius, ball.radius * 0.1),
      createMaterial({ roughness: 0.1, metalness: 0, depthTest: false })
    );
    this.ring.renderOrder = 9999;
    this.billboard = new Billboard().add(this.ring);
    this.add(this.billboard);
    Game.add(this);
  }

  public update() {
    this.billboard.update();
    this.position.copy(this.ball.position);
  }

  public dispose() {
    Game.remove(this);
    Game.dispose(this, this.ring, this.billboard);
  }
}
