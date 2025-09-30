import { Mesh, MeshBasicMaterial, Object3D, TorusGeometry } from 'three';
import { Game } from '../game';
import type { Ball } from './ball';

export class BallHighlight extends Object3D {
  private billboard: Object3D;
  private ring: Mesh;

  constructor(private ball: Ball) {
    super();

    this.billboard = new Object3D();

    this.ring = new Mesh(
      new TorusGeometry(ball.radius * 1.05, ball.radius * 0.1),
      new MeshBasicMaterial({ color: ball.color, depthTest: false })
    );
    this.ring.renderOrder = 9999;
    this.billboard.add(this.ring);
    this.add(this.billboard);
  }

  public update() {
    this.billboard.quaternion.copy(Game.instance.camera.quaternion);
  }

  public dispose() {
    this.traverse(Game.dispose);
  }
}
