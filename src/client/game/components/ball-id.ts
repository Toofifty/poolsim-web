import { ECSComponent } from '../../../common/ecs';

export class BallId extends ECSComponent {
  constructor(public id: number) {
    super();
  }

  public static create(override: Partial<BallId> = {}) {
    return new BallId(override.id ?? 0);
  }
}
