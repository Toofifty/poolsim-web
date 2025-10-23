import { ECSComponent } from '@common/ecs';

export class Plane extends ECSComponent {
  public static create() {
    return new Plane();
  }
}
