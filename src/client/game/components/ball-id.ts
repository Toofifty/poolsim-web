import { Component } from '../../../common/ecs';

export class BallId extends Component {
  constructor(public id: number) {
    super();
  }

  public static create(override: Partial<BallId> = {}) {
    return new BallId(override.id ?? 0);
  }
}
