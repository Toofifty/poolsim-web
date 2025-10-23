import { ECSComponent } from '@common/ecs';

export class ImpactArrow extends ECSComponent {
  constructor(public kind: 'cue-ball' | 'object-ball') {
    super();
  }

  public static create({ kind }: { kind: 'cue-ball' | 'object-ball' }) {
    return new ImpactArrow(kind);
  }
}
