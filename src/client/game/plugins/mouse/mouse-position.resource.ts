import { Resource } from '@common/ecs';
import { vec, type Vec } from '@common/math';

export class MousePosition extends Resource {
  public screen: Vec = vec.new(0, 0);
  public world: Vec = vec.new(0, 0, 0);

  public static create() {
    return new MousePosition();
  }
}
