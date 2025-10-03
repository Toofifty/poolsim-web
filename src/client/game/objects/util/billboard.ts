import { Object3D } from 'three';
import { Game } from '../../game';

export class Billboard extends Object3D {
  update(): void {
    this.quaternion.copy(Game.instance.camera.quaternion);
  }
}
