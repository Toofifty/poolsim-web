import { Resource } from '@common/ecs';
import type { Result } from './simulation/result';

export class AccumulatedResult extends Resource {
  public result?: Result;
}
