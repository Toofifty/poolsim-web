import { ECSComponent } from '@common/ecs';

export class InHand extends ECSComponent {
  constructor(public animating = true) {
    super();
  }

  public static create({ animating }: { animating?: boolean } = {}) {
    return new InHand(animating);
  }
}
