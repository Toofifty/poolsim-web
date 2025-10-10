import {
  CanvasTexture,
  Mesh,
  SphereGeometry,
  TextureLoader,
  Vector2,
} from 'three';
import { defaultParams } from '../../../common/simulation/physics';
import normalMapUrl from '../../assets/scratch_normal.png';
import { createBallTexture } from '../models/ball/create-ball-texture';
import { createMaterial } from '../rendering/create-material';
import { makeTheme } from '../store/theme';
import { Object3DComponent } from './mesh';

const normalMap = new TextureLoader().load(normalMapUrl);

const geometry = new SphereGeometry(defaultParams.ball.radius, 32, 16);

const texturePool = new Map<number, CanvasTexture>();

export class BallMesh extends Object3DComponent {
  public static create({ id }: { id: number }) {
    const theme = makeTheme();
    const texture = texturePool.get(id) ?? createBallTexture(theme, id);
    texturePool.set(id, texture);

    const material = createMaterial({
      map: texture,
      roughness: theme.balls.roughness,
      metalness: theme.balls.metalness,
      normalMap,
      normalScale: new Vector2(0.5, 0.5),
    });

    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return new BallMesh(mesh);
  }

  public dispose(): void {
    // todo
  }
}
