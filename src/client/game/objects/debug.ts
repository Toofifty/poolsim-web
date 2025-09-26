import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from 'three';
import { vec, type Vec } from '../../../common/math';

/** Note - drawing debug shapes can only be done on the main thread */
export class Debug extends Object3D {
  private objects: Map<string, Object3D>;
  private timeouts: Map<string, NodeJS.Timeout>;
  private static instance: Debug;

  constructor() {
    super();
    Debug.instance = this;
    this.objects = new Map();
    this.timeouts = new Map();
  }

  public static drawSphere(
    key: string,
    position: Vec,
    radius: number = 0.005,
    color = 0xff0000
  ) {
    return this.instance.drawSphere(key, position, radius, color);
  }

  public drawSphere(
    key: string,
    position: Vec,
    radius: number = 0.005,
    color = 0xff0000
  ) {
    if (!this.objects.has(key)) {
      this.objects.set(
        key,
        new Mesh(new SphereGeometry(radius), new MeshBasicMaterial({ color }))
      );
      this.add(this.objects.get(key)!);
    }
    this.objects.get(key)?.position.copy(vec.toVector3(position));
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    this.timeouts.set(
      key,
      setTimeout(() => {
        if (this.objects.has(key)) {
          this.remove(this.objects.get(key)!);
          this.objects.delete(key);
          this.timeouts.delete(key);
        }
      }, 1000)
    );
  }
}
