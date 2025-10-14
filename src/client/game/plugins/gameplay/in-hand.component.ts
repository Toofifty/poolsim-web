import { ECSComponent } from '@common/ecs';

export class InHand extends ECSComponent {
  public animating = true;

  public static create() {
    return new InHand();
  }
}
