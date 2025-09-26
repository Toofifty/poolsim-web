import { Mesh, MeshBasicMaterial, Object3D, TorusGeometry } from 'three';
import type { Ball } from './ball';
import { Arrow } from './arrow';
import { settings } from '../store/settings';
import { getColor } from '../models/ball/create-path-mesh';
import { Game } from '../game';
import { vec } from '../../../common/math';
import { Text } from 'troika-three-text';

export class BallDebug extends Object3D {
  private billboard: Object3D;
  private ring: Mesh;
  /** Contact velocity */
  private arrowU: Arrow;
  private textU: Text;
  /** Velocity */
  private arrowV: Arrow;
  private textV: Text;
  /** Angular velocity */
  private arrowW: Arrow;
  private textW: Text;

  constructor(private ball: Ball) {
    super();

    this.billboard = new Object3D();
    this.visible = false;
    this.ring = new Mesh(
      new TorusGeometry(ball.radius * 1.05, ball.radius * 0.1),
      new MeshBasicMaterial({ color: 0x000000, depthTest: false })
    );
    this.ring.renderOrder = 9999;

    this.arrowU = new Arrow({ color: 0xffff00, factor: 0.2 });
    this.arrowU.position.z -= ball.radius;
    this.arrowV = new Arrow({ color: 0x00ffff, factor: 0.2 });
    this.arrowW = new Arrow({ color: 0xff00ff, factor: 0.01 });

    this.textU = new Text();
    this.textU.color = 0xffff00;
    this.textU.fontSize = 0.025;
    this.textU.position.y = 0.1 + 0.025 * 2;

    this.textV = new Text();
    this.textV.color = 0x00ffff;
    this.textV.fontSize = 0.025;
    this.textV.position.y = 0.1 + 0.025;

    this.textW = new Text();
    this.textW.color = 0xff00ff;
    this.textW.fontSize = 0.025;
    this.textW.position.y = 0.1;

    this.billboard.add(this.ring, this.textU, this.textV, this.textW);
    this.add(this.billboard, this.arrowU, this.arrowV, this.arrowW);
  }

  public update() {
    const { debugBalls } = settings;
    this.visible = settings.debugBalls;

    if (!debugBalls) return;

    this.billboard.quaternion.copy(Game.instance.camera.quaternion);
    (this.ring.material as MeshBasicMaterial).color = getColor(this.ball.state);

    const u = this.ball.physics.getContactVelocity();
    const v = this.ball.physics.velocity;
    const w = this.ball.physics.angularVelocity;

    this.arrowU.setVector(vec.toVector3(u));
    this.arrowV.setVector(vec.toVector3(v));
    this.arrowW.setVector(vec.toVector3(w));

    this.textU.text = 'u ' + vec.toString(u);
    this.textU.sync();

    this.textV.text = 'v ' + vec.toString(v);
    this.textV.sync();

    this.textW.text = 'w ' + vec.toString(w);
    this.textW.sync();
  }

  public dispose() {
    this.traverse(Game.dispose);
  }
}
