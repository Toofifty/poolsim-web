import {
  CanvasTexture,
  EquirectangularRefractionMapping,
  Euler,
  Mesh,
  MeshPhysicalMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from 'three';
import { defaultParams } from '../../../common/simulation/physics';
import envMapUrl from '../../assets/envmap.jpg';
import normalMapUrl from '../../assets/scratch_normal.png';
import { createBallTexture } from '../models/ball/create-ball-texture';
import { createMaterial } from '../rendering/create-material';
import { makeTheme } from '../store/theme';
import { Renderable } from './renderable';

const normalMap = new TextureLoader().load(normalMapUrl);
const envMap = new TextureLoader().load(envMapUrl);
envMap.mapping = EquirectangularRefractionMapping;
envMap.colorSpace = SRGBColorSpace;

const geometry = new SphereGeometry(defaultParams.ball.radius, 32, 16);

const texturePool = new Map<number, CanvasTexture>();

export class BallMesh extends Renderable {
  constructor(public mesh: Mesh, public material: MeshPhysicalMaterial) {
    super(mesh);
  }

  public static create({ id }: { id: number }) {
    const theme = makeTheme();
    const texture = texturePool.get(id) ?? createBallTexture(theme, id);
    texturePool.set(id, texture);

    const material = createMaterial({
      envMap,
      envMapRotation: new Euler(Math.PI / 2, 0, 0, 'XYZ'),
      map: texture,
      roughness: theme.balls.roughness,
      metalness: theme.balls.metalness,
      normalMap,
      normalScale: new Vector2(0.5, 0.5),
    });

    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Game.reflectives.push(mesh);
    return new BallMesh(mesh, material);
  }

  public dispose(): void {
    // do not dispose geometry as it is shared between all balls
    (this.mesh.material as MeshPhysicalMaterial).dispose();
  }
}
